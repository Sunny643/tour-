import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { createProject, listProjectsForUser } from "@/lib/db/queries/projects";
import { createProjectSchema } from "@/lib/validation/schemas";
import { PERSONA_DEFAULTS } from "@/lib/persona/defaults";

export async function GET() {
  const appUser = await getOrCreateAppUser();
  const projects = await listProjectsForUser(appUser.id);
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const appUser = await getOrCreateAppUser();
  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, personaType, priceText } = parsed.data;
  const aspectRatio = parsed.data.aspectRatio ?? PERSONA_DEFAULTS[personaType].defaultAspectRatio;

  const project = await createProject({
    userId: appUser.id,
    title,
    personaType,
    priceText,
    aspectRatio,
  });

  return NextResponse.json({ project }, { status: 201 });
}
