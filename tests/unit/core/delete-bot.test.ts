import { describe, expect, test } from "bun:test";
import {
  deleteBotPermanently,
  DeleteBotError,
} from "../../../server/core/delete-bot";
import { enforceBotAccess } from "../../../server/utils/bot-access";
import { InMemoryBotRepository } from "../../helpers/in-memory-bot-repository";
import { TEST_OWNER_USER_ID } from "../../helpers/constants";

describe("deleteBotPermanently", () => {
  test("deletes bot row after best-effort webhook removal", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "delete-me",
      name: "Delete Me",
      token: "secret-token",
    });

    const deleteWebhookCalls: string[] = [];

    await deleteBotPermanently("delete-me", {
      findByIdWithToken: (id) => botRepo.findByIdWithToken(id),
      deleteBot: (id) => botRepo.delete(id),
      deleteWebhook: async (token) => {
        deleteWebhookCalls.push(token);
      },
      fetchFn: fetch,
    });

    expect(deleteWebhookCalls).toEqual(["secret-token"]);
    expect(await botRepo.findById("delete-me")).toBeNull();
  });

  test("still deletes bot when webhook removal fails", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "webhook-fail",
      name: "Webhook Fail",
      token: "bad-token",
    });

    await deleteBotPermanently("webhook-fail", {
      findByIdWithToken: (id) => botRepo.findByIdWithToken(id),
      deleteBot: (id) => botRepo.delete(id),
      deleteWebhook: async () => {
        throw new Error("Telegram unavailable");
      },
      fetchFn: fetch,
    });

    expect(await botRepo.findById("webhook-fail")).toBeNull();
  });

  test("throws 404 when bot does not exist", async () => {
    const botRepo = new InMemoryBotRepository();

    await expect(
      deleteBotPermanently("missing", {
        findByIdWithToken: (id) => botRepo.findByIdWithToken(id),
        deleteBot: (id) => botRepo.delete(id),
        deleteWebhook: async () => {},
        fetchFn: fetch,
      })
    ).rejects.toBeInstanceOf(DeleteBotError);
  });

  test("manager can pass member access gate without owner role", () => {
    expect(enforceBotAccess("manager")).toBe("manager");
    expect(enforceBotAccess("owner")).toBe("owner");
  });
});
