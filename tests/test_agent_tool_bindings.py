"""Smoke test: each analyst agent binds the tools we expect.

A typo or accidental removal during refactor would silently leave the
LLM with no way to fetch a piece of data. Catch that here at test time
instead of in production where the model will narrate around the
absence.
"""
from __future__ import annotations

from unittest.mock import MagicMock


def _bound_tool_names(create_fn) -> set[str]:
    """Build the agent with a stub LLM and return the bound tool names.

    Each ``create_*`` factory returns a node-callable that, on first call
    with a state dict, calls ``llm.bind_tools(tools)``. Inspecting the
    captured ``bind_tools`` argument gives us the tool list without
    actually invoking the LLM.
    """
    llm = MagicMock()
    bound = llm.bind_tools
    bound.return_value = MagicMock()
    node = create_fn(llm)
    state = {
        "trade_date": "2026-01-15",
        "company_of_interest": "NVDA",
        "messages": [],
    }
    try:
        node(state)
    except Exception:
        # The downstream invocation will fail on the mock; we only care
        # that bind_tools was called by the time it does.
        pass
    if not bound.call_args_list:
        return set()
    tools = bound.call_args_list[0][0][0]
    return {getattr(t, "name", getattr(t, "__name__", str(t))) for t in tools}


def test_market_analyst_tools():
    from tradingagents.agents.analysts.market_analyst import (
        create_market_analyst,
    )

    names = _bound_tool_names(create_market_analyst)
    # At minimum, the market analyst must be able to read price + indicators
    assert any("indicator" in n.lower() or "price" in n.lower() for n in names), (
        f"Market analyst is missing price/indicator tooling. Bound: {names}"
    )


def test_fundamentals_analyst_tools():
    from tradingagents.agents.analysts.fundamentals_analyst import (
        create_fundamentals_analyst,
    )

    names = _bound_tool_names(create_fundamentals_analyst)
    expected = {
        "get_fundamentals",
        "get_balance_sheet",
        "get_cashflow",
        "get_income_statement",
        "get_insider_transactions",  # was imported but unbound — guard it now
    }
    missing = expected - names
    assert not missing, (
        f"Fundamentals analyst missing tools: {sorted(missing)}. Bound: {sorted(names)}"
    )


def test_news_analyst_tools():
    from tradingagents.agents.analysts.news_analyst import create_news_analyst

    names = _bound_tool_names(create_news_analyst)
    assert names, "News analyst is bound to no tools at all"
    assert any("news" in n.lower() for n in names), (
        f"News analyst is missing news tooling. Bound: {names}"
    )


def test_social_analyst_tools():
    from tradingagents.agents.analysts.social_media_analyst import (
        create_social_media_analyst,
    )

    names = _bound_tool_names(create_social_media_analyst)
    assert names, "Social analyst is bound to no tools at all"
