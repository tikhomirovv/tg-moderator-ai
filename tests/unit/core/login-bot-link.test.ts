import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  buildLoginBotLinkUrl,
  isLoginBotStartCommand,
  LOGIN_BOT_TOKEN_RATE_LIMIT_MAX,
} from "../../../server/core/login-bot-link";
import {
  issueLoginBotLink,
  redeemLoginBotToken,
} from "../../../server/utils/login-bot-token-service";

type TokenRow = {
  id: string;
  token: string;
  telegramId: number;
  username: string | null;
  name: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

function createMemoryStore() {
  const rows: TokenRow[] = [];

  return {
    countRecentByTelegramId: async (telegramId: number, since: Date) =>
      rows.filter(
        (row) => row.telegramId === telegramId && row.createdAt >= since
      ).length,
    insert: async (row: Omit<TokenRow, "consumedAt" | "createdAt">) => {
      rows.push({
        ...row,
        consumedAt: null,
        createdAt: new Date(),
      });
    },
    findByToken: async (token: string) => {
      const row = rows.find((item) => item.token === token);
      if (!row) return null;
      return {
        telegramId: row.telegramId,
        username: row.username,
        name: row.name,
        expiresAt: row.expiresAt,
        consumedAt: row.consumedAt,
      };
    },
    markConsumed: async (token: string, consumedAt: Date) => {
      const row = rows.find((item) => item.token === token);
      if (!row || row.consumedAt) return false;
      row.consumedAt = consumedAt;
      return true;
    },
    _rows: rows,
  };
}

describe("login bot link", () => {
  const originalBaseUrl = process.env.BASE_URL;

  beforeEach(() => {
    process.env.BASE_URL = "https://example.com";
  });

  afterEach(() => {
    process.env.BASE_URL = originalBaseUrl;
  });

  test("isLoginBotStartCommand accepts /login and /start login", () => {
    expect(isLoginBotStartCommand("/login")).toBe(true);
    expect(isLoginBotStartCommand("/start login")).toBe(true);
    expect(isLoginBotStartCommand("/start")).toBe(false);
  });

  test("buildLoginBotLinkUrl composes auth route", () => {
    expect(buildLoginBotLinkUrl("https://example.com/", "abc")).toBe(
      "https://example.com/auth/bot-link?token=abc"
    );
  });

  test("issueLoginBotLink returns one-time URL", async () => {
    const store = createMemoryStore();
    const result = await issueLoginBotLink(
      { telegramId: 42, username: "alice", name: "Alice" },
      store
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toContain("/auth/bot-link?token=");
    }
  });

  test("issueLoginBotLink rate limits per telegram id", async () => {
    const store = createMemoryStore();

    for (let i = 0; i < LOGIN_BOT_TOKEN_RATE_LIMIT_MAX; i++) {
      const result = await issueLoginBotLink(
        { telegramId: 99, name: "Bob" },
        store
      );
      expect(result.ok).toBe(true);
    }

    const blocked = await issueLoginBotLink({ telegramId: 99, name: "Bob" }, store);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe("rate_limited");
    }
  });

  test("redeemLoginBotToken is single-use", async () => {
    const store = createMemoryStore();
    const issued = await issueLoginBotLink(
      { telegramId: 7, name: "Carol" },
      store
    );
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;

    const token = new URL(issued.url).searchParams.get("token");
    expect(token).toBeTruthy();

    const first = await redeemLoginBotToken(token!, store);
    expect(first.ok).toBe(true);

    const second = await redeemLoginBotToken(token!, store);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.code).toBe("consumed");
    }
  });

  test("redeemLoginBotToken rejects expired token", async () => {
    const store = createMemoryStore();
    await store.insert({
      id: "id-1",
      token: "expired-token",
      telegramId: 1,
      username: null,
      name: "Expired",
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await redeemLoginBotToken("expired-token", store);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("expired");
    }
  });
});
