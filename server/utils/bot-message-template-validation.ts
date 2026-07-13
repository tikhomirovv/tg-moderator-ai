export const MAX_BOT_MESSAGE_TEMPLATE_LENGTH = 4096;

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
