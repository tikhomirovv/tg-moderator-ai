/** Retention limits — hardcoded, not env-configurable. */
export const USER_MESSAGES_PER_SCOPE = 100;
export const MODERATION_RETENTION_DAYS = 90;

export function moderationRetentionCutoff(
  now: Date = new Date()
): Date {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - MODERATION_RETENTION_DAYS);
  return cutoff;
}
