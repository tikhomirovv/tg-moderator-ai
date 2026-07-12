import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { botAccessCodes } from "../schema";

function generateAccessCode(): string {
  return randomBytes(6).toString("hex");
}

export class BotAccessCodeRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async getActiveCode(botId: string) {
    const [row] = await this.db
      .select()
      .from(botAccessCodes)
      .where(
        and(eq(botAccessCodes.botId, botId), isNull(botAccessCodes.revokedAt))
      )
      .limit(1);
    return row ?? null;
  }

  async getOrCreateActiveCode(botId: string) {
    const existing = await this.getActiveCode(botId);
    if (existing) {
      return existing;
    }
    const [row] = await this.db
      .insert(botAccessCodes)
      .values({
        botId,
        code: generateAccessCode(),
        createdAt: new Date(),
      })
      .returning();
    return row;
  }

  async revokeActiveCode(botId: string): Promise<void> {
    await this.db
      .update(botAccessCodes)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(botAccessCodes.botId, botId), isNull(botAccessCodes.revokedAt))
      );
  }

  async findActiveByCode(code: string) {
    const [row] = await this.db
      .select()
      .from(botAccessCodes)
      .where(
        and(eq(botAccessCodes.code, code), isNull(botAccessCodes.revokedAt))
      )
      .limit(1);
    return row ?? null;
  }
}
