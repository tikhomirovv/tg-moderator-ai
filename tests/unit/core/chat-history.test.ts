import { describe, expect, test } from "bun:test";
import {
  buildChatHistoryForPrompt,
  selectOldestMessageIdsToPrune,
} from "../../../server/core/chat-history";

describe("chat-history", () => {
  test("buildChatHistoryForPrompt returns chronological JSON entries", () => {
    const history = buildChatHistoryForPrompt(
      [
        {
          message_id: 2,
          text: "second",
          timestamp: new Date("2026-07-11T12:00:00.000Z"),
        },
        {
          message_id: 1,
          text: "first",
          timestamp: new Date("2026-07-11T11:00:00.000Z"),
        },
      ],
      99
    );

    expect(history).toEqual([
      {
        text: "first",
        timestamp: "2026-07-11T11:00:00.000Z",
      },
      {
        text: "second",
        timestamp: "2026-07-11T12:00:00.000Z",
      },
    ]);
  });

  test("buildChatHistoryForPrompt excludes current message id", () => {
    const history = buildChatHistoryForPrompt(
      [
        {
          message_id: 10,
          text: "current",
          timestamp: new Date("2026-07-11T12:00:00.000Z"),
        },
        {
          message_id: 9,
          text: "previous",
          timestamp: new Date("2026-07-11T11:00:00.000Z"),
        },
      ],
      10
    );

    expect(history).toEqual([
      {
        text: "previous",
        timestamp: "2026-07-11T11:00:00.000Z",
      },
    ]);
  });

  test("selectOldestMessageIdsToPrune keeps newest 100 messages", () => {
    const ids = Array.from({ length: 101 }, (_, index) => index + 1);

    expect(selectOldestMessageIdsToPrune(ids, 100)).toEqual([1]);
  });
});
