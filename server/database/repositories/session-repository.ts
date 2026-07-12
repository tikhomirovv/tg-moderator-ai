import { eq, and, gt } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { sessions } from "../auth-schema";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class SessionRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(params: {
    id: string;
    userId: string;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const [row] = await this.db
      .insert(sessions)
      .values({
        id: params.id,
        userId: params.userId,
        token: params.token,
        expiresAt,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row;
  }

  async findValidByToken(token: string) {
    const now = new Date();
    const [row] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);
    return row ?? null;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }
}
