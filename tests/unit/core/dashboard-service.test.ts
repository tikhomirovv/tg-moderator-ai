import { describe, expect, test } from "bun:test";
import {
  buildDashboardData,
  buildTrend7d,
  computeBotKpi,
  countViolations,
  getLast7DayKeys,
  mapRecentActivity,
} from "../../../server/core/dashboard-service";
import type { BotResponse } from "../../../server/database/models/bot";
import type { ModerationAction } from "../../../server/database/models/moderation-action";

const referenceDate = new Date("2026-07-11T12:00:00");

function makeBot(overrides: Partial<BotResponse> = {}): BotResponse {
  return {
    id: "bot_a",
    name: "Bot A",
    chats: [{ chat_id: 1, name: "Chat 1", rules: [] }],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe("dashboard aggregation helpers", () => {
  test("getLast7DayKeys returns 7 consecutive days ending on reference date", () => {
    expect(getLast7DayKeys(referenceDate)).toEqual([
      "2026-07-05",
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
    ]);
  });

  test("countViolations sums warnings, deletes, and bans", () => {
    expect(
      countViolations({
        warnings_issued: 2,
        messages_deleted: 3,
        users_banned: 1,
      })
    ).toBe(6);
  });

  test("computeBotKpi aggregates bot and chat counts", () => {
    const bots = [
      makeBot({ id: "a", is_active: true, chats: [{ chat_id: 1, name: "C1", rules: [] }, { chat_id: 2, name: "C2", rules: [] }] }),
      makeBot({ id: "b", is_active: false, chats: [] }),
    ];

    expect(computeBotKpi(bots)).toEqual({
      bots_total: 2,
      bots_active: 1,
      bots_inactive: 1,
      chats_total: 2,
    });
  });

  test("buildTrend7d fills missing days with zeros", () => {
    const trend = buildTrend7d(
      [
        {
          date: "2026-07-10",
          messages_processed: 10,
          warnings_issued: 1,
          messages_deleted: 2,
          users_banned: 0,
        },
      ],
      referenceDate
    );

    expect(trend).toHaveLength(7);
    expect(trend[5]).toEqual({
      date: "2026-07-10",
      messages: 10,
      violations: 3,
    });
    expect(trend[0]).toEqual({
      date: "2026-07-05",
      messages: 0,
      violations: 0,
    });
  });

  test("mapRecentActivity projects moderation fields", () => {
    const action: ModerationAction = {
      bot_id: "bot_a",
      chat_id: -100,
      user_id: 42,
      message_id: 99,
      action_type: "warning",
      rule_violated: "spam",
      ai_confidence: 0.9,
      ai_reasoning: "test",
      timestamp: new Date("2026-07-11T10:00:00Z"),
      moderator_bot_id: "bot_a",
      created_at: new Date(),
    };

    expect(mapRecentActivity([action])).toEqual([
      {
        bot_id: "bot_a",
        chat_id: -100,
        action_type: "warning",
        rule_violated: "spam",
        timestamp: "2026-07-11T10:00:00.000Z",
      },
    ]);
  });

  test("buildDashboardData merges all sections", () => {
    const data = buildDashboardData({
      bots: [makeBot()],
      todayTotals: {
        messages_processed: 5,
        warnings_issued: 1,
        messages_deleted: 0,
        users_banned: 0,
      },
      dailyStats: [],
      actionBreakdown: { warning: 3, delete: 1, ban: 0 },
      recentActions: [],
      usersActive24h: 7,
      usersBanned: 2,
      referenceDate,
    });

    expect(data.has_bots).toBe(true);
    expect(data.kpi.today_messages).toBe(5);
    expect(data.kpi.users_active_24h).toBe(7);
    expect(data.kpi.users_banned).toBe(2);
    expect(data.trend_7d).toHaveLength(7);
    expect(data.action_breakdown.warning).toBe(3);
    expect(data.recent_activity).toEqual([]);
  });

  test("buildDashboardData reports empty workspace", () => {
    const data = buildDashboardData({
      bots: [],
      todayTotals: {
        messages_processed: 0,
        warnings_issued: 0,
        messages_deleted: 0,
        users_banned: 0,
      },
      dailyStats: [],
      actionBreakdown: { warning: 0, delete: 0, ban: 0 },
      recentActions: [],
      usersActive24h: 0,
      usersBanned: 0,
      referenceDate,
    });

    expect(data.has_bots).toBe(false);
    expect(data.kpi.bots_total).toBe(0);
  });
});
