import { describe, expect, test } from "bun:test";
import {
  BotCreateValidationError,
  resolveBotIdentityFromGetMe,
} from "../../../server/core/resolve-bot-from-token";

describe("resolveBotIdentityFromGetMe", () => {
  test("maps username to id and first_name to name", () => {
    const identity = resolveBotIdentityFromGetMe(
      {
        username: "My_Mod_Bot",
        first_name: "Moderator",
      },
      "123:ABC"
    );

    expect(identity).toEqual({
      id: "my_mod_bot",
      name: "Moderator",
      token: "123:ABC",
    });
  });

  test("falls back to username when first_name is empty", () => {
    const identity = resolveBotIdentityFromGetMe(
      {
        username: "helper_bot",
        first_name: "   ",
      },
      "token"
    );

    expect(identity.name).toBe("helper_bot");
  });

  test("rejects missing username", () => {
    expect(() =>
      resolveBotIdentityFromGetMe({ username: undefined, first_name: "Bot" }, "token")
    ).toThrow(BotCreateValidationError);

    try {
      resolveBotIdentityFromGetMe({ username: "", first_name: "Bot" }, "token");
    } catch (error) {
      expect(error).toMatchObject({
        code: "missing_username",
      });
    }
  });

  test("rejects empty token", () => {
    expect(() =>
      resolveBotIdentityFromGetMe({ username: "bot", first_name: "Bot" }, "  ")
    ).toThrow(BotCreateValidationError);
  });
});
