import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  serial,
  date,
  real,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";

export const actionTypeEnum = pgEnum("action_type", [
  "warning",
  "delete",
  "ban",
]);

export const rules = pgTable(
  "rules",
  {
    id: varchar("id", { length: 64 }).notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    aiPrompt: text("ai_prompt").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    deleteOnViolation: boolean("delete_on_violation").notNull().default(false),
    banOnViolation: boolean("ban_on_violation").notNull().default(false),
    warningsBeforeBan: integer("warnings_before_ban"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.id] })]
);

export const ruleWhitelist = pgTable(
  "rule_whitelist",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    ruleId: varchar("rule_id", { length: 64 }).notNull(),
    entry: varchar("entry", { length: 255 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workspaceId, table.ruleId],
      foreignColumns: [rules.workspaceId, rules.id],
    }).onDelete("cascade"),
    uniqueIndex("rule_whitelist_rule_entry_unique").on(
      table.ruleId,
      table.entry
    ),
  ]
);

export const bots = pgTable(
  "bots",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    token: text("token"),
    webhookSecret: text("webhook_secret"),
    isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bots_workspace_id_unique").on(table.workspaceId, table.id),
  ]
);

export const chats = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    silentMode: boolean("silent_mode").notNull().default(false),
  },
  (table) => [
    uniqueIndex("chats_bot_chat_unique").on(table.botId, table.chatId),
  ]
);

export const chatRules = pgTable(
  "chat_rules",
  {
    chatId: integer("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").notNull(),
    ruleId: varchar("rule_id", { length: 64 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.ruleId] }),
    foreignKey({
      columns: [table.workspaceId, table.ruleId],
      foreignColumns: [rules.workspaceId, rules.id],
    }).onDelete("cascade"),
  ]
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 }).notNull(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    actionType: actionTypeEnum("action_type").notNull(),
    ruleViolated: varchar("rule_violated", { length: 64 }),
    aiConfidence: real("ai_confidence").notNull(),
    aiReasoning: text("ai_reasoning").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    moderatorBotId: varchar("moderator_bot_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("moderation_actions_bot_chat_ts").on(
      table.botId,
      table.chatId,
      table.timestamp
    ),
    index("moderation_actions_bot_user_ts").on(
      table.botId,
      table.chatId,
      table.userId,
      table.timestamp
    ),
    index("moderation_actions_type").on(table.actionType),
  ]
);

export const userContexts = pgTable(
  "user_contexts",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 }).notNull(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    username: varchar("username", { length: 255 }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    warningsCount: integer("warnings_count").notNull().default(0),
    isBanned: boolean("is_banned").notNull().default(false),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    bannedBy: varchar("banned_by", { length: 64 }),
    lastActivity: timestamp("last_activity", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_contexts_unique").on(
      table.botId,
      table.chatId,
      table.userId
    ),
    index("user_contexts_last_activity").on(table.lastActivity),
    index("user_contexts_banned").on(table.isBanned),
  ]
);

export const userMessages = pgTable(
  "user_messages",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 }).notNull(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    text: text("text").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedReason: text("deleted_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_messages_unique").on(
      table.botId,
      table.chatId,
      table.messageId
    ),
    index("user_messages_user_ts").on(
      table.botId,
      table.chatId,
      table.userId,
      table.timestamp
    ),
    index("user_messages_ts").on(table.timestamp),
    index("user_messages_deleted").on(table.isDeleted),
  ]
);

export const chatStatistics = pgTable(
  "chat_statistics",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 }).notNull(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    date: date("date").notNull(),
    messagesProcessed: integer("messages_processed").notNull().default(0),
    warningsIssued: integer("warnings_issued").notNull().default(0),
    messagesDeleted: integer("messages_deleted").notNull().default(0),
    usersBanned: integer("users_banned").notNull().default(0),
    uniqueUsers: integer("unique_users").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("chat_statistics_unique").on(
      table.botId,
      table.chatId,
      table.date
    ),
    index("chat_statistics_date").on(table.date),
  ]
);
