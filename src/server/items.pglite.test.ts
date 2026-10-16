import { expect, it } from "vitest";
import { createTestDb } from "./test-pglite";

it("runs the items CRUD against PGLite", async () => {
  const { db } = await createTestDb();
  const id = "itm-test";

  await db
    .insertInto("items")
    .values({ id, user_id: "dev-user", name: "Test", description: "", status: "active" })
    .execute();

  const rows = await db.selectFrom("items").selectAll().where("user_id", "=", "dev-user").execute();
  expect(rows).toHaveLength(1);
  expect(rows[0].name).toBe("Test");

  await db.updateTable("items").set({ name: "Renamed" }).where("id", "=", id).execute();
  const updated = await db
    .selectFrom("items")
    .select("name")
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  expect(updated.name).toBe("Renamed");

  await db.deleteFrom("items").where("id", "=", id).execute();
  const after = await db
    .selectFrom("items")
    .selectAll()
    .where("user_id", "=", "dev-user")
    .execute();
  expect(after).toHaveLength(0);
});
