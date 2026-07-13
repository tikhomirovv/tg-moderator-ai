import { describe, expect, test } from "bun:test";
import { CHAT_ACTIVATION_PREREQUISITES } from "../../../lib/chat-activation-ui";

describe("chat-activation-ui", () => {
  test("lists platform and Telegram preconditions", () => {
    expect(CHAT_ACTIVATION_PREREQUISITES.join(" ")).toContain("manager");
    expect(CHAT_ACTIVATION_PREREQUISITES.join(" ")).toContain("Telegram");
    expect(CHAT_ACTIVATION_PREREQUISITES.length).toBeGreaterThanOrEqual(4);
  });
});
