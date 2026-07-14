import { describe, expect, test } from "bun:test";
import {
  BAN_TEMPLATE_PLACEHOLDERS,
  TELEGRAM_HTML_DOCS_URL,
  WARNING_TEMPLATE_PLACEHOLDERS,
} from "../../../lib/bot-message-template-ui";
import { MAX_BOT_MESSAGE_TEMPLATE_LENGTH } from "../../../server/utils/bot-message-template-validation";

describe("bot-message-template-ui help content", () => {
  test("placeholder chips expose i18n label and hint keys", () => {
    for (const chip of WARNING_TEMPLATE_PLACEHOLDERS) {
      expect(chip.labelKey).toContain("botTemplate.placeholders.warning");
      expect(chip.hintKey).toContain("botTemplate.placeholders.warning");
    }
    for (const chip of BAN_TEMPLATE_PLACEHOLDERS) {
      expect(chip.labelKey).toContain("botTemplate.placeholders.ban");
      expect(chip.hintKey).toContain("botTemplate.placeholders.ban");
    }
  });

  test("docs URL points to Telegram HTML style", () => {
    expect(TELEGRAM_HTML_DOCS_URL).toContain("html-style");
  });

  test("length section key matches server max template length", () => {
    expect(MAX_BOT_MESSAGE_TEMPLATE_LENGTH).toBe(4096);
  });
});
