import { describe, expect, test } from "bun:test";
import { TelegramBot } from "../../../server/core/bot";

describe("TelegramBot webhook helpers", () => {
  test("does not expose removed setWebhook duplicate", () => {
    expect("setWebhook" in TelegramBot.prototype).toBe(false);
  });
});
