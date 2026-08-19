"use client";

import clsx from "clsx";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Field } from "@/components/ui/Field";
import { TEMPLATE_STYLES } from "@/lib/render/templates";
import type { MusicTrack, Project } from "@/lib/db/schema";

interface Props {
  project: Project;
  onChange: (patch: Partial<Pick<Project, "templateStyle" | "aspectRatio" | "musicTrackId">>) => void;
  disabled?: boolean;
}

export function RenderSettings({ project, onChange, disabled }: Props) {
  const { data } = useSWR<{ tracks: MusicTrack[] }>("/api/music-tracks", fetcher);
  const tracks = data?.tracks ?? [];

  return (
    <div className="space-y-5">
      <Field label="Style">
        <div className="grid gap-2 sm:grid-cols-3">
          {TEMPLATE_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ templateStyle: style.id })}
              className={clsx(
                "rounded-md border p-3 text-left text-sm disabled:opacity-50",
                project.templateStyle === style.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              )}
            >
              <span className="block font-medium">{style.label}</span>
              <span
                className={clsx(
                  "mt-1 block text-xs",
                  project.templateStyle === style.id ? "text-neutral-300" : "text-neutral-500"
                )}
              >
                {style.description}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Aspect ratio">
        <div className="grid max-w-xs grid-cols-2 gap-2">
          {(["16:9", "9:16"] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ aspectRatio: ratio })}
              className={clsx(
                "rounded-md border px-3 py-2 text-sm disabled:opacity-50",
                project.aspectRatio === ratio
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              )}
            >
              {ratio}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Music"
        hint="Placeholder library — licensed tracks are swapped in before launch."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ musicTrackId: track.id })}
              className={clsx(
                "rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50",
                project.musicTrackId === track.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white hover:bg-neutral-50"
              )}
            >
              <span className="block">{track.name}</span>
              <span
                className={clsx(
                  "text-xs",
                  project.musicTrackId === track.id ? "text-neutral-300" : "text-neutral-500"
                )}
              >
                {track.moodTags.join(", ")}
              </span>
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}
