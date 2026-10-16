import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { Kysely } from "kysely";
import type { Database } from "@/server/db.schema";
import { pgliteDialect } from "@/server/auth/pglite-dialect";
import { pendingMigrations } from "../../tooling/migration-plan.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const migrationsDir = join(root, "migrations");

export function migrationSqlFiles() {
  const entries = readdirSync(migrationsDir);
  return pendingMigrations(entries, []).map(({ name }) => ({
    name,
    sql: readFileSync(join(migrationsDir, name), "utf8"),
  }));
}

/** Isolated in-memory PGLite with every `migrations/*.sql` applied (same files as migrate.mjs). */
export async function createMigratedPglite() {
  const pg = new PGlite();
  await pg.waitReady;
  await pg.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const files = migrationSqlFiles();
  for (const { name, sql } of files) {
    await pg.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("insert into _migrations (name) values ($1)", [name]);
    });
  }
  return pg;
}

export async function createTestDb() {
  const pg = await createMigratedPglite();
  const db = new Kysely<Database>({
    dialect: pgliteDialect(() => pg),
  });
  return { pg, db };
}
