"""Data-availability sentinels.

Ground rule: data-layer functions return strings to LLM-facing tools.
When the upstream call fails or returns nothing meaningful, we DON'T
return ``""`` — that's indistinguishable from "no relevant data" and
encourages the LLM to fabricate context. Instead we return a sentinel
the agent prompts treat as "skip this section, do not narrate."
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

UNAVAILABLE_PREFIX = "DATA_UNAVAILABLE:"


def unavailable(reason: str) -> str:
    """Build a sentinel string for upstream data failures.

    Agent system prompts treat any output starting with
    ``DATA_UNAVAILABLE:`` as "this section's data did not load — say so
    explicitly and do not invent details."
    """
    msg = reason.strip() or "unspecified upstream failure"
    return f"{UNAVAILABLE_PREFIX} {msg}"


def is_unavailable(s: str | None) -> bool:
    """Check whether a tool response is the unavailable sentinel."""
    if not s:
        return True
    return s.lstrip().startswith(UNAVAILABLE_PREFIX)


def log_and_unavailable(context: str, exc: BaseException) -> str:
    """Convenience: log the exception and return the sentinel."""
    logger.warning("%s — data unavailable: %s", context, exc)
    return unavailable(f"{context}: {type(exc).__name__}: {exc}")
