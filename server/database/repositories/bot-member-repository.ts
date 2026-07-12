import { and, eq, inArray } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { botMembers, bots } from "../schema";
import { users } from "../auth-schema";

export type BotMemberRole = "owner" | "manager";

export interface BotMember {
  bot_id: string;
  user_id: string;
  role: BotMemberRole;
  created_at: Date;
  username?: string | null;
  name: string;
}

export class BotMemberRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async addMember(
    botId: string,
    userId: string,
    role: BotMemberRole
  ): Promise<void> {
    await this.db
      .insert(botMembers)
      .values({
        botId,
        userId,
        role,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async getMemberRole(
    botId: string,
    userId: string
  ): Promise<BotMemberRole | null> {
    const [row] = await this.db
      .select({ role: botMembers.role })
      .from(botMembers)
      .where(and(eq(botMembers.botId, botId), eq(botMembers.userId, userId)))
      .limit(1);
    return (row?.role as BotMemberRole) ?? null;
  }

  async listMembers(botId: string): Promise<BotMember[]> {
    const rows = await this.db
      .select({
        botId: botMembers.botId,
        userId: botMembers.userId,
        role: botMembers.role,
        createdAt: botMembers.createdAt,
        username: users.username,
        name: users.name,
      })
      .from(botMembers)
      .innerJoin(users, eq(botMembers.userId, users.id))
      .where(eq(botMembers.botId, botId));

    return rows.map((row) => ({
      bot_id: row.botId,
      user_id: row.userId,
      role: row.role as BotMemberRole,
      created_at: row.createdAt,
      username: row.username,
      name: row.name,
    }));
  }

  async removeMember(botId: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(botMembers)
      .where(and(eq(botMembers.botId, botId), eq(botMembers.userId, userId)))
      .returning({ userId: botMembers.userId });
    return deleted.length > 0;
  }

  async getAccessibleBotIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ botId: botMembers.botId })
      .from(botMembers)
      .where(eq(botMembers.userId, userId));
    return rows.map((row) => row.botId);
  }

  async findBotsForUser(userId: string) {
    const botIds = await this.getAccessibleBotIds(userId);
    if (botIds.length === 0) {
      return [];
    }
    return this.db
      .select()
      .from(bots)
      .where(inArray(bots.id, botIds));
  }
}
