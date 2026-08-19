"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import { postJson } from "@/lib/fetcher";
import { PERSONA_DEFAULTS, type PersonaType } from "@/lib/persona/defaults";
import type { Project } from "@/lib/db/schema";

export function ProjectForm() {
  const router = useRouter();
  const [personaType, setPersonaType] = useState<PersonaType>("agent");
  const [title, setTitle] = useState("");
  const [priceText, setPriceText] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">(
    PERSONA_DEFAULTS.agent.defaultAspectRatio
  );
  const [aspectTouched, setAspectTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persona = PERSONA_DEFAULTS[personaType];

  // Persona drives the *default* only — the user can still override it.
  function selectPersona(next: PersonaType) {
    setPersonaType(next);
    if (!aspectTouched) setAspectRatio(PERSONA_DEFAULTS[next].defaultAspectRatio);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { project } = await postJson<{ project: Project }>("/api/projects", {
        title,
        personaType,
        priceText: priceText || null,
        aspectRatio,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <span className="text-sm font-medium text-neutral-800">I&apos;m creating a video for</span>
          <div className="grid grid-cols-2 gap-2">
            {(["agent", "host"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPersona(p)}
                className={clsx(
                  "rounded-md border px-3 py-2.5 text-left text-sm",
                  personaType === p
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white hover:bg-neutral-50"
                )}
              >
                <span className="block font-medium">
                  {p === "agent" ? "A property listing" : "A short-term rental"}
                </span>
                <span
                  className={clsx(
                    "mt-0.5 block text-xs",
                    personaType === p ? "text-neutral-300" : "text-neutral-500"
                  )}
                >
                  {p === "agent" ? "Walkthrough pacing, landscape" : "Punchy reel, vertical"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="14 Maple Street"
            required
            maxLength={200}
          />
        </Field>

        <Field label={`${persona.copy.priceLabel} (optional)`} hint="Shown on the opening title card.">
          <input
            className={inputClass}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            placeholder={personaType === "agent" ? "$450,000" : "$120/night"}
            maxLength={100}
          />
        </Field>

        <Field
          label="Aspect ratio"
          hint={`Suggested for this type: ${persona.defaultAspectRatio}`}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["16:9", "9:16"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => {
                  setAspectRatio(ratio);
                  setAspectTouched(true);
                }}
                className={clsx(
                  "rounded-md border px-3 py-2 text-sm",
                  aspectRatio === ratio
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white hover:bg-neutral-50"
                )}
              >
                {ratio} {ratio === "16:9" ? "landscape" : "vertical"}
              </button>
            ))}
          </div>
        </Field>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={submitting || !title}>
          {submitting ? "Creating…" : "Create project"}
        </Button>
      </form>
    </Card>
  );
}
