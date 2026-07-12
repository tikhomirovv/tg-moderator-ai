import { and, desc, eq, isNull } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { chatActivationPending } from "../schema";

export type ChatActivationPendingRow =
  typeof chatActivationPending.$inferSelect;

export const CHAT_ACTIVATION_PENDING_TTL_MS = 5 * 60 * 1000;

export class ChatActivationPendingRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(
    botId: string,
    userId: string,
    expiresAt: Date
  ): Promise<ChatActivationPendingRow> {
    const [row] = await this.db
      .insert(chatActivationPending)
      .values({
        botId,
        userId,
        expiresAt,
      })
      .returning();

    return row;
  }

  async findById(
    botId: string,
    pendingId: number
  ): Promise<ChatActivationPendingRow | null> {
    const [row] = await this.db
      .select()
      .from(chatActivationPending)
      .where(
        and(
          eq(chatActivationPending.id, pendingId),
          eq(chatActivationPending.botId, botId)
        )
      )
      .limit(1);

    return row ?? null;
  }

  async findLatestWaitingForUser(
    botId: string,
    userId: string
  ): Promise<ChatActivationPendingRow | null> {
    const now = new Date();
    const rows = await this.db
      .select()
      .from(chatActivationPending)
      .where(
        and(
          eq(chatActivationPending.botId, botId),
          eq(chatActivationPending.userId, userId),
          isNull(chatActivationPending.completedAt),
          isNull(chatActivationPending.failedCode)
        )
      )
      .orderBy(desc(chatActivationPending.createdAt))
      .limit(5);

    return rows.find((row) => row.expiresAt > now) ?? null;
  }

  async complete(pendingId: number, chatRowId: number): Promise<void> {
    await this.db
      .update(chatActivationPending)
      .set({
        resultChatId: chatRowId,
        completedAt: new Date(),
      })
      .where(eq(chatActivationPending.id, pendingId));
  }

  async fail(
    pendingId: number,
    code: string,
    message: string
  ): Promise<void> {
    await this.db
      .update(chatActivationPending)
      .set({
        failedCode: code,
        failedMessage: message,
      })
      .where(eq(chatActivationPending.id, pendingId));
  }
}
