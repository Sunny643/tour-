import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __dbClient: ReturnType<typeof postgres> | undefined;
  var __db: Db | undefined;
}

function initDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // `prepare: false` is required for Supabase's transaction-mode pooler.
  const client = global.__dbClient ?? postgres(connectionString, { prepare: false });
  const instance = global.__db ?? drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    global.__dbClient = client;
    global.__db = instance;
  }
  return instance;
}

// Lazily connect on first property access so importing this module (which
// `next build` does while collecting route metadata) never requires env vars.
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = initDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    // Bind methods to the real Drizzle instance — leaving `this` as the proxy
    // would break its internal private-field access.
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
