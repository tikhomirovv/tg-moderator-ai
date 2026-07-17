import {
  pgTable,
  varchar,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  bigint,
  serial,
  date,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth-schema";

export const actionTypeEnum = pgEnum("action_type", [
  "warning",
  "delete",
  "ban",
  "reset_warnings",
  "unban",
  "pardon",
]);

export const botMemberRoleEnum = pgEnum("bot_member_role", ["owner", "manager"]);

export const chatHealthStatusEnum = pgEnum("chat_health_status", [
  "ok",
  "degraded",
  "unhealthy",
]);

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "grant_signup",
  "purchase",
  "debit_moderation",
  "admin_adjust",
  "reconcile_fix",
  "referral_bonus",
]);

export const referrerStatusEnum = pgEnum("referrer_status", [
  "pending",
  "claimed",
  "skipped_zero",
]);

export const providerPaymentStatusEnum = pgEnum("provider_payment_status", [
  "pending",
  "succeeded",
  "canceled",
  "credited",
]);

export const bots = pgTable("bots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  token: text("token"),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").notNull().default(true),
  warningMessageTemplate: text("warning_message_template"),
  banMessageTemplate: text("ban_message_template"),
  photoFileId: text("photo_file_id"),
  telegramBotId: bigint("telegram_bot_id", { mode: "number" }),
  creditBalance: integer("credit_balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const instanceSettings = pgTable("instance_settings", {
  id: text("id").primaryKey().default("default"),
  llmApiKeyEncrypted: text("llm_api_key_encrypted"),
  llmBaseUrl: text("llm_base_url"),
  llmModel: text("llm_model"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
    photoFileId: text("photo_file_id"),
    telegramUsername: text("telegram_username"),
    healthStatus: chatHealthStatusEnum("health_status"),
    healthMessage: text("health_message"),
    healthCheckedAt: timestamp("health_checked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("chats_bot_chat_unique").on(table.botId, table.chatId),
  ]
);

export const chatActivationPending = pgTable(
  "chat_activation_pending",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    resultChatId: integer("result_chat_id").references(() => chats.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedCode: text("failed_code"),
    failedMessage: text("failed_message"),
  },
  (table) => [
    index("chat_activation_pending_bot_user_created_idx").on(
      table.botId,
      table.userId,
      table.createdAt
    ),
  ]
);

export const rules = pgTable(
  "rules",
  {
    id: uuid("id").notNull(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: integer("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    aiPrompt: text("ai_prompt").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    deleteOnViolation: boolean("delete_on_violation").notNull().default(false),
    banOnViolation: boolean("ban_on_violation").notNull().default(false),
    warningsBeforeBan: integer("warnings_before_ban"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.botId, table.id] })]
);

export const botMembers = pgTable(
  "bot_members",
  {
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: botMemberRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.botId, table.userId] })]
);

export const botAccessCodes = pgTable(
  "bot_access_codes",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("bot_access_codes_code_unique").on(table.code)]
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    actionType: actionTypeEnum("action_type").notNull(),
    ruleViolated: uuid("rule_violated"),
    aiConfidence: real("ai_confidence").notNull(),
    aiReasoning: text("ai_reasoning").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    moderatorBotId: varchar("moderator_bot_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    index("moderation_actions_created_at").on(table.createdAt),
  ]
);

export const moderationDecisions = pgTable(
  "moderation_decisions",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    messageText: text("message_text").notNull(),
    violationDetected: boolean("violation_detected").notNull(),
    ruleViolated: uuid("rule_violated"),
    aiConfidence: real("ai_confidence").notNull(),
    aiReasoning: text("ai_reasoning").notNull(),
    rulesApplied: jsonb("rules_applied").$type<string[]>().notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("moderation_decisions_bot_ts").on(table.botId, table.timestamp),
    index("moderation_decisions_bot_chat_ts").on(
      table.botId,
      table.chatId,
      table.timestamp
    ),
    index("moderation_decisions_created_at").on(table.createdAt),
  ]
);

export const userContexts = pgTable(
  "user_contexts",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    username: varchar("username", { length: 255 }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    warningsCount: integer("warnings_count").notNull().default(0),
    isBanned: boolean("is_banned").notNull().default(false),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    bannedBy: uuid("banned_by"),
    lastActivity: timestamp("last_activity", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    text: text("text").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    isModerated: boolean("is_moderated").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedReason: text("deleted_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    index("user_messages_moderated_ts").on(
      table.botId,
      table.isModerated,
      table.timestamp
    ),
  ]
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    type: creditTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    chatId: bigint("chat_id", { mode: "number" }),
    reference: text("reference"),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_transactions_bot_created").on(table.botId, table.createdAt),
    uniqueIndex("credit_transactions_debit_idempotency")
      .on(table.botId, table.chatId, table.reference)
      .where(sql`type = 'debit_moderation'`),
  ]
);

export const llmUsage = pgTable(
  "llm_usage",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    messageId: bigint("message_id", { mode: "number" }).notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    estimatedCostRub: real("estimated_cost_rub").notNull().default(0),
    success: boolean("success").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("llm_usage_bot_created").on(table.botId, table.createdAt),
    index("llm_usage_bot_chat_message").on(
      table.botId,
      table.chatId,
      table.messageId
    ),
  ]
);

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    discountPercent: integer("discount_percent").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("promo_codes_code_unique").on(table.code)]
);

export const promoRedemptions = pgTable(
  "promo_redemptions",
  {
    id: serial("id").primaryKey(),
    promoCodeId: integer("promo_code_id")
      .notNull()
      .references(() => promoCodes.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    providerPaymentId: text("provider_payment_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("promo_redemptions_code_user_unique").on(
      table.promoCodeId,
      table.userId
    ),
  ]
);

export const providerPayments = pgTable(
  "provider_payments",
  {
    id: serial("id").primaryKey(),
    providerPaymentId: text("provider_payment_id").notNull(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    packageId: text("package_id").notNull(),
    amountRub: integer("amount_rub").notNull(),
    credits: integer("credits").notNull(),
    status: providerPaymentStatusEnum("status").notNull().default("pending"),
    purchaserUserId: text("purchaser_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    promoCodeId: integer("promo_code_id").references(() => promoCodes.id, {
      onDelete: "set null",
    }),
    referralCode: text("referral_code"),
    creditedAt: timestamp("credited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("provider_payments_provider_payment_id_unique").on(
      table.providerPaymentId
    ),
    index("provider_payments_bot_status_created").on(
      table.botId,
      table.status,
      table.createdAt
    ),
  ]
);

export const referrals = pgTable(
  "referrals",
  {
    id: serial("id").primaryKey(),
    referrerUserId: text("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    refereeUserId: text("referee_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    providerPaymentId: text("provider_payment_id").notNull(),
    baseCredits: integer("base_credits").notNull(),
    refereeBonusCredits: integer("referee_bonus_credits").notNull(),
    referrerBonusCredits: integer("referrer_bonus_credits").notNull(),
    refereeBotId: varchar("referee_bot_id", { length: 64 }).references(
      () => bots.id,
      { onDelete: "set null" }
    ),
    referrerStatus: referrerStatusEnum("referrer_status").notNull(),
    referrerClaimedBotId: varchar("referrer_claimed_bot_id", {
      length: 64,
    }).references(() => bots.id, { onDelete: "set null" }),
    referralCode: text("referral_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("referrals_referee_user_unique").on(table.refereeUserId),
    uniqueIndex("referrals_provider_payment_unique").on(table.providerPaymentId),
    index("referrals_referrer_status").on(
      table.referrerUserId,
      table.referrerStatus
    ),
  ]
);

export const chatStatistics = pgTable(
  "chat_statistics",
  {
    id: serial("id").primaryKey(),
    botId: varchar("bot_id", { length: 64 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    date: date("date").notNull(),
    messagesProcessed: integer("messages_processed").notNull().default(0),
    warningsIssued: integer("warnings_issued").notNull().default(0),
    messagesDeleted: integer("messages_deleted").notNull().default(0),
    usersBanned: integer("users_banned").notNull().default(0),
    uniqueUsers: integer("unique_users").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
