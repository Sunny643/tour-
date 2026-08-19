import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getRenderJob, updateRenderJob } from "@/lib/db/queries/renderJobs";
import { getProjectForUser, updateProject } from "@/lib/db/queries/projects";
import { getRenderStatus } from "@/lib/shotstack";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();

  let renderJob = await getRenderJob(id);
  if (!renderJob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await getProjectForUser(renderJob.projectId, appUser.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (renderJob.status === "queued" || renderJob.status === "rendering") {
    if (!renderJob.providerJobId) {
      return NextResponse.json({ renderJob });
    }
    const status = await getRenderStatus(renderJob.providerJobId);
    if (status.status !== renderJob.status) {
      const shareSlug = status.status === "done" ? nanoid(10) : undefined;
      renderJob =
        (await updateRenderJob(id, {
          status: status.status,
          outputUrl: status.outputUrl ?? null,
          error: status.error ?? null,
          ...(shareSlug ? { shareSlug } : {}),
        })) ?? renderJob;

      await updateProject(renderJob.projectId, appUser.id, {
        status: status.status === "done" ? "rendered" : status.status === "failed" ? "failed" : "rendering",
      });
    }
  }

  return NextResponse.json({ renderJob });
}
