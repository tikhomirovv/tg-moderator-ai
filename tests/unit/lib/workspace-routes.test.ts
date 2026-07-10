import { describe, expect, test } from "bun:test";
import {
  parseWorkspaceSlugFromPath,
  replaceWorkspaceInPath,
  workspacePath,
  workspaceRoutes,
} from "../../../lib/workspace-routes";
import {
  findWorkspaceBySlug,
  resolveWorkspaceSlug,
} from "../../../lib/workspace-resolve";

describe("workspace-routes", () => {
  test("workspacePath builds nested paths", () => {
    expect(workspacePath("user123-my-team")).toBe("/w-user123-my-team");
    expect(workspacePath("user123-my-team", "bots", "my-bot")).toBe(
      "/w-user123-my-team/bots/my-bot"
    );
  });

  test("workspaceRoutes exposes common app paths", () => {
    expect(workspaceRoutes.bots("user123-my-team")).toBe(
      "/w-user123-my-team/bots"
    );
    expect(workspaceRoutes.bot("user123-my-team", "bot-a")).toBe(
      "/w-user123-my-team/bots/bot-a"
    );
    expect(workspaceRoutes.rules("user123-my-team")).toBe(
      "/w-user123-my-team/config/rules"
    );
  });

  test("replaceWorkspaceInPath swaps workspace segment", () => {
    expect(replaceWorkspaceInPath("/w-old-team/bots", "new-team")).toBe(
      "/w-new-team/bots"
    );
    expect(replaceWorkspaceInPath("/legacy", "new-team")).toBe(
      "/w-new-team"
    );
  });

  test("parseWorkspaceSlugFromPath reads slug prefix", () => {
    expect(parseWorkspaceSlugFromPath("/w-user123-my-team/bots")).toBe(
      "user123-my-team"
    );
  });
});

describe("workspace-resolve", () => {
  const workspaces = [
    { id: "org-a", name: "Alpha", slug: "user1-alpha" },
    { id: "org-b", name: "Beta", slug: "user1-beta" },
  ];

  test("findWorkspaceBySlug returns matching workspace", () => {
    expect(findWorkspaceBySlug(workspaces, "user1-beta")?.id).toBe("org-b");
  });

  test("resolveWorkspaceSlug prefers active organization", () => {
    expect(resolveWorkspaceSlug(workspaces, "org-b")).toBe("user1-beta");
    expect(resolveWorkspaceSlug(workspaces, null)).toBe("user1-alpha");
  });
});
