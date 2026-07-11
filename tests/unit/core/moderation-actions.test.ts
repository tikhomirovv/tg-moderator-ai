import { describe, expect, test } from "bun:test";
import { planViolationModeration } from "../../../server/core/moderation-actions";

describe("planViolationModeration", () => {
  test("silent mode logs but skips all Telegram actions", () => {
    const plan = planViolationModeration({
      silentMode: true,
      rule: {
        delete_on_violation: true,
        ban_on_violation: true,
        warnings_before_ban: 1,
      },
      userWarningsBefore: 1,
    });

    expect(plan.logBan).toBe(true);
    expect(plan.logDelete).toBe(true);
    expect(plan.telegramBan).toBe(false);
    expect(plan.telegramDelete).toBe(false);
    expect(plan.telegramWarning).toBe(false);
  });

  test("delete only when rule.delete_on_violation is true", () => {
    const enabled = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: true,
        ban_on_violation: false,
        warnings_before_ban: null,
      },
      userWarningsBefore: 0,
    });
    const disabled = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: false,
        ban_on_violation: false,
        warnings_before_ban: null,
      },
      userWarningsBefore: 0,
    });

    expect(enabled.logDelete).toBe(true);
    expect(enabled.telegramDelete).toBe(true);
    expect(disabled.logDelete).toBe(false);
    expect(disabled.telegramDelete).toBe(false);
  });

  test("ban only when ban_on_violation and warnings threshold reached", () => {
    const belowThreshold = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: false,
        ban_on_violation: true,
        warnings_before_ban: 3,
      },
      userWarningsBefore: 2,
    });

    const atThreshold = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: false,
        ban_on_violation: true,
        warnings_before_ban: 3,
      },
      userWarningsBefore: 3,
    });

    expect(belowThreshold.logWarning).toBe(true);
    expect(belowThreshold.logBan).toBe(false);
    expect(atThreshold.logBan).toBe(true);
    expect(atThreshold.telegramBan).toBe(true);
  });
});
