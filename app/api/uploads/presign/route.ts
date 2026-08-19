import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getProjectForUser } from "@/lib/db/queries/projects";
import { presignUploadSchema } from "@/lib/validation/schemas";
import { presignPutUrl } from "@/lib/storage/r2";
import { photoStorageKey, brandLogoStorageKey } from "@/lib/storage/keys";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const appUser = await getOrCreateAppUser();
  const body = await req.json();
  const parsed = presignUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { filename, contentType } = parsed.data;
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }
  const ext = filename.split(".").pop() || "jpg";

  if (parsed.data.kind === "photo") {
    const project = await getProjectForUser(parsed.data.projectId, appUser.id);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storageKey = photoStorageKey(parsed.data.projectId, ext);
    const uploadUrl = await presignPutUrl(storageKey, contentType);
    return NextResponse.json({ uploadUrl, storageKey });
  }

  const storageKey = brandLogoStorageKey(appUser.id, ext);
  const uploadUrl = await presignPutUrl(storageKey, contentType);
  return NextResponse.json({ uploadUrl, storageKey });
}
