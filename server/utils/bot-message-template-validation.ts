export const MAX_BOT_MESSAGE_TEMPLATE_LENGTH = 4096;

/** Warn when placeholders are glued without whitespace (fixed at render, but bad UX). */
export function detectGluedUserMentionPlaceholder(
  template: string
): string | null {
  if (/\{[a-z_]+\}\{user_mention\}/.test(template.replace(/\s/g, ""))) {
    return "Add a line break between {rule_name} and {user_mention}";
  }
  return null;
}

export function validateBotMessageTemplate(
  value: string | null | undefined,
  fieldName: string
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string or null`);
  }

  if (value.length > MAX_BOT_MESSAGE_TEMPLATE_LENGTH) {
    throw new Error(
      `${fieldName} must be at most ${MAX_BOT_MESSAGE_TEMPLATE_LENGTH} characters`
    );
  }

  return value;
}
