import { describe, expect, test } from "bun:test";
import { CHAT_ACTIVATION_PREREQUISITE_COUNT } from "../../../lib/chat-activation-ui";

describe("chat-activation-ui", () => {
  test("exports prerequisite count for modal list", () => {
    expect(CHAT_ACTIVATION_PREREQUISITE_COUNT).toBe(4);
  });
});
