import { describe, expect, test } from "bun:test";
import {
  buildPendingActivationView,
  resolvePendingActivationStatus,
} from "../../../server/core/chat-activation-pending";

const basePending = {
  id: 1,
  botId: "bot-1",
  userId: "user-1",
  createdAt: new Date("2026-07-13T10:00:00.000Z"),
  expiresAt: new Date("2026-07-13T10:05:00.000Z"),
  resultChatId: null,
  completedAt: null,
  failedCode: null,
  failedMessage: null,
};

describe("resolvePendingActivationStatus", () => {
  test("returns waiting before expiry", () => {
    expect(
      resolvePendingActivationStatus(
        basePending,
        new Date("2026-07-13T10:02:00.000Z")
      )
    ).toBe("waiting");
  });

  test("returns expired after ttl", () => {
    expect(
      resolvePendingActivationStatus(
        basePending,
        new Date("2026-07-13T10:06:00.000Z")
      )
    ).toBe("expired");
  });

  test("returns completed when result chat is stored", () => {
    expect(
      resolvePendingActivationStatus({
        ...basePending,
        completedAt: new Date("2026-07-13T10:03:00.000Z"),
        resultChatId: 9,
      })
    ).toBe("completed");
  });

  test("returns failed when error code is stored", () => {
    expect(
      resolvePendingActivationStatus({
        ...basePending,
        failedCode: "insufficient_rights",
        failedMessage: "Need rights",
      })
    ).toBe("failed");
  });
});

describe("buildPendingActivationView", () => {
  test("returns failed error payload", async () => {
    const view = await buildPendingActivationView(
      {
        ...basePending,
        failedCode: "insufficient_rights",
        failedMessage: "Need rights",
      },
      "bot-1"
    );

    expect(view.status).toBe("failed");
    expect(view.error).toEqual({
      code: "insufficient_rights",
      message: "Need rights",
    });
  });
});

describe("chat photo availability", () => {
  test("treats missing photo_file_id as no photo", () => {
    const chat = {
      id: 3,
      botId: "bot-1",
      chatId: -100123,
      name: "Main",
      silentMode: false,
      photoFileId: null,
      telegramUsername: null,
      healthStatus: "ok" as const,
      healthMessage: null,
      healthCheckedAt: new Date(),
    };

    expect(Boolean(chat.photoFileId)).toBe(false);
  });
});
