import { NextResponse } from "next/server";
import { listMusicTracks } from "@/lib/db/queries/musicTracks";

export async function GET() {
  const tracks = await listMusicTracks();
  return NextResponse.json({ tracks });
}
