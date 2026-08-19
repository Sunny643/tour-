import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects, type Project } from "@/lib/db/schema";

export async function listProjectsForUser(userId: string): Promise<Project[]> {
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(projects.createdAt);
}

export async function getProjectForUser(projectId: string, userId: string): Promise<Project | undefined> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function createProject(input: {
  userId: string;
  title: string;
  personaType: "agent" | "host";
  priceText?: string | null;
  aspectRatio: "16:9" | "9:16";
}): Promise<Project> {
  const rows = await db
    .insert(projects)
    .values({
      userId: input.userId,
      title: input.title,
      personaType: input.personaType,
      priceText: input.priceText ?? null,
      aspectRatio: input.aspectRatio,
    })
    .returning();
  return rows[0];
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: Partial<{
    title: string;
    priceText: string | null;
    aspectRatio: "16:9" | "9:16";
    templateStyle: string | null;
    musicTrackId: string | null;
    status: "draft" | "ready" | "rendering" | "rendered" | "failed";
    latestRenderJobId: string | null;
  }>
): Promise<Project | undefined> {
  const rows = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();
  return rows[0];
}
