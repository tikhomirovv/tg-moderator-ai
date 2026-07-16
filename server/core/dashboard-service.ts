import type { BotResponse } from "../database/models/bot";
import type {
  ModerationAction,
  ModerationActionType,
} from "../database/models/moderation-action";
import { toDateKey } from "../database/mappers";

export interface DashboardKpi {
  bots_total: number;
  bots_active: number;
  bots_inactive: number;
  chats_total: number;
  today_messages: number;
  today_warnings: number;
  today_deletes: number;
  today_bans: number;
  users_active_24h: number;
  users_banned: number;
}

export interface DashboardTrendDay {
  date: string;
  messages: number;
  violations: number;
}

export interface DashboardActionBreakdown {
  warning: number;
  delete: number;
  ban: number;
}

export interface DashboardRecentActivityItem {
  bot_id: string;
  chat_id: number;
  action_type: ModerationActionType;
  rule_violated?: string;
  timestamp: string;
}

export interface DashboardData {
  kpi: DashboardKpi;
  trend_7d: DashboardTrendDay[];
  action_breakdown: DashboardActionBreakdown;
  recent_activity: DashboardRecentActivityItem[];
  has_bots: boolean;
}

export interface UserBotsDailyStatRow {
  date: string;
  messages_processed: number;
  warnings_issued: number;
  messages_deleted: number;
  users_banned: number;
}

export interface UserBotsTodayTotals {
  messages_processed: number;
  warnings_issued: number;
  messages_deleted: number;
  users_banned: number;
}

export interface DashboardRawInput {
  bots: BotResponse[];
  todayTotals: UserBotsTodayTotals;
  dailyStats: UserBotsDailyStatRow[];
  actionBreakdown: DashboardActionBreakdown;
  recentActions: ModerationAction[];
  usersActive24h: number;
  usersBanned: number;
  referenceDate?: Date;
}

/** Last 7 calendar days ending on referenceDate (inclusive). */
export function getLast7DayKeys(referenceDate: Date = new Date()): string[] {
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const keys: string[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(end);
    day.setDate(day.getDate() - offset);
    keys.push(toDateKey(day));
  }

  return keys;
}

export function getLast7DayRange(referenceDate: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    23,
    59,
    59,
    999
  );
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function countViolations(row: {
  warnings_issued: number;
  messages_deleted: number;
  users_banned: number;
}): number {
  return row.warnings_issued + row.messages_deleted + row.users_banned;
}

export function computeBotKpi(bots: BotResponse[]): {
  bots_total: number;
  bots_active: number;
  bots_inactive: number;
  chats_total: number;
} {
  const bots_total = bots.length;
  const bots_active = bots.filter((bot) => bot.is_active).length;

  return {
    bots_total,
    bots_active,
    bots_inactive: bots_total - bots_active,
    chats_total: bots.reduce((sum, bot) => sum + (bot.chats?.length ?? 0), 0),
  };
}

export function buildTrend7d(
  dailyStats: UserBotsDailyStatRow[],
  referenceDate: Date = new Date()
): DashboardTrendDay[] {
  const byDate = new Map(
    dailyStats.map((row) => [
      row.date,
      {
        messages: row.messages_processed,
        violations: countViolations(row),
      },
    ])
  );

  return getLast7DayKeys(referenceDate).map((date) => {
    const entry = byDate.get(date);
    return {
      date,
      messages: entry?.messages ?? 0,
      violations: entry?.violations ?? 0,
    };
  });
}

export function mapRecentActivity(
  actions: ModerationAction[]
): DashboardRecentActivityItem[] {
  return actions.map((action) => ({
    bot_id: action.bot_id,
    chat_id: action.chat_id,
    action_type: action.action_type,
    rule_violated: action.rule_violated,
    timestamp: action.timestamp.toISOString(),
  }));
}

export function buildDashboardData(input: DashboardRawInput): DashboardData {
  const referenceDate = input.referenceDate ?? new Date();
  const botKpi = computeBotKpi(input.bots);

  return {
    has_bots: input.bots.length > 0,
    kpi: {
      ...botKpi,
      today_messages: input.todayTotals.messages_processed,
      today_warnings: input.todayTotals.warnings_issued,
      today_deletes: input.todayTotals.messages_deleted,
      today_bans: input.todayTotals.users_banned,
      users_active_24h: input.usersActive24h,
      users_banned: input.usersBanned,
    },
    trend_7d: buildTrend7d(input.dailyStats, referenceDate),
    action_breakdown: input.actionBreakdown,
    recent_activity: mapRecentActivity(input.recentActions),
  };
}

export interface DashboardRepositories {
  findBots(userId: string): Promise<BotResponse[]>;
  getTodayTotals(
    botIds: string[],
    date: Date
  ): Promise<UserBotsTodayTotals>;
  getDailyStats(
    botIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<UserBotsDailyStatRow[]>;
  getActionBreakdown(
    botIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DashboardActionBreakdown>;
  getRecentActions(
    botIds: string[],
    limit: number
  ): Promise<ModerationAction[]>;
  countActiveUsers24h(botIds: string[]): Promise<number>;
  countBannedUsers(botIds: string[]): Promise<number>;
}

export async function loadDashboardData(
  userId: string,
  repos: DashboardRepositories,
  referenceDate: Date = new Date()
): Promise<DashboardData> {
  const bots = await repos.findBots(userId);
  const botIds = bots.map((bot) => bot.id);
  const { start, end } = getLast7DayRange(referenceDate);

  const [
    todayTotals,
    dailyStats,
    actionBreakdown,
    recentActions,
    usersActive24h,
    usersBanned,
  ] = await Promise.all([
    repos.getTodayTotals(botIds, referenceDate),
    repos.getDailyStats(botIds, start, end),
    repos.getActionBreakdown(botIds, start, end),
    repos.getRecentActions(botIds, 20),
    // Distinct Telegram user_id across accessible bots — same user in multiple chats counts once.
    repos.countActiveUsers24h(botIds),
    repos.countBannedUsers(botIds),
  ]);

  return buildDashboardData({
    bots,
    todayTotals,
    dailyStats,
    actionBreakdown,
    recentActions,
    usersActive24h,
    usersBanned,
    referenceDate,
  });
}
