import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { z } from "zod";
import { authMiddleware } from "@/server/auth/middleware";
import { getDb } from "@/server/db.server";

/** The example resource, as the client sees it (timestamps are ISO strings). */
export type Item = {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "failed";
  createdAt: string;
  updatedAt: string;
};

const itemBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(""),
  status: z.enum(["active", "paused", "failed"]).default("active"),
});

type ItemRow = {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: unknown;
  updated_at: unknown;
};

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as Item["status"],
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export const listItems = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const db = await getDb();
    const rows = await db
      .selectFrom("items")
      .selectAll()
      .where("user_id", "=", context.userId)
      .orderBy("created_at", "desc")
      .execute();
    return rows.map(toItem);
  });

export const getItem = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const row = await db
      .selectFrom("items")
      .selectAll()
      .where("id", "=", data.id)
      .where("user_id", "=", context.userId)
      .executeTakeFirstOrThrow();
    return toItem(row);
  });

export const createItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(itemBody)
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const row = await db
      .insertInto("items")
      .values({
        id: `itm-${randomBytes(4).toString("hex")}`,
        user_id: context.userId,
        name: data.name,
        description: data.description,
        status: data.status,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toItem(row);
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), ...itemBody.shape }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const row = await db
      .updateTable("items")
      .set({
        name: data.name,
        description: data.description,
        status: data.status,
        updated_at: sql`now()`,
      })
      .where("id", "=", data.id)
      .where("user_id", "=", context.userId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toItem(row);
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    await db
      .deleteFrom("items")
      .where("id", "=", data.id)
      .where("user_id", "=", context.userId)
      .execute();
  });
