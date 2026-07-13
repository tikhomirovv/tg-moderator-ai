import { describe, expect, test } from "bun:test";
import {
  appendMentionIfMissing,
  buildUserMention,
  DEFAULT_BAN_TEMPLATE,
  DEFAULT_WARNING_TEMPLATE,
  renderBotMessage,
  resolveModerationReplyToMessageId,
} from "../../../server/core/bot-message-templates";

describe("bot-message-templates", () => {
  test("renders warning placeholders", () => {
    const text = renderBotMessage(DEFAULT_WARNING_TEMPLATE, {
      user_mention: "<a>@alice</a>",
      user_name: "Alice",
      rule_name: "Spam",
      warnings_current: "2",
      warnings_max: "3",
      warnings_left: "1",
    });

    expect(text).toContain("Spam");
    expect(text).toContain("2/3");
    expect(text).toContain("До блокировки: <b>1</b>");
    expect(text).not.toContain("{rule_name}");
  });

  test("appends mention footer when template has no user_mention placeholder", () => {
    const template = "Warn: {rule_name}";
    const rendered = renderBotMessage(template, {
      user_mention: "<a>@bob</a>",
      user_name: "Bob",
      rule_name: "Ads",
      warnings_current: "1",
      warnings_max: "3",
      warnings_left: "2",
    });

    expect(rendered).toEndWith("<a>@bob</a>");
    expect(rendered).toContain("Warn: Ads");
  });

  test("does not duplicate mention when placeholder is present", () => {
    const template = "Hi {user_mention}, rule: {rule_name}";
    const rendered = renderBotMessage(template, {
      user_mention: "<a>@bob</a>",
      user_name: "Bob",
      rule_name: "Ads",
      warnings_current: "1",
      warnings_max: "3",
      warnings_left: "2",
    });

    expect(rendered.match(/@bob/g)?.length).toBe(1);
  });

  test("renders ban template without warnings placeholders", () => {
    const text = renderBotMessage(DEFAULT_BAN_TEMPLATE, {
      user_mention: "<a>@carol</a>",
      user_name: "Carol",
      rule_name: "Hate",
    });

    expect(text).toContain("Hate");
    expect(text).not.toContain("{warnings");
  });

  test("buildUserMention uses plain @username without t.me link", () => {
    const mention = buildUserMention({
      id: 1,
      first_name: "Alice",
      username: "alice",
      is_bot: false,
    });

    expect(mention).toBe("@alice");
    expect(mention).not.toContain("<a");
    expect(mention).not.toContain("t.me");
  });

  test("buildUserMention uses tg link when username is missing", () => {
    const mention = buildUserMention({
      id: 42,
      first_name: "NoUsername",
      username: undefined,
      is_bot: false,
    });

    expect(mention).toContain('tg://user?id=42');
    expect(mention).toContain("NoUsername");
  });

  test("resolveModerationReplyToMessageId omits reply when delete is planned", () => {
    expect(resolveModerationReplyToMessageId(true, 99)).toBeUndefined();
    expect(resolveModerationReplyToMessageId(false, 99)).toBe(99);
  });

  test("appendMentionIfMissing is a no-op when placeholder exists", () => {
    expect(
      appendMentionIfMissing(
        "Hello {user_mention}",
        "Hello <a>@x</a>",
        "<a>@x</a>"
      )
    ).toBe("Hello <a>@x</a>");
  });
});
