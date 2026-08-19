import { BrandingForm } from "@/components/branding/BrandingForm";

export default function BrandingPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Saved once and reused across every project.
        </p>
      </div>
      <BrandingForm />
    </div>
  );
}
