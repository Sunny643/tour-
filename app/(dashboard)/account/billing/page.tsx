import { BillingPanel } from "@/components/billing/BillingPanel";

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <BillingPanel />
    </div>
  );
}
