# Listing Reel

Turn listing photos into a branded promo video. One pipeline serves two personas:
real estate agents (walkthrough pacing, landscape) and short-term rental hosts
(punchy amenity reels, vertical).

This is a template-based slideshow renderer (Ken Burns pans/zooms, transitions,
music, text overlays) — **not** AI-generated video.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js route handlers |
| Auth | Clerk |
| Database | Postgres (Supabase) via Drizzle ORM |
| File storage | Cloudflare R2 (S3-compatible) |
| Rendering | Shotstack Edit API |
| Job handling | `render_jobs` table + frontend polling |
| Billing | Stripe Checkout + Customer Portal |
| Deployment | Vercel |

## Setup

### 1. Install

```bash
pnpm install
cp .env.example .env.local
```

### 2. Provision services and fill in `.env.local`

| Service | What you need | Where |
|---|---|---|
| Clerk | Publishable + secret key | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys |
| Supabase | Postgres connection string (use the **pooler** URI, port 6543) | Project → Settings → Database |
| Cloudflare R2 | Account ID, access key/secret, bucket name | Cloudflare → R2 → Manage API Tokens |
| Shotstack | Sandbox API key | [dashboard.shotstack.io](https://dashboard.shotstack.io) |
| Stripe | Secret + publishable key, webhook secret, a recurring Price ID for "Pro" | [dashboard.stripe.com](https://dashboard.stripe.com) |

**R2 bucket must be publicly readable** (or fronted by a custom domain) and
`R2_PUBLIC_BASE_URL` set — Shotstack fetches photo URLs directly at render time,
and short-lived presigned URLs can expire mid-render.

### 3. Run migrations and seed music

```bash
psql "$DATABASE_URL" -f lib/db/migrations/0001_init.sql
psql "$DATABASE_URL" -f lib/db/seed/music-tracks.seed.sql
```

### 4. Start

```bash
pnpm dev
```

## Verifying the render pipeline

Before wiring real photos, confirm your Shotstack key and the render JSON work:

```bash
node --env-file=.env.local scripts/smoke-shotstack.mjs
```

It submits a 3-image render against the sandbox API, polls to completion, and
prints the output URL.

## Stripe webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

Copy the `whsec_…` that `stripe listen` prints into `STRIPE_WEBHOOK_SECRET`.

## Architecture notes

- **`lib/shotstack.ts` is the only module that knows Shotstack's wire format.**
  Everything else goes through `submitRender` / `getRenderStatus`. Verified
  against their live docs on 2026-08-19; re-verify before changing render JSON.
- **Persona is config, not a code fork.** `lib/persona/defaults.ts` supplies
  default aspect ratio, seconds-per-photo, and copy strings. The render pipeline
  itself is persona-agnostic — it receives numbers, not persona flags.
- **Uploads bypass the API routes.** Client requests a presigned URL from
  `/api/uploads/presign`, PUTs directly to R2, then registers the row. Keeps
  large bodies out of serverless function limits.
- **No queue.** Renders are submitted synchronously; `GET /api/render-jobs/:id`
  refreshes status from Shotstack on demand while the client polls every 3s.
- **Usage limits** are enforced only at `POST /api/projects/:id/render`
  (`lib/billing/limits.ts`), with a lazy 30-day period reset — no cron needed.

## Known limitations

- **The music library is placeholder data.** `lib/db/seed/music-tracks.seed.sql`
  contains non-functional stub URLs marked `is_placeholder = true`. Replace them
  with tracks licensed from Epidemic Sound / Artlist (or equivalent) before
  serving real customers. Never add tracks from unlicensed sources.
- Clerk email changes don't sync back to `app_users` — the row is created
  on-demand on first authenticated request. A Clerk webhook would fix this.
- Shotstack's default `shotstack` destination is used for output hosting.
  Without it, raw output URLs expire after 24 hours.

## Out of scope (by design)

AI-generated video, MLS/PMS/Airbnb integration, mobile app, multi-seat/team
accounts, photo retouching. See `CLAUDE.md`.
