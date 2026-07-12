import { describe, expect, test } from "bun:test";
import { InMemoryBotRepository } from "../../helpers/in-memory-bot-repository";
import { TEST_OWNER_USER_ID } from "../../helpers/constants";
import { resolveBotIdentityFromGetMe } from "../../../server/core/resolve-bot-from-token";

describe("bot create from resolved token identity", () => {
  test("create sets owner in bot_members", async () => {
    const botRepo = new InMemoryBotRepository();
    const identity = resolveBotIdentityFromGetMe(
      { username: "mod_bot", first_name: "Moderator" },
      "secret"
    );

    const created = await botRepo.create(TEST_OWNER_USER_ID, identity);
    expect(created.id).toBe("mod_bot");
    expect(created.name).toBe("Moderator");
    expect(created.my_role).toBe("owner");

    const listed = await botRepo.findAllForUser(TEST_OWNER_USER_ID);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe("mod_bot");
  });

  test("duplicate bot id is detectable before create", async () => {
    const botRepo = new InMemoryBotRepository();
    const identity = resolveBotIdentityFromGetMe(
      { username: "dup_bot", first_name: "Dup" },
      "token-1"
    );

    await botRepo.create(TEST_OWNER_USER_ID, identity);
    const existing = await botRepo.findById("dup_bot");
    expect(existing).not.toBeNull();
  });
});
