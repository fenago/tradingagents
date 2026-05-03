# Documentation TODOs

Audit of the TradingAgents pipeline. Findings are grouped by severity. Each item lists the gap, the file:line evidence, and the impact. The framework is research-only — but several items below cause **silent data fabrication or look-ahead bias**, which means current outputs may be misleading even for research purposes.

---

## Critical

### 1. Social Media Analyst has no social media data source

**Gap.** `tradingagents/agents/analysts/social_media_analyst.py:11-13` wires a single tool: `get_news`. The system prompt instructs the agent to analyze "social media posts… public sentiment… what people feel each day," but `get_news` (`tradingagents/agents/utils/news_data_tools.py:5-21`) routes to the configured news vendor — by default `yfinance`, which returns Yahoo Finance news headlines only. There is no Reddit, X/Twitter, StockTwits, Discord, or any other social/sentiment data source in the codebase.

**Impact.** The agent's "sentiment" output is the LLM writing in the voice of a sentiment analyst, drawing on news headlines plus training-data priors. Per-platform breakdowns, post counts, and "% bullish" figures are fabricated narrative.

**Options.**
1. Add a real social/sentiment vendor (Reddit via PRAW, StockTwits public API, paid sentiment provider). Wire it through `route_to_vendor` and add `social_data` to `data_vendors` in `default_config.py`.
2. Until (1), rename the agent to "News Sentiment Analyst" and tighten the prompt so it only summarizes news-derived sentiment.
3. Document the limitation in `README.md`.

---

### 2. Look-ahead bias in fundamentals filtering

**Gap.** `tradingagents/dataflows/stockstats_utils.py:106-107` filters balance-sheet / cash-flow / income-statement columns by **fiscal period end date** rather than **filing date**. A statement for fiscal period 2025-12-31 is typically *filed* in mid-February 2026.

**Impact.** Two opposite errors at once. (a) On a backtest run dated 2026-01-15, the code may surface fiscal-2025 numbers that were not yet public — classic look-ahead bias inflating apparent skill. (b) On a run dated 2026-02-15, the agent misses fiscal-2025 numbers it actually would have seen, distorting analysis the other way. Either way, every fundamentals-driven backtest is unreliable until this is fixed.

**Fix sketch.** Use the SEC filing date (8-K/10-K/10-Q `acceptedDatetime`) to gate visibility, not the fiscal period end. yfinance does not expose this cleanly; may require Alpha Vantage or SEC EDGAR.

---

### 3. Silent failures across the data layer return empty strings

**Gap.** `tradingagents/dataflows/y_finance.py:241-243` (and similar handlers across the dataflows package) return `""` on exception. No log, no error surfaced to the agent.

**Impact.** When a yfinance call fails, the LLM receives an empty string and **narrates around the absence** — producing plausible-sounding but unfounded statements ("Insider buying shows confidence"). Failures are indistinguishable from "no relevant data," and downstream agents cannot tell the difference. This is the single largest source of fabricated output in the system.

**Fix sketch.** Return a sentinel like `"DATA_UNAVAILABLE: <reason>"` and have agent prompts treat that token as a hard "skip this section" instruction. Log the underlying exception.

---

### 4. Structured-output parsing has no post-invoke validation

**Gap.** `tradingagents/agents/utils/structured.py:64-65` invokes `structured_llm.invoke()` and immediately calls `render()` on the result without confirming the model returned a valid Pydantic instance.

**Impact.** If the provider returns a non-schema dict or malformed object, `render()` falls back to free-text output silently. Nothing logs which fields were missing, so the structured Trader / Research Manager / Portfolio Manager trio (the v0.2.4 headline feature) can quietly degrade to unstructured output without any signal.

**Fix sketch.** After `invoke`, isinstance-check against the expected Pydantic class; on failure, log the field-level validation error and the raw response.

---

## Major

### 5. `get_insider_transactions` is imported but never bound

**Gap.** `tradingagents/agents/analysts/fundamentals_analyst.py:8` imports `get_insider_transactions`, but it is not in the tools list at lines 19–23.

**Impact.** Dead capability. The tool exists and works, but the agent cannot reach it. If the prompt mentions insider activity (or the LLM expects the tool by name), it will hallucinate insider data.

**Fix.** Add `get_insider_transactions` to the bound tools list, or remove the import.

---

### 6. News vendor fallback doesn't validate freshness

**Gap.** `tradingagents/dataflows/interface.py:150-160` retries on `AlphaVantageRateLimitError` but not on "empty result." For micro-caps, delisted tickers, or off-trading-hour windows, an empty DataFrame counts as success.

**Impact.** Analyst reports "latest news: (empty)" without flagging that the data source returned nothing relevant. Combined with #3, the LLM may invent context.

**Fix.** Treat empty results as a transient failure that triggers fallback to the next configured vendor.

---

### 7. Graph state has no freshness or completeness metadata

**Gap.** `tradingagents/graph/propagation.py:22-55` stores `market_report`, `sentiment_report`, `news_report`, `fundamentals_report` as bare strings.

**Impact.** Downstream agents (researchers, trader, portfolio manager) cannot distinguish "yesterday's full data" from "the API failed and we have an empty string." Bull/bear debates may proceed against a vacuum (#10).

**Fix sketch.** Wrap each report in a small object: `{"text": str, "fetched_at": datetime, "vendor": str, "complete": bool}`.

---

## Minor

### 8. No integration test for agent tool bindings

**Gap.** `tests/test_structured_agents.py` covers render functions and fallback behavior but does not assert that each agent's bound tool list matches the expected set.

**Impact.** A typo or accidental removal during refactor (like #5) would not be caught.

**Fix.** Add a parametrized test that imports each agent factory, builds it with a stub LLM, and asserts the bound tool names against a fixture.

---

### 9. README claims "sentiment scoring algorithms" — none exist

**Gap.** `README.md:71` states: "Sentiment Analyst: Analyzes social media and public sentiment using sentiment scoring algorithms…"

**Impact.** Marketing claim unsupported by code (see #1). Misleads users about capability.

**Fix.** Edit the README line to match reality once #1 is decided.

---

### 10. Bull/bear debate runs even when input reports are empty

**Gap.** Researchers (e.g. `tradingagents/agents/researchers/bull_researcher.py:10-12`) read `market_report` / `sentiment_report` / `fundamentals_report` / `news_report` from state without checking for empty content.

**Impact.** If one analyst's data layer failed (#3), the corresponding report is `""`. The bull and bear still debate — over a vacuum. One side argues against nothing; the LLM fills in plausible but unfounded counterarguments.

**Fix.** After analyst nodes complete, gate researcher entry on a non-empty-reports check; either skip the debate or surface a "data incomplete" flag in state.

---

### 11. Cache filename case mismatch

**Gap.** `tradingagents/dataflows/stockstats_utils.py:71` uses `safe_symbol` (preserves case) for the cache filename; `yf.download()` at `:78` uppercases the symbol.

**Impact.** Passing `"nvda"` and `"NVDA"` in the same session creates two different cache files for the same underlying data. Storage waste, plus possible inconsistency if one path goes through normalization and the other doesn't.

**Fix.** Uppercase the symbol once at entry and use that everywhere.

---

### 12. Zero-data scenarios produce silent N/A indicator reports

**Gap.** If `get_stock_data()` returns "No data found for symbol…" (`y_finance.py:27`), the Market Analyst still calls `get_indicators()`, which dutifully returns N/A for all 8 indicators.

**Impact.** Analyst reports "all indicators N/A" without flagging that the underlying price series was missing — the LLM then narrates around it. Same family as #3 / #6.

**Fix.** Short-circuit the indicator pass when the price series is empty and surface a clear "no price data" sentinel.

---

## Already handled (do not re-flag)

- Anthropic key in `.env` (gitignored).
- Python pinned to 3.13 to avoid the `tiktoken==0.9.0` source-build failure on 3.14.
- `main.py` `debug=True` causes the Portfolio Manager output to repeat across LangGraph node updates — set `debug=False` for a clean tail.
- Ticker path-traversal validation (PR #618).

---

## Triage suggestion

If only two things get fixed, fix **#3 (silent empty-string failures)** and **#2 (fundamentals look-ahead)**. Together they account for most of the "the LLM sounds confident but the data wasn't really there" surface area.
