import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getProjectForUser, updateProject } from "@/lib/db/queries/projects";
import { listPhotosForProject } from "@/lib/db/queries/photos";
import { getMusicTrack } from "@/lib/db/queries/musicTracks";
import { createRenderJob } from "@/lib/db/queries/renderJobs";
import { incrementRenderUsage } from "@/lib/db/queries/appUsers";
import { checkAndPrepareRenderUsage } from "@/lib/billing/limits";
import { buildTimeline } from "@/lib/render/buildTimeline";
import { submitRender } from "@/lib/shotstack";
import { resolvePublicUrl, presignGetUrl } from "@/lib/storage/r2";

async function resolvePhotoUrl(storageKey: string, publicUrl: string | null): Promise<string> {
  if (publicUrl) return publicUrl;
  const resolved = resolvePublicUrl(storageKey);
  if (resolved) return resolved;
  // Shotstack needs a URL it can fetch during render, well beyond a short TTL,
  // so a public bucket is strongly preferred; this presigned fallback is only
  // safe if the render happens promptly after upload.
  return presignGetUrl(storageKey, 3600);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();
  const project = await getProjectForUser(id, appUser.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usage = await checkAndPrepareRenderUsage(appUser);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Render limit reached for your plan", used: usage.used, limit: usage.limit },
      { status: 402 }
    );
  }

  const photos = await listPhotosForProject(id);
  if (photos.length < 3) {
    return NextResponse.json({ error: "At least 3 photos are required to render" }, { status: 400 });
  }

  const musicTrack = project.musicTrackId ? await getMusicTrack(project.musicTrackId) : undefined;
  const photoUrls = await Promise.all(photos.map((p) => resolvePhotoUrl(p.storageKey, p.publicUrl)));
  const logoUrl = appUser.brandLogoKey ? await resolvePhotoUrl(appUser.brandLogoKey, null) : null;

  const edit = buildTimeline({
    personaType: project.personaType as "agent" | "host",
    aspectRatio: project.aspectRatio as "16:9" | "9:16",
    templateStyleId: project.templateStyle,
    title: project.title,
    priceText: project.priceText,
    photoUrls,
    musicTrackUrl: musicTrack?.fileUrl ?? null,
    branding: {
      logoUrl,
      contactName: appUser.brandContactName,
      contactPhone: appUser.brandContactPhone,
      contactWebsite: appUser.brandContactWebsite,
    },
  });

  let providerId: string;
  try {
    ({ providerId } = await submitRender(edit));
  } catch (err) {
    // Surface the provider's own message so a bad timeline is diagnosable
    // from the UI instead of showing a bare 500.
    return NextResponse.json(
      { error: `Render could not be started: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  const renderJob = await createRenderJob({
    projectId: id,
    providerJobId: providerId,
    renderParams: {
      personaType: project.personaType,
      aspectRatio: project.aspectRatio,
      templateStyle: project.templateStyle,
      musicTrackId: project.musicTrackId,
    },
  });

  await incrementRenderUsage(appUser.id);
  await updateProject(id, appUser.id, { status: "rendering", latestRenderJobId: renderJob.id });

  return NextResponse.json({ renderJob }, { status: 201 });
}
