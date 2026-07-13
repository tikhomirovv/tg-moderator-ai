import { describe, expect, test } from "bun:test";
import {
  BOT_MESSAGE_HTML_HELP,
  TELEGRAM_HTML_DOCS_URL,
} from "../../../lib/bot-message-template-ui";
import { MAX_BOT_MESSAGE_TEMPLATE_LENGTH } from "../../../server/utils/bot-message-template-validation";

describe("bot-message-template-ui help content", () => {
  test("help sections cover tags, placeholders, and length", () => {
    const titles = BOT_MESSAGE_HTML_HELP.map((section) => section.title);
    expect(titles).toContain("Поддерживаемые теги");
    expect(titles).toContain("Плейсхолдеры");
    expect(titles).toContain("Длина");
  });

  test("docs URL points to Telegram HTML style", () => {
    expect(TELEGRAM_HTML_DOCS_URL).toContain("html-style");
  });

  test("length section matches server max template length", () => {
    const lengthSection = BOT_MESSAGE_HTML_HELP.find(
      (section) => section.title === "Длина"
    );
    expect(lengthSection?.body).toContain(String(MAX_BOT_MESSAGE_TEMPLATE_LENGTH));
    expect(MAX_BOT_MESSAGE_TEMPLATE_LENGTH).toBe(4096);
  });
});
