export const MODERATION_ACTION_TYPES = [
  "warning",
  "delete",
  "ban",
  "reset_warnings",
  "unban",
  "pardon",
] as const;

export type ModerationActionType = (typeof MODERATION_ACTION_TYPES)[number];

export function isModerationActionType(
  value: string
): value is ModerationActionType {
  return (MODERATION_ACTION_TYPES as readonly string[]).includes(value);
}

export function moderationActionI18nKey(
  action: ModerationActionType
): `common.actions.${ModerationActionType}` {
  return `common.actions.${action}`;
}

/** Tailwind text color classes for action badges in activity tables. */
export function moderationActionColorClass(action: ModerationActionType): string {
  switch (action) {
    case "warning":
      return "text-yellow-600 font-medium";
    case "delete":
      return "text-orange-600 font-medium";
    case "ban":
      return "text-red-600 font-medium";
    case "reset_warnings":
      return "text-blue-600 font-medium";
    case "unban":
      return "text-green-600 font-medium";
    case "pardon":
      return "text-sky-600 font-medium";
    default:
      return "text-gray-700";
  }
}
