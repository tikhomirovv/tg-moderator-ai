import { describe, expect, test } from "bun:test";
import { lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { moderationDecisions } from "../../../server/database/schema";

describe("moderation decisions retention delete query", () => {
  test("uses Drizzle lt() so postgres driver receives a typed Date param", () => {
    const db = drizzle({} as never);
    const cutoff = new Date("2026-04-20T03:00:00.000Z");

    const built = db
      .delete(moderationDecisions)
      .where(lt(moderationDecisions.createdAt, cutoff))
      .toSQL();

    expect(built.sql).toContain('"moderation_decisions"');
    expect(built.sql).toContain("created_at");
    expect(built.params).toHaveLength(1);
    expect(built.params[0]).toBe(cutoff.toISOString());
  });
});
