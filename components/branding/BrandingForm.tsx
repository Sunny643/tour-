"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import { fetcher, postJson } from "@/lib/fetcher";
import type { AppUser } from "@/lib/db/schema";

export function BrandingForm() {
  const { data, mutate } = useSWR<{ appUser: AppUser }>("/api/account", fetcher);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    brandContactName: "",
    brandContactPhone: "",
    brandContactEmail: "",
    brandContactWebsite: "",
  });
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [hydratedFrom, setHydratedFrom] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Seed the form from the fetched account once it arrives (and again if the
  // server copy changes), without a state-setting effect.
  if (data?.appUser && data.appUser !== hydratedFrom) {
    setHydratedFrom(data.appUser);
    setForm({
      brandContactName: data.appUser.brandContactName ?? "",
      brandContactPhone: data.appUser.brandContactPhone ?? "",
      brandContactEmail: data.appUser.brandContactEmail ?? "",
      brandContactWebsite: data.appUser.brandContactWebsite ?? "",
    });
    setLogoKey(data.appUser.brandLogoKey);
  }

  async function uploadLogo(file: File) {
    setStatus("Uploading logo…");
    const { uploadUrl, storageKey } = await postJson<{ uploadUrl: string; storageKey: string }>(
      "/api/uploads/presign",
      { kind: "logo", filename: file.name, contentType: file.type }
    );
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: file,
    });
    if (!put.ok) {
      setStatus("Logo upload failed.");
      return;
    }
    setLogoKey(storageKey);
    setStatus("Logo uploaded — remember to save.");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await postJson(
        "/api/account",
        {
          ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null])),
          brandLogoKey: logoKey,
        },
        "PATCH"
      );
      await mutate();
      setStatus("Saved.");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={save} className="space-y-5">
        <Field label="Logo" hint="Applied as an overlay on every video you generate.">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              {logoKey ? "Replace logo" : "Upload logo"}
            </Button>
            {logoKey ? <span className="text-xs text-neutral-500">Logo set</span> : null}
          </div>
        </Field>

        <Field label="Name">
          <input
            className={inputClass}
            value={form.brandContactName}
            onChange={(e) => setForm({ ...form, brandContactName: e.target.value })}
            placeholder="Jane Smith, Smith Realty"
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            value={form.brandContactPhone}
            onChange={(e) => setForm({ ...form, brandContactPhone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.brandContactEmail}
            onChange={(e) => setForm({ ...form, brandContactEmail: e.target.value })}
          />
        </Field>
        <Field label="Website">
          <input
            className={inputClass}
            value={form.brandContactWebsite}
            onChange={(e) => setForm({ ...form, brandContactWebsite: e.target.value })}
            placeholder="smithrealty.com"
          />
        </Field>

        {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save branding"}
        </Button>
      </form>
    </Card>
  );
}
