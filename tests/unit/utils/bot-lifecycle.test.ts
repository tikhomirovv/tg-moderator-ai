import { afterEach, describe, expect, test } from "bun:test";
import type { BotRepository } from "../../../server/database/repositories/bot-repository";
import {
  BotLifecycleError,
  disableBot,
  enableBot,
  reconcileBotWebhook,
} from "../../../server/utils/bot-lifecycle";
import { InMemoryBotRepository } from "../../helpers/in-memory-bot-repository";
import { TEST_OWNER_USER_ID } from "../../helpers/constants";

const originalBaseUrl = process.env.BASE_URL;

afterEach(() => {
  if (originalBaseUrl === undefined) {
    delete process.env.BASE_URL;
  } else {
    process.env.BASE_URL = originalBaseUrl;
  }
});

function asBotRepository(repo: InMemoryBotRepository): BotRepository {
  return repo as unknown as BotRepository;
}

describe("bot lifecycle", () => {
  test("disable removes webhook and sets bot inactive", async () => {
    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "disable-bot",
      name: "Disable me",
      token: "secret",
      chats: [],
    });

    const fetchCalls: string[] = [];
    const fetchFn = async (url: string) => {
      fetchCalls.push(url);
      return new Response(JSON.stringify({ ok: true }));
    };

    const result = await disableBot("disable-bot", {
      botRepo: asBotRepository(botRepo),
      fetchFn,
    });

    expect(result.bot.is_active).toBe(false);
    expect(result.webhookRegistered).toBe(false);
    expect(fetchCalls[0]).toContain("/deleteWebhook");

    const stored = await botRepo.findById("disable-bot");
    expect(stored?.is_active).toBe(false);
  });

  test("enable sets webhook when BASE_URL is HTTPS", async () => {
    process.env.BASE_URL = "https://example.com";

    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "enable-bot",
      name: "Enable me",
      token: "secret",
      chats: [],
    });
    await botRepo.update("enable-bot", { is_active: false });

    const fetchFn = async () =>
      new Response(JSON.stringify({ ok: true }));

    const result = await enableBot("enable-bot", {
      botRepo: asBotRepository(botRepo),
      fetchFn,
    });

    expect(result.bot.is_active).toBe(true);
    expect(result.webhookRegistered).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  test("enable without HTTPS BASE_URL keeps bot active with warning", async () => {
    delete process.env.BASE_URL;

    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "warn-bot",
      name: "Warn me",
      token: "secret",
      chats: [],
    });
    await botRepo.update("warn-bot", { is_active: false });

    const result = await enableBot("warn-bot", {
      botRepo: asBotRepository(botRepo),
      fetchFn: async () => new Response(JSON.stringify({ ok: true })),
    });

    expect(result.bot.is_active).toBe(true);
    expect(result.webhookRegistered).toBe(false);
    expect(result.warning).toContain("HTTPS BASE_URL");
  });

  test("enable rolls back when Telegram rejects webhook", async () => {
    process.env.BASE_URL = "https://example.com";

    const botRepo = new InMemoryBotRepository();
    await botRepo.create(TEST_OWNER_USER_ID, {
      id: "rollback-bot",
      name: "Rollback",
      token: "secret",
      chats: [],
    });
    await botRepo.update("rollback-bot", { is_active: false });

    const fetchFn = async () =>
      new Response(JSON.stringify({ ok: false, description: "invalid url" }));

    await expect(
      enableBot("rollback-bot", {
        botRepo: asBotRepository(botRepo),
        fetchFn,
      })
    ).rejects.toBeInstanceOf(BotLifecycleError);

    const stored = await botRepo.findById("rollback-bot");
    expect(stored?.is_active).toBe(false);
  });

  test("reconcile re-registers webhook when Telegram URL mismatches", async () => {
    process.env.BASE_URL = "https://example.com";

    const fetchCalls: string[] = [];
    const fetchFn = async (url: string) => {
      fetchCalls.push(url);
      if (url.includes("getWebhookInfo")) {
        return new Response(
          JSON.stringify({
            ok: true,
            result: {
              url: "https://old.example.com/api/telegram/webhook/reconcile-bot",
            },
          })
        );
      }
      return new Response(JSON.stringify({ ok: true }));
    };

    await reconcileBotWebhook(
      "reconcile-bot",
      {
        token: "secret",
        webhook_secret: "whsec",
        is_active: true,
      },
      { fetchFn }
    );

    expect(fetchCalls.some((url) => url.includes("setWebhook"))).toBe(true);
  });
});
