import { describe, expect, test } from "bun:test";
import {
  buildWorkspaceSlugBase,
  buildWorkspaceSlugWithSuffix,
  reserveWorkspaceSlug,
} from "../../../lib/workspace-slug";

describe("buildWorkspaceSlugBase", () => {
  test("slugifies workspace name", () => {
    expect(buildWorkspaceSlugBase("My Team")).toBe("my-team");
  });

  test("falls back when name slugifies to empty", () => {
    expect(buildWorkspaceSlugBase("!!!")).toBe("workspace");
  });
});

describe("buildWorkspaceSlugWithSuffix", () => {
  test("appends random suffix after base slug", () => {
    expect(buildWorkspaceSlugWithSuffix("my-team", "a1b2c3")).toBe(
      "my-team-a1b2c3"
    );
  });
});

describe("reserveWorkspaceSlug", () => {
  test("returns base slug when available", async () => {
    const slug = await reserveWorkspaceSlug("My Team", async (candidate) => {
      return candidate === "my-team";
    });

    expect(slug).toBe("my-team");
  });

  test("adds suffix when base slug is taken", async () => {
    const slug = await reserveWorkspaceSlug("My Team", async (candidate) => {
      return candidate !== "my-team";
    });

    expect(slug).toMatch(/^my-team-[a-z0-9]{6}$/);
  });

  test("allows duplicate display names for the same user", async () => {
    const taken = new Set<string>();

    const first = await reserveWorkspaceSlug("My Team", async (candidate) => {
      return !taken.has(candidate);
    });
    taken.add(first);

    const second = await reserveWorkspaceSlug("My Team", async (candidate) => {
      return !taken.has(candidate);
    });

    expect(first).toBe("my-team");
    expect(second).toMatch(/^my-team-[a-z0-9]{6}$/);
    expect(second).not.toBe(first);
  });
});
