import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getProjectForUser } from "@/lib/db/queries/projects";
import { listPhotosForProject, reorderPhotos } from "@/lib/db/queries/photos";
import { reorderPhotosSchema } from "@/lib/validation/schemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();
  const project = await getProjectForUser(id, appUser.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = reorderPhotosSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await listPhotosForProject(id);
  const existingIds = new Set(existing.map((p) => p.id));
  const allBelong = parsed.data.order.every((o) => existingIds.has(o.id));
  if (!allBelong || parsed.data.order.length !== existing.length) {
    return NextResponse.json({ error: "Order must include exactly the project's existing photos" }, { status: 400 });
  }

  await reorderPhotos(id, parsed.data.order);
  const photos = await listPhotosForProject(id);
  return NextResponse.json({ photos });
}
