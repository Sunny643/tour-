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
  const { data } = useSWR<AccountResponse>("/api/account", fetcher);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(endpoint: string) {
    setBusy(true);
    setError(null);
    try {
      const { url } = await postJson<{ url: string }>(endpoint);
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
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

      <div className="flex gap-2">
        {appUser.plan === "free" ? (
          <Button disabled={busy} onClick={() => go("/api/stripe/checkout")}>
            {busy ? "Redirecting…" : "Upgrade to Pro"}
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy} onClick={() => go("/api/stripe/portal")}>
            {busy ? "Redirecting…" : "Manage subscription"}
          </Button>
        )}
      </div>
    </Card>
  );
}
