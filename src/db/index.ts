import "server-only";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/lib/env";
import * as schema from "./schema";

// The WebSocket driver (instead of neon-http) is used because billing needs
// interactive transactions to deduct stock safely.
neonConfig.webSocketConstructor = ws;

function createDb() {
  const pool = new Pool({ connectionString: env().DATABASE_URL });
  return drizzle({ client: pool, schema });
}

type Db = ReturnType<typeof createDb>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Db };

function getDb(): Db {
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

// Lazily connect so importing this module (e.g. during `next build`) does not
// require DATABASE_URL until a query actually runs.
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
