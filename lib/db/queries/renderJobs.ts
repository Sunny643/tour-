import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { renderJobs, type RenderJob } from "@/lib/db/schema";

export async function createRenderJob(input: {
  projectId: string;
  providerJobId: string | null;
  renderParams: Record<string, unknown>;
}): Promise<RenderJob> {
  const rows = await db
    .insert(renderJobs)
    .values({
      projectId: input.projectId,
      providerJobId: input.providerJobId,
      renderParams: input.renderParams,
    })
    .returning();
  return rows[0];
}

export async function getRenderJob(id: string): Promise<RenderJob | undefined> {
  const rows = await db.select().from(renderJobs).where(eq(renderJobs.id, id)).limit(1);
  return rows[0];
}

export async function updateRenderJob(
  id: string,
  input: Partial<{
    status: "queued" | "rendering" | "done" | "failed";
    outputUrl: string | null;
    shareSlug: string | null;
    error: string | null;
  }>
): Promise<RenderJob | undefined> {
  const rows = await db
    .update(renderJobs)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(renderJobs.id, id))
    .returning();
  return rows[0];
}

export async function getRenderJobByShareSlug(slug: string): Promise<RenderJob | undefined> {
  const rows = await db.select().from(renderJobs).where(eq(renderJobs.shareSlug, slug)).limit(1);
  return rows[0];
}
