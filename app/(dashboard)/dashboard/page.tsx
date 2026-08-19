"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Card } from "@/components/ui/Card";
import type { Project } from "@/lib/db/schema";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  ready: "Ready to render",
  rendering: "Rendering…",
  rendered: "Video ready",
  failed: "Render failed",
};

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<{ projects: Project[] }>("/api/projects", fetcher);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your projects</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          New project
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-neutral-500">Loading…</p> : null}
      {error ? <p className="text-sm text-red-600">Could not load projects.</p> : null}

      {data && data.projects.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No projects yet. Create one to upload photos and generate your first video.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {data?.projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="transition-colors hover:border-neutral-400">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium">{project.title}</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {project.personaType === "agent" ? "Listing" : "Short-term rental"} ·{" "}
                    {project.aspectRatio}
                    {project.priceText ? ` · ${project.priceText}` : ""}
                  </p>
                </div>
                <span className="text-xs text-neutral-600">
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
