import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getProjectForUser, updateProject } from "@/lib/db/queries/projects";
import { updateProjectSchema } from "@/lib/validation/schemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();
  const project = await getProjectForUser(id, appUser.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUser = await getOrCreateAppUser();
  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await updateProject(id, appUser.id, parsed.data);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}
