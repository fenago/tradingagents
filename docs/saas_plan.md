# TradingAgents SaaS — Product & Architecture Plan

## 1. Framing

**What we have:** TradingAgents — a CLI-only Python framework. Input is `ticker + date`; output is a Buy / Overweight / Hold / Underweight / Sell decision backed by a debate trace from 4 analysts (market / social / news / fundamentals) → bull-vs-bear research debate → trader → 3-way risk debate → portfolio manager. A persistent memory log auto-resolves past calls against realized return + alpha vs SPY. Multi-LLM, multi-data-vendor, runs locally on the user's keys. Apache 2.0 (upstream TauricResearch).

**Wedge:** the agents themselves are commoditized — anyone can `pip install` them. We monetize everything *around* the run: no-setup hosting, beautiful shareable artifacts, persistent portfolio tracking, scheduling, and a public track record. Position the product like Perplexity-for-stock-analysis, not "an AI hedge fund."

---

## 2. Product UX

### 2.1 The Run — single-ticker analysis page (hero surface)

- **Top:** sticky header — ticker, current price, verdict badge (5-tier rating, color-coded), confidence, target horizon, one-sentence rationale. The only thing 80% of users read.
- **Left rail:** live agent timeline — each agent as a row that animates `pending → running → done`, with token / cost counters. Click any agent to expand its report inline. (This is the CLI's `MessageBuffer` made visual.)
- **Center:** tabbed reports — Market / Social / News / Fundamentals / Bull vs Bear / Trader / Risk Debate / Final Decision. Markdown rendered, citations linking to underlying news / filings.
- **Bull-vs-Bear debate** as a chat-style two-column transcript. Most differentiated visual — most stock tools don't show *disagreement*.
- **Right rail:** price chart for the analyzed window with the model's call pinned on it; "past calls on this ticker" pulled from the memory log with realized alpha. Trust-builder.
- **Bottom:** Share (public read-only URL), Export PDF, Re-run with deeper reasoning.

### 2.2 The Watchlist — portfolio view (retention surface)

- Table of followed tickers: latest rating, change-since-last-run, price, alpha-to-date of past calls.
- Per-row: Re-run now / Schedule weekly.
- **Daily Brief** card — one-paragraph summary across the watchlist, generated each morning. Drives the sticky email habit.

### 2.3 Track Record — public credibility page (acquisition surface)

Aggregate hit rate, mean alpha, calibration by rating tier, performance by sector. The page you link to on Twitter. Memory log already has the data — we just need a view.

**Honesty rule:** publish *all* runs, not just the winners. Cherry-picking will kill the product faster than any competitor.

---

## 3. Admin Surfaces

Two distinct surfaces — do not conflate them.

### 3.1 User Settings (per-account, self-serve) — `/settings`

1. **Defaults for new runs:**
   - LLM provider + deep/quick model (sourced from `model_catalog.MODEL_OPTIONS`)
   - Provider effort: `openai_reasoning_effort` / `google_thinking_level` / `anthropic_effort` — only show the field for the selected provider
   - `max_debate_rounds` (1–3 slider) and `max_risk_discuss_rounds` (1–3 slider), with cost/time deltas next to each
   - Selected analysts (4 checkboxes)
   - Output language
   - Data vendors (4 dropdowns: core stock / indicators / fundamentals / news → yfinance vs alpha_vantage)
2. **API Keys (BYOK)** — paste your own provider keys; a "use platform keys" toggle that flips the bill onto subscription. **Pricing lever:** BYOK → Pro is cheap; platform-keys → Pro costs us tokens.
3. **Billing** — Stripe portal, usage meter (runs this month), invoices.
4. **Data & Privacy** — export decision log, delete account, share-link defaults (public/private).

Every Run page has an "Override defaults" disclosure that lets a user one-off any of these per-run without changing the saved default. That's the workflow that survives daily use.

### 3.2 Operator Admin (staff-only) — `/admin`

Gated by a role flag, not just "logged in":

1. **System Models & Catalog** — enable/disable models per tier, set per-model COGS markup, kill-switch a misbehaving provider.
2. **Pricing & Limits** — per-tier monthly run cap, max debate rounds allowed, allowed analysts, watchlist size. Enforcement *ceilings* on what user settings can request.
3. **Feature Flags** — toggle scheduled runs, PDF export, public sharing without a deploy.
4. **Users** — search, view usage, reset password, comp credits, ban. Read-only + a few action buttons; no full CRUD.
5. **Runs** — table of all runs with cost/duration/status, "View as user" deep link, retry-failed button. Critical for support.
6. **Track Record / Memory Log** — read-only view of the global decision log with filters; also powers the public credibility page.
7. **Announcements** — `cli/announcements.py` already has this concept; reuse for the web app's banner.
8. **Provider Health** — last successful call per provider, error rate. When OpenAI is down at 9am ET, surface it on one screen.

### 3.3 Two design rules

1. **User-settings UI is generated from a single config schema, not hand-coded.** Define the user-editable subset of `DEFAULT_CONFIG` as a Pydantic model with field metadata (label, help text, allowed values, tier gate). Render the form from that schema on both the settings page and the per-run override panel. When we add a config knob in 6 months, the UI updates for free.
2. **Tier gating is server-side, in one place.** UI shows a lock icon, but the source of truth is `validate_run_config(user, requested_config)` on the backend. Never trust the form.

### 3.4 Never expose

- `project_dir`, `results_dir`, `data_cache_dir`, `memory_log_path` — filesystem paths are platform infra, not user config.
- Raw `backend_url` overrides per user — SSRF risk; could exfiltrate prompts via a logging proxy. Gate behind enterprise tier with manual onboarding.

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Next.js or Vite + React Router) | Standard. Next.js if SEO on the Track Record page matters (it should). |
| Auth + DB + Storage + Realtime | Supabase | Postgres with RLS, magic-link/OAuth, file storage for PDF exports, Realtime for live run updates. |
| Light backend | Supabase Edge Functions (Deno/TS) | Stripe webhooks, enqueueing runs, server-side-secret calls. |
| Heavy backend | Dockerized Python — FastAPI + worker | The actual `TradingAgentsGraph.propagate()` lives here. |
| Queue | Postgres-backed (e.g. `pgmq` on Supabase) or Redis (Upstash) | Decouples API request from multi-minute agent run. |
| Payments | Stripe | Subscriptions + metered overage. |
| Observability | Sentry + Supabase logs + a simple cost ledger table | Sufficient for the first year. |

---

## 5. Architecture — answering the "API + Docker + React + Edge Functions" question

**Short answer: yes to all four, but with a critical constraint Edge Functions impose.**

### 5.1 The constraint that drives the design

Supabase Edge Functions are **Deno, with hard wall-clock limits** (currently ~150s on the paid tier, less on free). A single agent run is **1–5 minutes**, sometimes longer with deeper reasoning + more debate rounds. **Edge Functions cannot host the agent run.** They are the wrong tool for that work.

They *are* the right tool for the thin server-side glue around it. So the right partition is:

| Concern | Where it lives | Why |
|---|---|---|
| The agent run (multi-minute Python) | Dockerized Python worker | Long, stateful, heavy, Python-only |
| HTTP control plane (`POST /runs`, `GET /runs/:id`) | FastAPI in the same Docker image | Simple, co-located with the worker code |
| Auth, RLS-gated reads | Supabase client (browser → Postgres directly) | No backend code needed for most reads |
| Webhooks (Stripe), enqueueing a run, calling Python with server secrets | Supabase Edge Functions | Need server-side secrets; need to keep Python API URL private |
| Live progress to the UI | Supabase Realtime on a `run_events` table | Replaces a custom WebSocket server; workers just `INSERT`, clients subscribe |

### 5.2 Request flow — running an analysis

```
[React] → [Edge Function: POST /api/runs]
              ↓ validate user + tier (server-side)
              ↓ insert row into runs table (status=queued)
              ↓ enqueue job (pgmq or Upstash Redis)
              → returns run_id

[Python worker] picks up job
              ↓ calls TradingAgentsGraph.propagate()
              ↓ on every agent state change, INSERT into run_events
              ↓ on completion, UPDATE runs (final_decision, reports)

[React] subscribes to Supabase Realtime channel run:{id}
              ← receives every run_events INSERT live
              ← renders the agent timeline + reports
```

Three things this gets right:

1. **No custom WebSocket infra.** Supabase Realtime piggybacks on Postgres logical replication. Workers just write rows.
2. **Edge Functions stay fast.** They never wait on the agent — they enqueue and return.
3. **The Python framework stays in Python.** No port to TS/Deno. The existing `MessageBuffer` and `StatsCallbackHandler` map cleanly onto `INSERT INTO run_events`.

### 5.3 What goes in Edge Functions vs. direct-to-Supabase

**Edge Functions (need server secrets or call the Python API):**
- `POST /api/runs` — enqueue a job
- `POST /api/runs/:id/cancel` — signal the worker
- `POST /api/stripe/webhook`
- `POST /api/share/:run_id` — create signed public-share URL
- `POST /api/api-keys` — encrypt user-provided BYOK keys before storing

**Direct from React via Supabase client (RLS-gated):**
- Reading `runs`, `run_events`, `watchlist`, `settings`, `memory_log`
- Updating user `settings`
- Most of the app

This means the Edge Functions surface stays small (~10 functions), which is exactly what you want — they're harder to debug than regular code.

### 5.4 What the Python service exposes

A small internal API, **not exposed publicly** — only Edge Functions can reach it (network ACL or shared secret):

```
POST /internal/runs       { run_id, config }     → 202 accepted, picks from queue
GET  /internal/healthz                            → liveness
POST /internal/runs/:id/cancel                    → cooperative cancel
```

The React app never talks to this directly. All run-related writes go: React → Edge Function → Python.

### 5.5 Data model (Supabase / Postgres)

Minimum to ship:

- `users` (Supabase auth) + `profiles` (tier, stripe_customer_id, settings JSONB)
- `runs` (id, user_id, ticker, trade_date, config_snapshot JSONB, status, final_decision, cost_usd, created_at, completed_at)
- `run_events` (id, run_id, ts, agent, event_type, payload JSONB) — append-only, drives the live UI
- `reports` (run_id, section, markdown) — final reports, separate from events for clean reads
- `memory_log` (mirror of `~/.tradingagents/memory/trading_memory.md` schema, but per-user) — the persistent decision log
- `watchlist` (user_id, ticker, notify_daily, notify_on_change)
- `share_links` (run_id, slug, expires_at)
- `usage_ledger` (user_id, ts, run_id, tokens_in, tokens_out, cost_usd) — billing + COGS observability
- `api_keys_encrypted` (user_id, provider, ciphertext) — BYOK; encrypted at rest with a KMS key, never decrypted in the client

RLS: every table keyed on `user_id` with `user_id = auth.uid()`. `runs`, `run_events`, `reports` get a second policy for shared-link access.

---

## 6. Deployment

### 6.1 Recommended targets

| Component | Where | Cost at MVP scale | Notes |
|---|---|---|---|
| React app | **Vercel** (if Next.js) or **Netlify** (if Vite) | Free → $20/mo | Auto-deploy on push. |
| Supabase project | **Supabase Cloud** | Free → $25/mo | Don't self-host until forced to. |
| Edge Functions | Supabase (bundled) | Included | Deno; deploy via `supabase functions deploy`. |
| Python API + worker | **Fly.io** | $5–30/mo | Best DX for Dockerized Python with workers + multi-region. **Recommended.** |
| Queue (if not pgmq) | **Upstash Redis** | Free → $10/mo | Skip if pgmq is sufficient. |
| Object storage (PDFs, large reports) | Supabase Storage | Included | |
| DNS + edge caching | Cloudflare | Free | In front of everything. |

**Fly.io specifically** because: (a) one `fly.toml` deploys a Docker image with a web process *and* a worker process from the same codebase; (b) scale-to-zero on the worker; (c) volumes if we ever need persistent disk; (d) cheap egress; (e) deploys in one command from CI.

Alternatives, ranked: **Railway** (similar DX, slightly pricier at scale, no multi-region) > **Render** (fine, queue-worker pattern is awkward) > **Cloud Run** (scale-to-zero is great, but 60min request limit needs care, no native worker pattern) > **Fargate** (overkill until real scale).

**Do not** try to run the Python agent on Cloudflare Workers, Vercel Edge, or Supabase Edge Functions. Wrong runtime, wrong limits.

### 6.2 Repos

Two repos, not one:

- `tradingagents` (the Python framework — already exists, stays Apache 2.0, accepts upstream)
- `tradingagents-saas` (private) — contains:
  - `apps/web/` — React app
  - `apps/api/` — FastAPI + worker, depends on `tradingagents` from PyPI
  - `supabase/functions/` — Edge Functions
  - `supabase/migrations/` — schema

This way the OSS framework stays clean; commercial wrapping is a separate codebase.

### 6.3 Environments

- **local** — `docker compose up` brings up Postgres + Redis + the Python API. Supabase CLI for local Auth + Edge Functions. React via `vite dev`.
- **preview** — every PR gets a Vercel preview URL pointed at a shared staging Supabase project + Fly staging app.
- **prod** — main branch auto-deploys.

### 6.4 Secrets

- LLM provider keys: env vars on the Python service (Fly secrets). Never on the client. Never in Edge Functions.
- Stripe: webhook secret in the Edge Function only; restricted-key in the Python service for usage reporting.
- Supabase service-role key: Edge Functions only, never the browser.
- BYOK user keys: encrypted in `api_keys_encrypted` with a KMS-held key; decrypted only inside the Python worker right before the LLM call.

### 6.5 First-week deploy plan

1. Day 1: Fork to `tradingagents-saas`, create Supabase project, get React + Auth working end-to-end.
2. Day 2: Schema migrations for `runs` / `run_events` / `profiles`. RLS policies.
3. Day 3: Dockerize the Python service with one `POST /internal/runs` that runs `propagate()` synchronously and writes events.
4. Day 4: Edge Function for `POST /api/runs`; React subscribes to Realtime; live agent timeline working.
5. Day 5: Deploy to Fly + Vercel + Supabase Cloud. End-to-end smoke test.
6. Day 6: Stripe + tier gating.
7. Day 7: Polish the Run page.

Everything else (watchlist, scheduling, PDF, public sharing) is post-MVP.

---

## 7. Pricing

| Tier | Price | Includes | Notes |
|---|---|---|---|
| Free | $0 | 3 runs/mo, default model, public-only shares | Loss leader; drives the Track Record page. |
| Pro | ~$29/mo | 50 runs, watchlist (10), daily briefs, deeper-reasoning model, PDF export | Sweet spot for retail traders. |
| Trader | ~$99/mo | 250 runs, watchlist (50), scheduled re-runs, alerts, custom debate rounds | Real revenue tier. |
| API | usage | Per-run pricing for JSON output | Quant/dev crowd. |

Charge on top of compute. **COGS = LLM tokens** — back-of-envelope a single run on Sonnet/GPT-5-class with 4 analysts + debates before pricing.

---

## 8. Risks

1. **Compliance.** Charging money for "buy/sell" outputs is closer to "investment advice" territory. README disclaimer is fine for OSS; for a paid product, talk to a lawyer about framing as "research/educational" and ToS scope.
2. **Track record honesty.** Publishing all runs (not just winners) is non-negotiable. Memory log already does this — keep it that way.
3. **LLM cost blowups.** A user picking GPT-5 + 3 debate rounds + all analysts can produce a $5+ run. Hard cap per-tier in `validate_run_config`. Alert on cost-per-user-per-day.
4. **Provider rate limits / outages.** Multi-provider is already supported in the framework; surface fallback in the operator admin.
5. **Apache 2.0 dependency on upstream.** A hostile upstream change could break us. Pin to a fork or vendored copy in `tradingagents-saas` if it ever matters; not worth it pre-revenue.
