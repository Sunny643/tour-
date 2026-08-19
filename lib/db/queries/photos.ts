import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projectPhotos, type ProjectPhoto } from "@/lib/db/schema";

export async function listPhotosForProject(projectId: string): Promise<ProjectPhoto[]> {
  return db
    .select()
    .from(projectPhotos)
    .where(eq(projectPhotos.projectId, projectId))
    .orderBy(asc(projectPhotos.orderIndex));
}

export async function addPhoto(input: {
  projectId: string;
  storageKey: string;
  publicUrl?: string | null;
  orderIndex: number;
  width?: number | null;
  height?: number | null;
  fileSizeBytes?: number | null;
}): Promise<ProjectPhoto> {
  const rows = await db
    .insert(projectPhotos)
    .values({
      projectId: input.projectId,
      storageKey: input.storageKey,
      publicUrl: input.publicUrl ?? null,
      orderIndex: input.orderIndex,
      width: input.width ?? null,
      height: input.height ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
    })
    .returning();
  return rows[0];
}

export async function reorderPhotos(
  projectId: string,
  order: { id: string; orderIndex: number }[]
): Promise<void> {
  // Shift into a temporary negative range first so the (project_id, order_index)
  // unique constraint never collides mid-transaction, then apply real values.
  await db.transaction(async (tx) => {
    for (const [i, { id }] of order.entries()) {
      await tx
        .update(projectPhotos)
        .set({ orderIndex: -(i + 1) })
        .where(eq(projectPhotos.id, id));
    }
    for (const { id, orderIndex } of order) {
      await tx.update(projectPhotos).set({ orderIndex }).where(eq(projectPhotos.id, id));
    }
  });
}
