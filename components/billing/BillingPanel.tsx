"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetcher, postJson } from "@/lib/fetcher";
import type { AppUser } from "@/lib/db/schema";

interface AccountResponse {
  appUser: AppUser;
  usage: { used: number; limit: number };
}

export function BillingPanel() {
  const { data, mutate } = useSWR<AccountResponse>("/api/account", fetcher);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      // Razorpay returns a hosted authorization page (short_url) rather than
      // a Stripe-style Checkout session.
      const { url } = await postJson<{ url: string }>("/api/razorpay/checkout");
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function cancelSubscription() {
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/razorpay/cancel");
      setConfirmingCancel(false);
      await mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-sm text-neutral-500">Loading…</p>;

  const { appUser, usage } = data;
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-sm text-neutral-500">Current plan</p>
        <p className="text-lg font-medium capitalize">{appUser.plan}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Renders this period</span>
          <span className="font-medium">
            {usage.used} / {usage.limit}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className={pct >= 100 ? "h-full bg-red-500" : "h-full bg-neutral-900"}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500">
          Resets {new Date(appUser.periodResetAt).toLocaleDateString()}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {appUser.plan === "free" ? (
        <Button disabled={busy} onClick={startCheckout}>
          {busy ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      ) : confirmingCancel ? (
        <div className="space-y-2">
          <p className="text-sm text-neutral-700">
            Cancel your Pro subscription? You&apos;ll keep Pro access until the end of the
            billing cycle you&apos;ve already paid for.
          </p>
          <div className="flex gap-2">
            <Button variant="danger" disabled={busy} onClick={cancelSubscription}>
              {busy ? "Cancelling…" : "Yes, cancel"}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmingCancel(false)}>
              Keep Pro
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setConfirmingCancel(true)}>
          Cancel subscription
        </Button>
      )}
    </Card>
  );
}
