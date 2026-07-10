import { describe, expect, test } from "bun:test";
import { buildWorkspaceSlug } from "../../../lib/workspace-slug";

describe("buildWorkspaceSlug", () => {
  test("prefixes slug with user id", () => {
    expect(buildWorkspaceSlug("user-a", "My Team")).toBe("user-a-my-team");
  });

  test("keeps different users from colliding on the same workspace name", () => {
    const first = buildWorkspaceSlug("user-a", "My Team");
    const second = buildWorkspaceSlug("user-b", "My Team");

    expect(first).not.toBe(second);
  });

  test("falls back when name slugifies to empty", () => {
    expect(buildWorkspaceSlug("user-a", "!!!")).toBe("user-a-workspace");
  });
});
