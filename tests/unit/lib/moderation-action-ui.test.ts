import { describe, expect, test } from "bun:test";
import {
  isModerationActionType,
  moderationActionColorClass,
  moderationActionI18nKey,
  MODERATION_ACTION_TYPES,
} from "../../../lib/moderation-action-ui";

describe("moderation-action-ui", () => {
  test("lists all moderation action types", () => {
    expect(MODERATION_ACTION_TYPES).toEqual([
      "warning",
      "delete",
      "ban",
      "reset_warnings",
      "unban",
      "pardon",
    ]);
  });

  test("maps action types to i18n keys", () => {
    expect(moderationActionI18nKey("pardon")).toBe("common.actions.pardon");
    expect(moderationActionI18nKey("reset_warnings")).toBe(
      "common.actions.reset_warnings"
    );
  });

  test("rejects unknown action types", () => {
    expect(isModerationActionType("warning")).toBe(true);
    expect(isModerationActionType("pardon")).toBe(true);
    expect(isModerationActionType("mute")).toBe(false);
  });

  test("assigns distinct color classes per action type", () => {
    const classes = MODERATION_ACTION_TYPES.map((action) =>
      moderationActionColorClass(action)
    );
    expect(new Set(classes).size).toBe(MODERATION_ACTION_TYPES.length);
    expect(moderationActionColorClass("pardon")).toContain("sky");
    expect(moderationActionColorClass("unban")).toContain("green");
  });
});
