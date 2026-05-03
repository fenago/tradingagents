"""Translate LangGraph stream chunks into Supabase run_events.

The CLI infers agent status from accumulated graph state (cli/main.py).
We mirror that logic, but instead of updating an in-memory Rich UI, we
emit per-agent lifecycle events into Postgres for the React frontend to
subscribe to over Supabase Realtime.

Event types this module emits:
    - agent_started     — first sight of an agent producing output
    - agent_message     — the agent's full report/argument is now in state
    - agent_completed   — subsequent activity confirms this agent is done

Agent name strings match the persona keys used in
``web/src/lib/agent_personas.ts`` so the frontend's hue/avatar/persona
overrides apply automatically.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from supabase import Client

from .client import append_event

logger = logging.getLogger(__name__)


# Persona keys — must match web/src/lib/agent_personas.ts
ANALYSTS = [
    ("market_report", "Market Analyst"),
    ("sentiment_report", "Social Analyst"),
    ("news_report", "News Analyst"),
    ("fundamentals_report", "Fundamentals Analyst"),
]

DEBATE_KEYS = {
    "bull_history": "Bull Researcher",
    "bear_history": "Bear Researcher",
    "judge_decision": "Research Manager",
}

RISK_KEYS = {
    "aggressive_history": "Aggressive Analyst",
    "neutral_history": "Neutral Analyst",
    "conservative_history": "Conservative Analyst",
    "judge_decision": "Portfolio Manager",
}


@dataclass
class StreamTranslator:
    """Stateful translator: feed it chunks, it emits events.

    Each agent has three event types: started, message, completed.
    We track which we've already emitted so we don't duplicate.
    """

    client: Client
    run_id: str
    started: set[str] = field(default_factory=set)
    messaged: set[str] = field(default_factory=set)
    completed: set[str] = field(default_factory=set)
    last_debate_text: Dict[str, str] = field(default_factory=dict)
    last_risk_text: Dict[str, str] = field(default_factory=dict)

    def emit(
        self,
        agent: str,
        event_type: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        append_event(
            self.client,
            self.run_id,
            agent=agent,
            event_type=event_type,
            payload=payload,
        )

    def start(self, agent: str) -> None:
        if agent in self.started:
            return
        self.started.add(agent)
        self.emit(agent, "agent_started")

    def message(self, agent: str, content: str) -> None:
        if not content or agent in self.messaged:
            return
        self.messaged.add(agent)
        self.emit(agent, "agent_message", {"content": content})

    def complete(self, agent: str) -> None:
        if agent in self.completed:
            return
        self.completed.add(agent)
        self.start(agent)  # in case we never saw a separate start
        self.emit(agent, "agent_completed")

    # --------------------------- Phase handlers -------------------------- #

    def process_chunk(self, chunk: Dict[str, Any]) -> None:
        """Inspect one streaming chunk and emit any new events."""
        # Phase 1 — Analysts (run in parallel; each finishes when its
        # report key appears with non-empty content).
        for state_key, persona in ANALYSTS:
            content = chunk.get(state_key)
            if content and isinstance(content, str) and content.strip():
                self.start(persona)
                self.message(persona, content)
                self.complete(persona)

        # Phase 2 — Research debate
        debate = chunk.get("investment_debate_state")
        if isinstance(debate, dict):
            for state_key, persona in DEBATE_KEYS.items():
                text = (debate.get(state_key) or "").strip()
                prev = self.last_debate_text.get(state_key, "")
                if not text or text == prev:
                    continue
                self.last_debate_text[state_key] = text

                if persona == "Research Manager":
                    # Judge decision arrives as a single rendered memo.
                    self.start(persona)
                    self.message(persona, text)
                    self.complete(persona)
                else:
                    # Bull/Bear: history is appended-to over rounds. Take the
                    # newest segment by removing the prior text prefix.
                    new_segment = (
                        text[len(prev) :].strip() if text.startswith(prev) else text
                    )
                    self.start(persona)
                    if new_segment and persona not in self.messaged:
                        self.message(persona, new_segment)
                    # Don't mark complete until the judge decision lands

        # Phase 3 — Trader
        trader_plan = chunk.get("trader_investment_plan")
        if (
            trader_plan
            and isinstance(trader_plan, str)
            and trader_plan.strip()
        ):
            self.start("Trader")
            self.message("Trader", trader_plan)
            self.complete("Trader")
            # Bull/Bear get marked complete when the trader runs (i.e. the
            # debate has resolved and the research manager has spoken).
            self.complete("Bull Researcher")
            self.complete("Bear Researcher")

        # Phase 4 — Risk team + Portfolio Manager
        risk = chunk.get("risk_debate_state")
        if isinstance(risk, dict):
            for state_key, persona in RISK_KEYS.items():
                text = (risk.get(state_key) or "").strip()
                prev = self.last_risk_text.get(state_key, "")
                if not text or text == prev:
                    continue
                self.last_risk_text[state_key] = text

                if persona == "Portfolio Manager":
                    self.start(persona)
                    self.message(persona, text)
                    self.complete(persona)
                    # Risk team finishes when PM has spoken
                    self.complete("Aggressive Analyst")
                    self.complete("Neutral Analyst")
                    self.complete("Conservative Analyst")
                else:
                    new_segment = (
                        text[len(prev) :].strip() if text.startswith(prev) else text
                    )
                    self.start(persona)
                    if new_segment and persona not in self.messaged:
                        self.message(persona, new_segment)

    def finalize(self, final_state: Dict[str, Any]) -> None:
        """At the end of the run, ensure every agent is marked complete and
        every message we may have missed is emitted."""
        # Catch any messages that landed only in final_state
        for state_key, persona in ANALYSTS:
            content = final_state.get(state_key)
            if content and isinstance(content, str) and content.strip():
                self.start(persona)
                self.message(persona, content)
                self.complete(persona)

        debate = final_state.get("investment_debate_state") or {}
        if debate:
            for state_key, persona in DEBATE_KEYS.items():
                text = (debate.get(state_key) or "").strip()
                if not text:
                    continue
                self.start(persona)
                if persona not in self.messaged:
                    self.message(persona, text)
                self.complete(persona)

        trader_plan = final_state.get("trader_investment_plan")
        if trader_plan and isinstance(trader_plan, str) and trader_plan.strip():
            self.start("Trader")
            self.message("Trader", trader_plan)
            self.complete("Trader")

        risk = final_state.get("risk_debate_state") or {}
        if risk:
            for state_key, persona in RISK_KEYS.items():
                text = (risk.get(state_key) or "").strip()
                if not text:
                    continue
                self.start(persona)
                if persona not in self.messaged:
                    self.message(persona, text)
                self.complete(persona)


# ----------------------------- Reports ------------------------------------ #


def extract_reports(final_state: Dict[str, Any]) -> List[tuple[str, str]]:
    """Pull markdown sections from the final graph state for the reports table.

    Section keys must match REPORT_SECTIONS in web/src/routes/Run.tsx.
    """
    sections: List[tuple[str, str]] = []
    for key in (
        "market_report",
        "sentiment_report",
        "news_report",
        "fundamentals_report",
        "trader_investment_plan",
        "final_trade_decision",
    ):
        value = final_state.get(key)
        if isinstance(value, str) and value.strip():
            sections.append((key, value))

    # investment_plan: the research manager's judgment lives in the debate state
    debate = final_state.get("investment_debate_state") or {}
    judge = debate.get("judge_decision") if isinstance(debate, dict) else None
    if isinstance(judge, str) and judge.strip():
        sections.append(("investment_plan", judge))

    return sections
