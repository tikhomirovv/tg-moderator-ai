import { describe, expect, test } from "bun:test";
import { enforceBotAccess } from "../../../server/utils/bot-access";

describe("enforceBotAccess", () => {
  test("allows any member when roles are not restricted", () => {
    expect(enforceBotAccess("manager")).toBe("manager");
    expect(enforceBotAccess("owner")).toBe("owner");
  });

  test("rejects users without membership", () => {
    expect(() => enforceBotAccess(null)).toThrow();
  });

  test("rejects managers on owner-only routes", () => {
    expect(() => enforceBotAccess("manager", ["owner"])).toThrow();
    expect(enforceBotAccess("owner", ["owner"])).toBe("owner");
  });
});
