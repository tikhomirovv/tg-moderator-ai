import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { loginBotTokens } from "../auth-schema";

export class LoginBotTokenRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async countRecentByTelegramId(
    telegramId: number,
    since: Date
  ): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginBotTokens)
      .where(
        and(
          eq(loginBotTokens.telegramId, telegramId),
          gte(loginBotTokens.createdAt, since)
        )
      );

    return row?.count ?? 0;
  }

  async insert(row: {
    id: string;
    token: string;
    telegramId: number;
    username: string | null;
    name: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(loginBotTokens).values({
      id: row.id,
      token: row.token,
      telegramId: row.telegramId,
      username: row.username,
      name: row.name,
      expiresAt: row.expiresAt,
    });
  }

  async findByToken(token: string) {
    const [row] = await this.db
      .select({
        telegramId: loginBotTokens.telegramId,
        username: loginBotTokens.username,
        name: loginBotTokens.name,
        expiresAt: loginBotTokens.expiresAt,
        consumedAt: loginBotTokens.consumedAt,
      })
      .from(loginBotTokens)
      .where(eq(loginBotTokens.token, token))
      .limit(1);

    return row ?? null;
  }

  async markConsumed(token: string, consumedAt: Date): Promise<boolean> {
    const updated = await this.db
      .update(loginBotTokens)
      .set({ consumedAt })
      .where(
        and(
          eq(loginBotTokens.token, token),
          isNull(loginBotTokens.consumedAt)
        )
      )
      .returning({ token: loginBotTokens.token });

    return updated.length > 0;
  }
}
