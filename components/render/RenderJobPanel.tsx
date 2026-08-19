"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/Button";
import type { RenderJob } from "@/lib/db/schema";

interface Props {
  renderJobId: string;
  onFinished: () => void;
}

export function RenderJobPanel({ renderJobId, onFinished }: Props) {
  const [copied, setCopied] = useState(false);

  // Poll until the job reaches a terminal state, then stop.
  const { data } = useSWR<{ renderJob: RenderJob }>(
    `/api/render-jobs/${renderJobId}`,
    fetcher,
    {
      refreshInterval: (latest) => {
        const status = latest?.renderJob?.status;
        return status === "done" || status === "failed" ? 0 : 3000;
      },
      onSuccess: (latest) => {
        if (latest.renderJob.status === "done" || latest.renderJob.status === "failed") {
          onFinished();
        }
      },
    }
  );

  const job = data?.renderJob;
  if (!job) return <p className="text-sm text-neutral-500">Checking render status…</p>;

  if (job.status === "queued" || job.status === "rendering") {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {job.status === "queued" ? "Queued…" : "Rendering your video…"}
        </p>
        <p className="text-xs text-neutral-500">
          This usually takes a minute or two. You can leave this page open.
        </p>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-red-600">Render failed</p>
        <p className="text-xs text-neutral-600">{job.error ?? "Unknown error"}</p>
      </div>
    );
  }

  const shareUrl =
    job.shareSlug && typeof window !== "undefined"
      ? `${window.location.origin}/share/${job.shareSlug}`
      : null;

  return (
    <div className="space-y-3">
      {job.outputUrl ? (
        <video
          controls
          src={job.outputUrl}
          className="w-full max-w-xl rounded-md border border-neutral-200 bg-black"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {job.outputUrl ? (
          <a
            href={job.outputUrl}
            download
            className="inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Download MP4
          </a>
        ) : null}
        {shareUrl ? (
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Link copied" : "Copy share link"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
