import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __dbClient: ReturnType<typeof postgres> | undefined;
  var __db: Db | undefined;
}

function initDb(): Db {
  if (global.__db) return global.__db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client =
    global.__dbClient ??
    postgres(connectionString, {
      // Required for Supabase's transaction-mode pooler.
      prepare: false,
      // Each serverless instance keeps a single connection. Supabase's pooler
      // caps total client connections (200 on the free tier), and Vercel may
      // run many instances at once — a larger pool per instance exhausts that
      // ceiling and every query starts failing with EMAXCONN.
      max: 1,
      // Hand connections back quickly so idle instances stop holding slots.
      idle_timeout: 20,
      connect_timeout: 10,
    });

  const instance = drizzle(client, { schema });

  // Cache in every environment, production included. Module scope is reused
  // across invocations on a warm instance, so this is what keeps us from
  // opening a fresh pool per request.
  global.__dbClient = client;
  global.__db = instance;

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
