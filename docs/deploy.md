# Deploying OpenHedgeFund

Two deployable units:

| Unit | Where | Image / build |
|---|---|---|
| **Python worker** (`tradingagents.saas.worker`) | **Fly.io** | `Dockerfile.worker` |
| **React app** (`web/`) | **Netlify** (or Vercel) | `npm run build` → `web/dist/` |
| Postgres + Auth + Realtime + Storage | **Supabase Cloud** (already configured) | n/a |

---

## 1. Local end-to-end smoke test (do this first)

Before shipping to Fly, run the worker against your prod Supabase from your laptop. This catches 90% of bugs.

### a. Get the service-role key from Supabase

Open https://supabase.com/dashboard/project/eenypxzkgbirujlmtjqp/settings/api → copy the **`service_role`** key (under "Project API keys"). This bypasses RLS — never put it in the React app, never commit it.

### b. Add to your local `.env`

```
SUPABASE_URL=https://eenypxzkgbirujlmtjqp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
ANTHROPIC_API_KEY=<your-key>          # already set
```

### c. Reinstall the package so it picks up the new `supabase` dep

```bash
uv pip install -e .
```

### d. Start the worker

```bash
python -m tradingagents.saas.worker
```

You should see:

```
2026-05-03 [INFO] tradingagents.saas.worker: Worker online. Polling every 5.0s.
```

### e. Queue a test run from the web UI

1. `cd web && npm run dev`
2. Go to http://localhost:5173/runs/new
3. Enter `NVDA`, pick a recent date, click **Run analysis**
4. You'll be redirected to `/runs/<id>` where the status will show **queued**
5. Within 5s the worker will claim it and the timeline will start lighting up live via Supabase Realtime — agent rows pulse, the spotlight follows, the cost ticker increments
6. After ~3-5 minutes the run flips to **completed** with a verdict

If it fails: worker logs will show traceback. Common causes: missing API key, model name typo in `config_snapshot`, network egress blocked.

---

## 2. Deploy the worker to Fly.io

### One-time setup

```bash
brew install flyctl                        # or curl -L https://fly.io/install.sh | sh
fly auth login
```

### First deploy

From the repo root:

```bash
# Create the app — DON'T deploy yet, secrets aren't set
fly launch \
  --no-deploy \
  --copy-config \
  --name openhedgefund-worker \
  --region iad

# Set secrets — they're encrypted, never hit your terminal history
fly secrets set \
  SUPABASE_URL=https://eenypxzkgbirujlmtjqp.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<paste-service-role> \
  ANTHROPIC_API_KEY=<your-key>

# Deploy
fly deploy

# Watch the logs
fly logs
```

You should see the same `Worker online. Polling every 5.0s.` message in Fly's logs.

### Verifying

Queue a run from your local web UI (still pointing at prod Supabase). The Fly worker will pick it up. You can verify in two places:

- Fly logs: `fly logs` — shows the `Starting run ...` line
- Web UI: the run page lights up via Realtime exactly like local

### Scaling

Single worker handles ~1 run at a time, ~3-5 min per run = 12-20 runs/hour. Scale up when load demands:

```bash
fly scale count 2          # 2 concurrent workers
fly scale memory 4096      # 4GB RAM if you hit OOM on large debates
```

### Cost ballpark at launch scale

- Fly worker (`shared-cpu-2x` / 2GB / single instance): **~$5–10/mo idle**, scales linearly with concurrency
- Anthropic Sonnet usage per run with all 4 analysts + 1 debate round: **~$0.30–1.00**

---

## 3. Deploy the frontend to Netlify

### One-time

```bash
npm install -g netlify-cli
netlify login
```

### First deploy

```bash
cd web

# Production build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

Netlify will give you a `*.netlify.app` URL.

### Set env vars on Netlify

Either via the dashboard or:

```bash
netlify env:set VITE_SUPABASE_URL https://eenypxzkgbirujlmtjqp.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY sb_publishable_NCuD5nigQW2fSrQVIElbUQ_UIYGGwxS
```

Then redeploy: `npm run build && netlify deploy --prod --dir=dist`.

### Custom domain

In the Netlify dashboard → **Domain settings** → **Add custom domain**. Netlify gives you DNS records; point your registrar (or Cloudflare) at them.

### Update Supabase auth redirect URLs (CRITICAL)

After your prod URL is live, magic links and OAuth break until you tell Supabase about it.

Go to https://supabase.com/dashboard/project/eenypxzkgbirujlmtjqp/auth/url-configuration and:

- **Site URL**: change to your prod URL (e.g. `https://openhedgefund.com`)
- **Redirect URLs**: add `https://openhedgefund.com/auth/callback` and `https://openhedgefund.com/**`. Keep `http://localhost:5173/**` for dev.

Then update **Google OAuth** and **GitHub OAuth** apps:

- Google: https://console.cloud.google.com/apis/credentials → your OAuth client → add the prod redirect to **Authorized redirect URIs** (the Supabase callback URL `https://eenypxzkgbirujlmtjqp.supabase.co/auth/v1/callback` already works regardless of frontend domain — but if you have a custom domain on the Supabase project that's different)
- GitHub: https://github.com/settings/developers → your OAuth App → **Homepage URL** = your prod URL; callback URL stays the Supabase one

---

## 4. Hardening checklist (post-launch week)

- [ ] **Sentry** for both web and worker — `pip install sentry-sdk` and `npm install @sentry/react`. Two separate DSNs.
- [ ] **Resend** for branded magic-link sender (Supabase default → spam folder)
- [ ] **Plausible / PostHog** analytics on web
- [ ] **OG image, favicon, meta tags** in `web/index.html`
- [ ] **Rate-limit `/runs/new`** — server-side cap per tier (you can do this in an Edge Function before the run row gets inserted; right now the React app inserts directly via supabase-js)
- [ ] **Tier-based concurrency limit** — Free tier should not be able to queue 50 runs at once. Enforce in the Edge Function or a database trigger.
- [ ] **Stale-run cleanup** — a small cron that flips runs stuck in `running > 30min` back to `failed`.
- [ ] **Stripe** — once ready, gate `/runs/new` by tier and meter overage.

---

## 5. Required env vars summary

### Worker (Fly secrets)

```
SUPABASE_URL=https://eenypxzkgbirujlmtjqp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...      # from Supabase dashboard
ANTHROPIC_API_KEY=...              # or other provider matching the configured LLM

# Optional, by provider you might use:
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
ALPHA_VANTAGE_API_KEY=...

# Tunables (defaults shown)
POLL_INTERVAL_SECONDS=5
HEARTBEAT_SECONDS=8
LOG_LEVEL=INFO
```

### Frontend (Netlify env)

```
VITE_SUPABASE_URL=https://eenypxzkgbirujlmtjqp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NCuD5nigQW2fSrQVIElbUQ_UIYGGwxS
```

The anon key is **safe to expose to the browser** — RLS protects everything. The service-role key must **never** appear here.
