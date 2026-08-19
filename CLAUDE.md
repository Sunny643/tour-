# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

A SaaS product that lets real estate agents and Airbnb/short-term rental hosts upload listing photos and automatically generate a branded promo video — a template-based photo slideshow (Ken Burns pans/zooms, transitions, music, text overlays), not AI-generated video. One product serves both personas from a shared upload → render → deliver pipeline, with persona-aware defaults (agent = walkthrough pacing, host = short amenity-highlight pacing).

**v1 explicitly does NOT include:** AI-generated video (Runway/Luma/Kling), MLS/PMS/Airbnb API integration, mobile app, multi-seat/team accounts, or photo editing/retouching. Do not build these unless explicitly asked — they are out of scope by design, not by oversight.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API routes |
| Auth | Clerk |
| Database | Postgres via Supabase (or Neon) |
| File storage | Cloudflare R2 (or S3) |
| Video rendering | Shotstack API (hosted JSON-template → video rendering) |
| Job handling | Postgres `render_jobs` table + frontend polling (no external queue at MVP scale) |
| Billing | Razorpay (Subscriptions; hosted authorization page + API cancellation) |
| Music | Curated, manually-licensed track library (Epidemic Sound / Artlist) — never pull from unlicensed sources |
| Deployment | Vercel |

## Requirements (v1 scope)

### Core user flow
1. Sign up / log in (Clerk)
2. Create a Project (a listing/property): title, persona_type (agent/host), optional price_text
3. Upload 10–30 photos, drag-to-reorder
4. Pick template style, aspect ratio (16:9 or 9:16), music track
5. Optional branding: logo + contact info (stored on the user, reused across projects)
6. Trigger render → poll job status (queued → rendering → done/failed)
7. Preview finished video, regenerate with different settings if desired
8. Download MP4 or get a shareable link

### Must-have (P0)
- Multi-photo upload with reordering
- Template-based rendering via Shotstack: 2-3 initial styles, both aspect ratios
- Persona-aware defaults (pacing/aspect ratio suggestions differ for agent vs host)
- Branding (logo + contact info) applied to renders
- Preview, regenerate, download, shareable link
- Auth + basic Razorpay billing with usage limits

### Nice-to-have (P1, not this pass)
- AI-generated video mode as a premium toggle
- Multi-property dashboard
- Auto room-detection for photo ordering
- AI voiceover/narration

### Future (P2, do not build now)
- MLS/PMS/Airbnb API integration
- Team/brokerage multi-seat accounts
- White-label option

## Data Model

Core tables: `app_users` (mirrors Clerk user + persona + branding), `projects` (one per listing), `project_photos` (ordered photos per project), `render_jobs` (status/provider tracking per render). Full schema with columns and constraints is in the implementation spec — keep new tables/columns consistent with that shape unless there's a clear reason to deviate.

## API Surface

```
POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id

POST   /api/projects/:id/photos
PATCH  /api/projects/:id/photos/order

POST   /api/projects/:id/render
GET    /api/render-jobs/:id

GET    /api/music-tracks
```

## Build Order

1. Scaffold: Next.js + Clerk + Supabase schema + empty dashboard/project creation
2. Upload & reorder: photo upload to storage, `project_photos` CRUD, drag-reorder UI
3. Render pipeline: music library, 2-3 template presets, Shotstack integration, job polling, preview player
4. Branding & polish: logo/contact overlay, price/title text overlay, download, shareable link, regenerate
5. Billing: Razorpay subscription checkout, usage-limit gating, cancellation

Work through these roughly in order — later phases depend on the render pipeline existing and working.

## Important Notes

- **Verify the Shotstack API schema against their live docs before implementing the render JSON.** Third-party API shapes may have changed since this project was scoped — do not hard-code assumptions about their request/response format.
- **Music tracks must be from a confirmed-licensed source** (Epidemic Sound/Artlist or equivalent) — do not add tracks without confirming commercial-use licensing.
- Keep the agent/host persona split to *defaults and copy*, not a forked codebase — one upload/render pipeline serves both.
- No AI video generation, MLS integration, mobile app, or team accounts in this build pass unless explicitly requested — check before adding scope beyond what's listed above.

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
SHOTSTACK_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PRO_PLAN_ID=
```
