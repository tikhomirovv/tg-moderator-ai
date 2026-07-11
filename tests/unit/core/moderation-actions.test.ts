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
    expect(plan.logAudit).toBe(false);
  });

  test("delete only when ban is off — no warn or ban", () => {
    const plan = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: true,
        ban_on_violation: false,
        warnings_before_ban: null,
      },
      userWarningsBefore: 0,
    });

    expect(plan.logDelete).toBe(true);
    expect(plan.telegramDelete).toBe(true);
    expect(plan.logWarning).toBe(false);
    expect(plan.logBan).toBe(false);
    expect(plan.telegramWarning).toBe(false);
    expect(plan.logAudit).toBe(false);
  });

  test("delete disabled when delete_on_violation is false", () => {
    const disabled = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: false,
        ban_on_violation: false,
        warnings_before_ban: null,
      },
      userWarningsBefore: 0,
    });

    expect(disabled.logDelete).toBe(false);
    expect(disabled.telegramDelete).toBe(false);
    expect(disabled.logAudit).toBe(true);
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
    expect(belowThreshold.telegramWarning).toBe(true);
    expect(atThreshold.logBan).toBe(true);
    expect(atThreshold.logWarning).toBe(false);
    expect(atThreshold.telegramBan).toBe(true);
  });

  test("delete and ban enabled — delete plus warn path before threshold", () => {
    const plan = planViolationModeration({
      silentMode: false,
      rule: {
        delete_on_violation: true,
        ban_on_violation: true,
        warnings_before_ban: 3,
      },
      userWarningsBefore: 1,
    });

    expect(plan.logDelete).toBe(true);
    expect(plan.logWarning).toBe(true);
    expect(plan.logBan).toBe(false);
  });
});
