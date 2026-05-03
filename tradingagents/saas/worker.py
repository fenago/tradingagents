"""SaaS worker — polls Supabase for queued runs and executes them.

Run with:
    python -m tradingagents.saas.worker

Required env vars:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    ANTHROPIC_API_KEY        (or whichever provider matches the configured LLM)

Optional:
    POLL_INTERVAL_SECONDS    default 5
    HEARTBEAT_SECONDS        how often to flush cost_usd while a run is active (default 8)
"""

from __future__ import annotations

import logging
import os
import signal
import sys
import threading
import time
import traceback
from typing import Any, Dict, Optional

from supabase import Client

from cli.stats_handler import StatsCallbackHandler
from tradingagents.agents.utils.rating import parse_rating
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.graph.trading_graph import TradingAgentsGraph

from .client import (
    append_event,
    claim_next_queued_run,
    make_client,
    update_run,
    upsert_reports,
    utcnow_iso,
)
from .events import StreamTranslator, extract_reports

logger = logging.getLogger(__name__)


# Rough Anthropic Sonnet-class pricing for live cost tracking.
# Stays approximate — Stripe metered billing later replaces this with
# authoritative usage events.
PRICE_PER_1K_INPUT = 0.003  # USD
PRICE_PER_1K_OUTPUT = 0.015


def estimate_cost(tokens_in: int, tokens_out: int) -> float:
    return (
        tokens_in / 1000.0 * PRICE_PER_1K_INPUT
        + tokens_out / 1000.0 * PRICE_PER_1K_OUTPUT
    )


# --------------------------- Run execution ------------------------------- #


def build_config(snapshot: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge user-supplied run config snapshot over the framework defaults."""
    config = DEFAULT_CONFIG.copy()
    if isinstance(snapshot, dict):
        for k, v in snapshot.items():
            if k in {"selected_analysts", "data_vendors"}:
                # Pass through, framework reads these
                config[k] = v
            elif k in config:
                config[k] = v
    return config


def selected_analyst_keys(config: Dict[str, Any]) -> list[str]:
    raw = config.get("selected_analysts")
    if isinstance(raw, list) and raw:
        return [str(x) for x in raw]
    return ["market", "social", "news", "fundamentals"]


def run_one(client: Client, run: Dict[str, Any]) -> None:
    """Execute a single claimed run end-to-end."""
    run_id = run["id"]
    ticker = run["ticker"]
    trade_date = str(run["trade_date"])
    snapshot = run.get("config_snapshot") or {}

    logger.info("Starting run %s — %s on %s", run_id, ticker, trade_date)
    append_event(
        client,
        run_id,
        agent="System",
        event_type="run_started",
        payload={"ticker": ticker, "trade_date": trade_date},
    )

    config = build_config(snapshot)
    analysts = selected_analyst_keys(config)

    stats = StatsCallbackHandler()
    translator = StreamTranslator(client=client, run_id=run_id)

    # Heartbeat thread: keeps the run row's cost_usd current so the
    # frontend's animated CostTicker stays meaningful during execution.
    stop_heartbeat = threading.Event()

    def heartbeat() -> None:
        interval = float(os.environ.get("HEARTBEAT_SECONDS", "8"))
        while not stop_heartbeat.wait(interval):
            s = stats.get_stats()
            try:
                update_run(
                    client,
                    run_id,
                    cost_usd=estimate_cost(s["tokens_in"], s["tokens_out"]),
                    tokens_in=s["tokens_in"],
                    tokens_out=s["tokens_out"],
                )
            except Exception as e:  # noqa: BLE001
                logger.warning("Heartbeat update failed: %s", e)

    hb_thread = threading.Thread(target=heartbeat, daemon=True)
    hb_thread.start()

    try:
        graph = TradingAgentsGraph(
            selected_analysts=analysts,
            debug=False,
            config=config,
            callbacks=[stats],
        )

        # Stream the analysis chunk by chunk so the frontend lights up live.
        past_context = graph.memory_log.get_past_context(ticker) or ""
        init_state = graph.propagator.create_initial_state(
            ticker, trade_date, past_context=past_context
        )
        args = graph.propagator.get_graph_args(callbacks=[stats])

        final_chunk: Optional[Dict[str, Any]] = None
        for chunk in graph.graph.stream(init_state, **args):
            translator.process_chunk(chunk)
            final_chunk = chunk

        if final_chunk is None:
            raise RuntimeError("Graph produced no chunks.")

        translator.finalize(final_chunk)

        # Persist outputs
        upsert_reports(client, run_id, extract_reports(final_chunk))

        rating = None
        verdict_value: Optional[str] = None
        final_decision = final_chunk.get("final_trade_decision") or ""
        if final_decision:
            try:
                rating = parse_rating(final_decision)
            except Exception:  # noqa: BLE001
                rating = None
        if rating:
            verdict_value = rating.lower()
            # Map non-DB enum values defensively
            if verdict_value not in {
                "buy",
                "overweight",
                "hold",
                "underweight",
                "sell",
            }:
                verdict_value = "hold"

        # Pull a one-liner from the final memo: first sentence after the rating
        one_liner = _first_sentence(final_decision)

        s = stats.get_stats()
        update_run(
            client,
            run_id,
            status="completed",
            completed_at=utcnow_iso(),
            cost_usd=estimate_cost(s["tokens_in"], s["tokens_out"]),
            tokens_in=s["tokens_in"],
            tokens_out=s["tokens_out"],
            verdict=verdict_value,
            one_liner=one_liner,
        )

        # Memory log: store the decision so future runs reflect on it.
        try:
            graph.memory_log.store_decision(
                ticker=ticker,
                trade_date=trade_date,
                final_trade_decision=final_decision,
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("Memory log write failed: %s", e)

        append_event(
            client,
            run_id,
            agent="System",
            event_type="run_completed",
            payload={"verdict": verdict_value, "cost_usd": estimate_cost(s["tokens_in"], s["tokens_out"])},
        )
        logger.info("Completed run %s — verdict=%s", run_id, verdict_value)

    except Exception as e:
        logger.error("Run %s failed: %s\n%s", run_id, e, traceback.format_exc())
        append_event(
            client,
            run_id,
            agent="System",
            event_type="run_failed",
            payload={"error": str(e)},
        )
        try:
            update_run(
                client,
                run_id,
                status="failed",
                completed_at=utcnow_iso(),
                error_message=str(e)[:1000],
            )
        except Exception:  # noqa: BLE001
            logger.exception("Could not write failure status for %s", run_id)

    finally:
        stop_heartbeat.set()
        hb_thread.join(timeout=2)


def _first_sentence(text: str, max_chars: int = 220) -> Optional[str]:
    if not text:
        return None
    cleaned = " ".join(text.strip().split())
    # Skip leading markdown headers
    while cleaned.startswith("#"):
        idx = cleaned.find("\n")
        if idx < 0:
            cleaned = cleaned.lstrip("#").strip()
            break
        cleaned = cleaned[idx + 1 :].strip()
    for delim in (". ", "! ", "? "):
        idx = cleaned.find(delim)
        if 0 < idx < max_chars:
            return cleaned[: idx + 1].strip()
    return cleaned[:max_chars].rsplit(" ", 1)[0]


# ------------------------------- Main loop -------------------------------- #


_should_run = True


def _shutdown(_signum: int, _frame: Any) -> None:
    global _should_run
    logger.info("Shutdown signal received — finishing current run, then exiting.")
    _should_run = False


def main() -> int:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO"),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    try:
        client = make_client()
    except Exception as e:  # noqa: BLE001
        logger.error("Cannot start worker: %s", e)
        return 1

    poll_interval = float(os.environ.get("POLL_INTERVAL_SECONDS", "5"))
    logger.info("Worker online. Polling every %.1fs.", poll_interval)

    while _should_run:
        try:
            run = claim_next_queued_run(client)
            if run is None:
                time.sleep(poll_interval)
                continue
            run_one(client, run)
        except Exception as e:  # noqa: BLE001
            logger.error("Poll loop error: %s\n%s", e, traceback.format_exc())
            time.sleep(poll_interval)

    logger.info("Worker exiting cleanly.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
