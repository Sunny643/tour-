"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { fetcher, postJson } from "@/lib/fetcher";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoReorderList } from "@/components/photos/PhotoReorderList";
import { RenderSettings } from "@/components/render/RenderSettings";
import { RenderJobPanel } from "@/components/render/RenderJobPanel";
import { PERSONA_DEFAULTS, type PersonaType } from "@/lib/persona/defaults";
import type { Project, ProjectPhoto, RenderJob } from "@/lib/db/schema";

const MIN_PHOTOS_TO_RENDER = 3;

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const projectSwr = useSWR<{ project: Project }>(`/api/projects/${id}`, fetcher);
  const photosSwr = useSWR<{ photos: ProjectPhoto[] }>(`/api/projects/${id}/photos`, fetcher);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = projectSwr.data?.project;
  const photos = photosSwr.data?.photos ?? [];

  // Show the most recent job even after a page reload.
  const jobId = activeJobId ?? project?.latestRenderJobId ?? null;

  async function patchProject(patch: Partial<Project>) {
    await postJson(`/api/projects/${id}`, patch, "PATCH");
    projectSwr.mutate();
  }

  async function startRender() {
    setRendering(true);
    setError(null);
    try {
      const { renderJob } = await postJson<{ renderJob: RenderJob }>(
        `/api/projects/${id}/render`
      );
      setActiveJobId(renderJob.id);
      projectSwr.mutate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRendering(false);
    }
  }

  if (projectSwr.error) return <p className="text-sm text-red-600">Could not load this project.</p>;
  if (!project) return <p className="text-sm text-neutral-500">Loading…</p>;

  const persona = PERSONA_DEFAULTS[project.personaType as PersonaType];
  const canRender = photos.length >= MIN_PHOTOS_TO_RENDER;
  const isRenderingNow = project.status === "rendering" && jobId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {project.personaType === "agent" ? "Property listing" : "Short-term rental"}
          {project.priceText ? ` · ${project.priceText}` : ""}
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-medium">Photos</h2>
        <PhotoUploader
          projectId={id}
          photoCount={photos.length}
          onUploaded={() => photosSwr.mutate()}
        />
        <PhotoReorderList
          projectId={id}
          photos={photos}
          onReordered={() => photosSwr.mutate()}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-medium">Video settings</h2>
        <RenderSettings
          project={project}
          disabled={rendering}
          onChange={(patch) => patchProject(patch)}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-medium">Render</h2>
        {!canRender ? (
          <p className="text-sm text-neutral-600">
            Add at least {MIN_PHOTOS_TO_RENDER} photos to generate a video.
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <Button onClick={startRender} disabled={!canRender || rendering || Boolean(isRenderingNow)}>
            {rendering
              ? "Starting…"
              : project.status === "rendered"
                ? "Regenerate video"
                : persona.copy.ctaLabel}
          </Button>
          {project.status === "rendered" ? (
            <span className="text-xs text-neutral-500">
              Regenerating creates a new video with your current settings.
            </span>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {jobId ? (
          <RenderJobPanel
            key={jobId}
            renderJobId={jobId}
            onFinished={() => projectSwr.mutate()}
          />
        ) : null}
      </Card>
    </div>
  );
}
