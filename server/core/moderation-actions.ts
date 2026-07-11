/** Per-rule moderation settings loaded after a violation is detected. */
export interface ViolatedRuleConfig {
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  /** Null falls back to 3 warnings before ban eligibility. */
  warnings_before_ban: number | null;
}

export interface ViolationModerationPlan {
  /** Persist warning in DB (context + moderation log). */
  logWarning: boolean;
  /** Persist ban in DB. */
  logBan: boolean;
  /** Persist message deletion in DB. */
  logDelete: boolean;
  /** Violation audit only (no warn/ban/delete side effects). */
  logAudit: boolean;
  /** Send warning reply via Telegram API. */
  telegramWarning: boolean;
  /** Call banChatMember via Telegram API. */
  telegramBan: boolean;
  /** Call deleteMessage via Telegram API. */
  telegramDelete: boolean;
  warningsBeforeBan: number;
}

const DEFAULT_WARNINGS_BEFORE_BAN = 3;

/**
 * Decide which DB logs and Telegram actions to run for a violation.
 * silent_mode suppresses all Telegram side effects but keeps DB audit trail.
 */
export function planViolationModeration(input: {
  silentMode: boolean;
  rule: ViolatedRuleConfig;
  userWarningsBefore: number;
}): ViolationModerationPlan {
  const warningsBeforeBan =
    input.rule.warnings_before_ban ?? DEFAULT_WARNINGS_BEFORE_BAN;

  const shouldBan =
    input.rule.ban_on_violation &&
    input.userWarningsBefore >= warningsBeforeBan;

  const logBan = shouldBan;
  const logWarning = input.rule.ban_on_violation && !shouldBan;
  const logDelete = input.rule.delete_on_violation;
  const logAudit = !logWarning && !logBan && !logDelete;
  const telegramEnabled = !input.silentMode;

  return {
    logWarning,
    logBan,
    logDelete,
    logAudit,
    telegramWarning: telegramEnabled && logWarning,
    telegramBan: telegramEnabled && logBan,
    telegramDelete: telegramEnabled && logDelete,
    warningsBeforeBan,
  };
}
