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
  action_type: "warning" | "delete" | "ban";
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
