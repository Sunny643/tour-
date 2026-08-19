import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { musicTracks, type MusicTrack } from "@/lib/db/schema";

export async function listMusicTracks(): Promise<MusicTrack[]> {
  return db.select().from(musicTracks).orderBy(musicTracks.name);
}

export async function getMusicTrack(id: string): Promise<MusicTrack | undefined> {
  const rows = await db.select().from(musicTracks).where(eq(musicTracks.id, id)).limit(1);
  return rows[0];
}
