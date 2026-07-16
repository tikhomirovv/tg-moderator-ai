import type { Chat as DbChat } from "./models/bot";
import type { Rule } from "./models/rule";
import type { ModerationDecision } from "./models/moderation-decision";
import type { ModerationAction } from "./models/moderation-action";
import type { UserContext } from "./models/user-context";
import type { UserMessage } from "./models/user-message";
import type { ChatStatistics } from "./models/chat-statistics";

type RuleRow = typeof import("./schema").rules.$inferSelect;
type BotRow = typeof import("./schema").bots.$inferSelect;
type ChatRow = typeof import("./schema").chats.$inferSelect;
type ModerationDecisionRow =
  typeof import("./schema").moderationDecisions.$inferSelect;
type ModerationActionRow =
  typeof import("./schema").moderationActions.$inferSelect;
type UserContextRow = typeof import("./schema").userContexts.$inferSelect;
type UserMessageRow = typeof import("./schema").userMessages.$inferSelect;
type ChatStatisticsRow = typeof import("./schema").chatStatistics.$inferSelect;

export function toRule(row: RuleRow): Rule {
  return {
    id: row.id,
    chat_id: row.chatId,
    name: row.name,
    description: row.description,
    ai_prompt: row.aiPrompt,
    is_active: row.isActive,
    delete_on_violation: row.deleteOnViolation,
    ban_on_violation: row.banOnViolation,
    warnings_before_ban: row.warningsBeforeBan,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toChat(row: ChatRow, rulesCount = 0): DbChat {
  return {
    id: row.id,
    chat_id: row.chatId,
    name: row.name,
    silent_mode: row.silentMode,
    rules_count: rulesCount,
    photo_file_id: row.photoFileId,
    telegram_username: row.telegramUsername,
    health_status: row.healthStatus ?? null,
    health_message: row.healthMessage,
    health_checked_at: row.healthCheckedAt,
  };
}

export function toBotResponse(
  row: BotRow,
  chats: DbChat[]
): import("./models/bot").BotResponse {
  return {
    id: row.id,
    name: row.name,
    chats,
    is_active: row.isActive,
    warning_message_template: row.warningMessageTemplate,
    ban_message_template: row.banMessageTemplate,
    photo_file_id: row.photoFileId,
    telegram_bot_id: row.telegramBotId,
    credit_balance: row.creditBalance,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toBot(row: BotRow, chats: DbChat[]): import("./models/bot").Bot {
  return {
    id: row.id,
    name: row.name,
    chats,
    token: row.token ?? undefined,
    owner_user_id: row.ownerUserId,
    is_active: row.isActive,
    webhook_secret: row.webhookSecret,
    photo_file_id: row.photoFileId,
    telegram_bot_id: row.telegramBotId,
    warning_message_template: row.warningMessageTemplate,
    ban_message_template: row.banMessageTemplate,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toModerationDecision(
  row: ModerationDecisionRow
): ModerationDecision {
  return {
    _id: String(row.id),
    bot_id: row.botId,
    chat_id: row.chatId,
    user_id: row.userId,
    message_id: row.messageId,
    message_text: row.messageText,
    violation_detected: row.violationDetected,
    rule_violated: row.ruleViolated ?? undefined,
    ai_confidence: row.aiConfidence,
    ai_reasoning: row.aiReasoning,
    rules_applied: row.rulesApplied,
    timestamp: row.timestamp,
    created_at: row.createdAt,
  };
}

export function toModerationAction(row: ModerationActionRow): ModerationAction {
  return {
    _id: String(row.id),
    bot_id: row.botId,
    chat_id: row.chatId,
    user_id: row.userId,
    message_id: row.messageId,
    action_type: row.actionType,
    rule_violated: row.ruleViolated ?? undefined,
    ai_confidence: row.aiConfidence,
    ai_reasoning: row.aiReasoning,
    timestamp: row.timestamp,
    moderator_bot_id: row.moderatorBotId,
    created_at: row.createdAt,
  };
}

export function toUserContext(row: UserContextRow): UserContext {
  return {
    _id: String(row.id),
    bot_id: row.botId,
    chat_id: row.chatId,
    user_id: row.userId,
    username: row.username ?? undefined,
    first_name: row.firstName ?? undefined,
    last_name: row.lastName ?? undefined,
    warnings_count: row.warningsCount,
    is_banned: row.isBanned,
    banned_at: row.bannedAt ?? undefined,
    banned_by: row.bannedBy ?? undefined,
    last_activity: row.lastActivity,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toUserMessage(row: UserMessageRow): UserMessage {
  return {
    _id: String(row.id),
    bot_id: row.botId,
    chat_id: row.chatId,
    user_id: row.userId,
    message_id: row.messageId,
    text: row.text,
    timestamp: row.timestamp,
    is_deleted: row.isDeleted,
    is_moderated: row.isModerated,
    deleted_at: row.deletedAt ?? undefined,
    deleted_reason: row.deletedReason ?? undefined,
    created_at: row.createdAt,
  };
}

export function toChatStatistics(row: ChatStatisticsRow): ChatStatistics {
  return {
    _id: String(row.id),
    bot_id: row.botId,
    chat_id: row.chatId,
    date: new Date(row.date),
    messages_processed: row.messagesProcessed,
    warnings_issued: row.warningsIssued,
    messages_deleted: row.messagesDeleted,
    users_banned: row.usersBanned,
    unique_users: row.uniqueUsers,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
