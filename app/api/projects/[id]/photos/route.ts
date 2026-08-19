import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getProjectForUser } from "@/lib/db/queries/projects";
import { addPhoto, listPhotosForProject } from "@/lib/db/queries/photos";
import { registerPhotoSchema } from "@/lib/validation/schemas";
import { resolvePublicUrl } from "@/lib/storage/r2";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();
  const project = await getProjectForUser(id, appUser.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = await listPhotosForProject(id);
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();
  const project = await getProjectForUser(id, appUser.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = registerPhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await listPhotosForProject(id);
  if (existing.length >= 30) {
    return NextResponse.json({ error: "Maximum of 30 photos per project" }, { status: 400 });
  }

  const photo = await addPhoto({
    projectId: id,
    storageKey: parsed.data.storageKey,
    publicUrl: resolvePublicUrl(parsed.data.storageKey),
    orderIndex: existing.length,
    width: parsed.data.width,
    height: parsed.data.height,
    fileSizeBytes: parsed.data.fileSizeBytes,
  });

  return NextResponse.json({ photo }, { status: 201 });
}
