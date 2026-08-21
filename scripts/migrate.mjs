/**
 * Applies the schema and seeds the music library.
 *
 *   node --env-file=.env.local scripts/migrate.mjs
 *
 * Safe to re-run: it skips the schema if the tables already exist, and only
 * seeds music_tracks when that table is empty.
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Put it in .env.local, then re-run with:");
  console.error("  node --env-file=.env.local scripts/migrate.mjs");
  process.exit(1);
}

// `prepare: false` is required for Supabase's transaction-mode pooler (port 6543).
const sql = postgres(url, { prepare: false, onnotice: () => {} });

try {
  const [{ exists }] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'app_users'
    ) AS exists
  `;

  if (exists) {
    console.log("• Schema already present — skipping 0001_init.sql");
  } else {
    console.log("• Applying lib/db/migrations/0001_init.sql …");
    await sql.unsafe(readFileSync("lib/db/migrations/0001_init.sql", "utf8"));
    console.log("  schema created");
  }

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM music_tracks`;
  if (count > 0) {
    console.log(`• music_tracks already has ${count} rows — skipping seed`);
  } else {
    console.log("• Seeding music_tracks …");
    await sql.unsafe(readFileSync("lib/db/seed/music-tracks.seed.sql", "utf8"));
    console.log("  seeded");
  }

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log("\nTables in public schema:");
  for (const t of tables) console.log(`  - ${t.table_name}`);
  console.log("\nDone.");
} catch (err) {
  console.error("\nMigration failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
