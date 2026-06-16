# Deploy to Vercel + Turso

Runbook for hosting RentTools on [Vercel](https://vercel.com) with a [Turso](https://turso.tech) libSQL database. No droplet, nginx, or systemd required.

For self-hosted VPS deployment, see [DROPLET-SETUP.md](./DROPLET-SETUP.md).

---

## What you get

- Next.js app on `https://<project>.vercel.app`
- Turso cloud SQLite (same Prisma adapter as local dev)
- Calendar sync every 10 minutes via [Vercel Cron](https://vercel.com/docs/cron-jobs) (`vercel.json`)
- Git push → automatic deploy

Schema changes are **not** applied on deploy — run `npm run db:push` locally when `prisma/push-schema.ts` changes (same model as the droplet runbook).

---

## Prerequisites

- Node.js 20+ locally
- [Turso CLI](https://docs.turso.tech/cli/introduction): `curl -sSfL https://get.tur.so/install.sh | bash`
- Vercel account (Hobby free tier is enough to start)
- GitHub repo connected to Vercel (or `vercel` CLI)

---

## 1. Create the Turso database

```bash
turso auth login
turso db create renttools-prod --region fra   # pick closest region
turso db show renttools-prod --url              # → TURSO_DATABASE_URL
turso db tokens create renttools-prod           # → TURSO_AUTH_TOKEN
```

Save both values — you will need them in Vercel and locally for schema push.

**Preview vs production:** create a second database (e.g. `renttools-preview`) for Vercel Preview deployments so preview branches never touch production data.

---

## 2. Apply schema and seed (local, one-time)

Copy Turso credentials into `.env.local` (do **not** set `DATABASE_URL`):

```bash
TURSO_DATABASE_URL=libsql://renttools-prod-<org>.turso.io
TURSO_AUTH_TOKEN=<token>
JWT_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
```

Then:

```bash
npm install
npm run db:push
npm run db:seed          # optional: creates sample superadmin (prints password once)
```

Verify with the Turso CLI:

```bash
turso db shell renttools-prod "SELECT COUNT(*) FROM User;"
```

---

## 3. Deploy to Vercel

### Option A — GitHub import

1. [vercel.com/new](https://vercel.com/new) → import this repo
2. Framework preset: **Next.js** (auto-detected)
3. Build command: `npm run build` (default)
4. Install command: `npm install` (default; `postinstall` runs `prisma generate`)

### Option B — CLI

```bash
npm i -g vercel
vercel link
vercel env pull .env.vercel.local   # optional: inspect remote env locally
vercel --prod
```

---

## 4. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

### Required (Production)

| Variable | Example / notes |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://renttools-prod-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | Token from `turso db tokens create` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `CRON_SECRET` | `openssl rand -hex 32` (different from JWT) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` |

**Do not set** `DATABASE_URL` on Vercel — leave it unset so [`src/lib/prisma.ts`](../src/lib/prisma.ts) uses Turso.

### Cron auth

Vercel Cron reads `CRON_SECRET` from project env and sends:

```
Authorization: Bearer <CRON_SECRET>
```

The app's [`/api/calendar/cron`](../src/app/api/calendar/cron/route.ts) accepts this header (or `?secret=` for manual/external schedulers).

### Optional

| Variable | Purpose |
| --- | --- |
| `GOOGLE_GEMINI_API_KEY` | Passport OCR |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | Google sign-in |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same as client ID (client bundle) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email verification + password reset |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `SENTRY_AUTH_TOKEN` | Source map upload at build time |

See [`.env.example`](../.env.example) for full reference.

---

## 5. Verify deployment

After the first successful deploy:

```bash
curl -s https://your-project.vercel.app/api/health | jq
# Expect: { "status": "ok", "db": "ok", ... }
```

Manual checklist:

1. **Health** — `/api/health` returns 200 with `"db": "ok"`
2. **Sign up** — create an account (email or Google if configured)
3. **Property + iCal** — add a property, paste a test iCal export URL
4. **Calendar sync** — trigger manually:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://your-project.vercel.app/api/calendar/cron
   ```

5. **Cron** — wait 10 minutes; check admin sync logs or `sync_last_run` in `AppSettings`

---

## 6. Function duration and plans

[`vercel.json`](../vercel.json) sets `maxDuration: 60` for calendar sync and passport extraction routes.

| Vercel plan | Max function duration |
| --- | --- |
| Hobby | **10 seconds** |
| Pro | Up to 300 seconds (60 configured) |

Early onboarding with few properties usually fits in 10s. If sync returns 504 or times out as you grow, upgrade to Pro or refactor sync into a job queue.

---

## Known limitations on Vercel

| Feature | Status |
| --- | --- |
| Core app + Turso | Works |
| Vercel Cron calendar sync | Works (watch Hobby 10s timeout) |
| Blog covers in `public/blog-covers/` | Works (committed static assets) |
| Admin blog image upload | **Does not persist** — writes to local disk; use committed covers or add Vercel Blob later |
| `*.vercel.app` SEO | Blocked by [`isStagingHost`](../src/lib/seo-host.ts) — intentional; add a custom domain for search indexing |
| In-memory rate limits | Per-function-isolate; may be inconsistent if Vercel runs many concurrent lambdas |
| Schema on deploy | **Not automatic** — run `npm run db:push` locally after schema changes |

---

## Custom domain (later)

When you add a custom domain in Vercel:

1. Update `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com`
2. Add the domain to Google OAuth authorized origins/redirect URIs (if using Google sign-in)
3. Redeploy — `isStagingHost` will allow indexing on your apex domain

---

## Troubleshooting

**Build fails with "No database configured"**

CI/build uses a dummy `DATABASE_URL` in GitHub Actions. On Vercel, ensure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set for the **Production** environment and redeploy.

**`/api/health` returns 503, `"db": "error"`**

- Check Turso token has not expired (create a new token if needed)
- Confirm region/network access from Vercel (Turso is HTTPS — no IP allowlist required)

**Calendar sync never runs**

- Confirm `CRON_SECRET` is set in Vercel env
- Cron jobs only run on **Production** deployments by default
- Check Vercel → Project → Cron Jobs for execution logs

**Sitemap / canonical URLs point to renttools.io**

Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (or custom domain) and redeploy.

---

## Related docs

| Doc | Contents |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview |
| [DROPLET-SETUP.md](./DROPLET-SETUP.md) | VPS self-host runbook |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Local dev + schema workflow |
| [API.md](./API.md) | REST endpoint reference |
