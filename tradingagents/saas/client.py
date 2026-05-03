"""Supabase service-role client + queue helpers.

The service role key bypasses RLS, so this client must NEVER be used in any
context the React frontend can reach. Worker only.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

from supabase import Client, create_client

logger = logging.getLogger(__name__)


def utcnow_iso() -> str:
    """ISO8601 UTC timestamp suitable for Postgres timestamptz columns."""
    return datetime.now(timezone.utc).isoformat()


def make_client() -> Client:
    """Build a Supabase client from env vars."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the worker."
        )
    return create_client(url, key)


# ----------------------------- Queue ops ---------------------------------- #


def claim_next_queued_run(client: Client) -> Optional[Dict[str, Any]]:
    """Atomically claim one queued run and mark it running.

    We avoid native FOR UPDATE SKIP LOCKED here (Supabase REST has no direct
    knob for it) and lean on the optimistic-lock pattern: read one queued
    row, attempt to update it conditioned on its still being queued. If the
    update returns no rows, another worker beat us — try again next tick.
    """
    queued = (
        client.table("runs")
        .select("*")
        .eq("status", "queued")
        .order("queued_at", desc=False)
        .limit(1)
        .execute()
    )
    rows = queued.data or []
    if not rows:
        return None

    row = rows[0]
    res = (
        client.table("runs")
        .update({"status": "running", "started_at": utcnow_iso()})
        .eq("id", row["id"])
        .eq("status", "queued")  # optimistic lock
        .execute()
    )
    if not res.data:
        # Another worker claimed it first. Caller will retry.
        return None
    return res.data[0]


def update_run(client: Client, run_id: str, **patch: Any) -> None:
    if not patch:
        return
    client.table("runs").update(patch).eq("id", run_id).execute()


def append_event(
    client: Client,
    run_id: str,
    *,
    agent: str,
    event_type: str,
    payload: Optional[Dict[str, Any]] = None,
) -> None:
    """Insert a single run_events row. Best-effort — logs and continues on error."""
    try:
        client.table("run_events").insert(
            {
                "run_id": run_id,
                "agent": agent,
                "event_type": event_type,
                "payload": payload or {},
            }
        ).execute()
    except Exception as e:  # noqa: BLE001 — log and continue
        logger.warning("Failed to insert run_event for %s: %s", run_id, e)


def upsert_reports(
    client: Client, run_id: str, sections: Iterable[tuple[str, str]]
) -> None:
    """Write final report sections into the reports table."""
    payload: List[Dict[str, Any]] = [
        {"run_id": run_id, "section": section, "markdown": markdown}
        for section, markdown in sections
        if markdown and markdown.strip()
    ]
    if not payload:
        return
    client.table("reports").upsert(payload).execute()
