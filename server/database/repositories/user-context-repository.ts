import { and, eq, gte, desc, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  UserContext,
  CreateUserContextRequest,
  UpdateUserContextRequest,
} from "../models/user-context";
import { userContexts } from "../schema";
import { toUserContext } from "../mappers";

export class UserContextRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findByUser(
    botId: string,
    chatId: number,
    userId: number
  ): Promise<UserContext | null> {
    const [row] = await this.db
      .select()
      .from(userContexts)
      .where(
        and(
          eq(userContexts.botId, botId),
          eq(userContexts.chatId, chatId),
          eq(userContexts.userId, userId)
        )
      )
      .limit(1);

    return row ? toUserContext(row) : null;
  }

  async create(contextData: CreateUserContextRequest): Promise<UserContext> {
    const now = new Date();
    const [row] = await this.db
      .insert(userContexts)
      .values({
        botId: contextData.bot_id,
        chatId: contextData.chat_id,
        userId: contextData.user_id,
        username: contextData.username,
        firstName: contextData.first_name,
        lastName: contextData.last_name,
        warningsCount: 0,
        isBanned: false,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toUserContext(row);
  }

  async update(
    botId: string,
    chatId: number,
    userId: number,
    updateData: UpdateUserContextRequest
  ): Promise<UserContext | null> {
    const updateValues: Partial<typeof userContexts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updateData.warnings_count !== undefined) {
      updateValues.warningsCount = updateData.warnings_count;
    }
    if (updateData.is_banned !== undefined) {
      updateValues.isBanned = updateData.is_banned;
    }
    if (updateData.banned_at !== undefined) {
      updateValues.bannedAt = updateData.banned_at;
    }
    if (updateData.banned_by !== undefined) {
      updateValues.bannedBy = updateData.banned_by;
    }
    if (updateData.last_activity !== undefined) {
      updateValues.lastActivity = updateData.last_activity;
    }
    if (updateData.username !== undefined) {
      updateValues.username = updateData.username;
    }
    if (updateData.first_name !== undefined) {
      updateValues.firstName = updateData.first_name;
    }
    if (updateData.last_name !== undefined) {
      updateValues.lastName = updateData.last_name;
    }

    const [row] = await this.db
      .update(userContexts)
      .set(updateValues)
      .where(
        and(
          eq(userContexts.botId, botId),
          eq(userContexts.chatId, chatId),
          eq(userContexts.userId, userId)
        )
      )
      .returning();

    return row ? toUserContext(row) : null;
  }

  async incrementWarnings(
    botId: string,
    chatId: number,
    userId: number
  ): Promise<UserContext | null> {
    const now = new Date();
    const [row] = await this.db
      .update(userContexts)
      .set({
        warningsCount: sql`${userContexts.warningsCount} + 1`,
        lastActivity: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(userContexts.botId, botId),
          eq(userContexts.chatId, chatId),
          eq(userContexts.userId, userId)
        )
      )
      .returning();

    return row ? toUserContext(row) : null;
  }

  async banUser(
    botId: string,
    chatId: number,
    userId: number,
    ruleId: string
  ): Promise<UserContext | null> {
    const now = new Date();
    const [row] = await this.db
      .update(userContexts)
      .set({
        isBanned: true,
        bannedAt: now,
        bannedBy: ruleId,
        lastActivity: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(userContexts.botId, botId),
          eq(userContexts.chatId, chatId),
          eq(userContexts.userId, userId)
        )
      )
      .returning();

    return row ? toUserContext(row) : null;
  }

  async getOrCreate(
    botId: string,
    chatId: number,
    userId: number,
    userInfo?: { username?: string; first_name?: string; last_name?: string }
  ): Promise<UserContext> {
    let context = await this.findByUser(botId, chatId, userId);

    if (!context) {
      context = await this.create({
        bot_id: botId,
        chat_id: chatId,
        user_id: userId,
        ...userInfo,
      });
    } else if (userInfo) {
      context =
        (await this.update(botId, chatId, userId, {
          ...userInfo,
          last_activity: new Date(),
        })) || context;
    }

    return context;
  }

  async getBannedUsers(botId: string, chatId: number): Promise<UserContext[]> {
    const rows = await this.db
      .select()
      .from(userContexts)
      .where(
        and(
          eq(userContexts.botId, botId),
          eq(userContexts.chatId, chatId),
          eq(userContexts.isBanned, true)
        )
      );

    return rows.map(toUserContext);
  }

  async getActiveUsers(
    botId: string,
    chatId: number,
    hours: number = 24
  ): Promise<UserContext[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const rows = await this.db
      .select()
      .from(userContexts)
      .where(
        and(
          eq(userContexts.botId, botId),
          eq(userContexts.chatId, chatId),
          gte(userContexts.lastActivity, cutoffDate),
          eq(userContexts.isBanned, false)
        )
      );

    return rows.map(toUserContext);
  }

  async getAllUsersByBot(botId: string): Promise<UserContext[]> {
    const rows = await this.db
      .select()
      .from(userContexts)
      .where(eq(userContexts.botId, botId));

    return rows.map(toUserContext);
  }
}
