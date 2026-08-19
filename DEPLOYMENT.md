# Deployment

Two steps: push the repo to GitHub, then import it into Vercel.

## 1. Push to GitHub (GitHub Desktop)

The repo is already initialised with one commit on the `main` branch.

1. GitHub Desktop → **File → Add local repository**
2. Choose `C:\Users\sujith kumar\OneDrive\Desktop\steching`
3. Click **Publish repository**. Keep **Keep this code private** ticked.

`.env.local` and `.claude/settings.local.json` are gitignored, so no secrets go up.

## 2. Provision the services

You need accounts for all five before the app runs end to end.

| Service | What to create | What you get |
|---|---|---|
| [Clerk](https://dashboard.clerk.com) | An application | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| [Supabase](https://supabase.com/dashboard) | A project | `DATABASE_URL` — use the **Connection pooler** URI (port 6543) |
| [Cloudflare R2](https://dash.cloudflare.com) | A bucket + API token | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |
| [Shotstack](https://dashboard.shotstack.io) | Sign up | `SHOTSTACK_API_KEY` (sandbox key to start) |
| [Razorpay](https://dashboard.razorpay.com) | A monthly Plan for "Pro" (Subscriptions → Plans) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PRO_PLAN_ID` |

**Important — make the R2 bucket publicly readable** (R2 → your bucket → Settings →
Public access, or attach a custom domain), then set `R2_PUBLIC_BASE_URL` to that
public base URL. Shotstack fetches photo URLs directly while rendering; a private
bucket means renders fail to load your images.

### Run the migration

From your machine, against the Supabase connection string:

```bash
psql "<DATABASE_URL>" -f lib/db/migrations/0001_init.sql
psql "<DATABASE_URL>" -f lib/db/seed/music-tracks.seed.sql
```

No local `psql`? Paste both files into the Supabase dashboard's **SQL Editor** instead.

## 3. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset auto-detects as Next.js. Leave build settings alone.
3. Add these environment variables before the first deploy:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_BASE_URL
SHOTSTACK_API_KEY
SHOTSTACK_ENV          -> sandbox
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_PRO_PLAN_ID
RAZORPAY_WEBHOOK_SECRET -> you choose this string; reuse it at step 4
```

4. Deploy.

## 4. Point the Razorpay webhook at production

Once you have the Vercel URL:

1. Razorpay Dashboard → Settings → **Webhooks** → Add New Webhook
2. URL: `https://your-app.vercel.app/api/webhooks/razorpay`
3. Secret: the same string you set as `RAZORPAY_WEBHOOK_SECRET` in Vercel
   (Razorpay does not generate this for you — you choose it)
4. Active events: `subscription.activated`, `subscription.charged`,
   `subscription.cancelled`, `subscription.completed`, `subscription.halted`,
   `subscription.pending`

Also set the post-payment redirect under Razorpay → Settings → Checkout so
users land back on your app after authorizing. Razorpay has no per-request
callback URL for subscriptions, so this is dashboard-side only.

## 5. Smoke-test production

Walk the flow: sign up → create project → upload 3+ photos → reorder → pick a
style → render → wait for the poller → preview → download → open the share link
in a private window.

## Before real customers

- **Replace the placeholder music tracks.** `lib/db/seed/music-tracks.seed.sql`
  ships non-functional stub URLs. Swap in tracks licensed from Epidemic Sound /
  Artlist and set `is_placeholder = false`.
- Switch `SHOTSTACK_ENV` to `production` and use a production Shotstack key.
- Switch Razorpay from test keys (`rzp_test_…`) to live keys, and re-create the
  webhook against the live account. Razorpay also requires KYC approval before
  the live account can accept real payments — start that early, it takes days.
- Revisit the render limits in `lib/billing/limits.ts` (currently free: 2, pro: 50).
