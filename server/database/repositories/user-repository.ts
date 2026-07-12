import { eq } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { users } from "../auth-schema";
import type { AppUser, SessionUser } from "../models/user";

function toAppUser(row: typeof users.$inferSelect): AppUser {
  return {
    id: row.id,
    telegram_id: row.telegramId,
    username: row.username,
    name: row.name,
    photo_url: row.photoUrl,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function toSessionUser(user: AppUser): SessionUser {
  return {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    name: user.name,
    photo_url: user.photo_url,
  };
}

export interface TelegramUserClaims {
  telegramId: number;
  username?: string | null;
  name: string;
  photoUrl?: string | null;
}

export class UserRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findById(id: string): Promise<AppUser | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? toAppUser(row) : null;
  }

  async findByTelegramId(telegramId: number): Promise<AppUser | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    return row ? toAppUser(row) : null;
  }

  async upsertFromTelegram(
    id: string,
    claims: TelegramUserClaims
  ): Promise<AppUser> {
    const now = new Date();
    const [row] = await this.db
      .insert(users)
      .values({
        id,
        telegramId: claims.telegramId,
        username: claims.username ?? null,
        name: claims.name,
        photoUrl: claims.photoUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          username: claims.username ?? null,
          name: claims.name,
          photoUrl: claims.photoUrl ?? null,
          updatedAt: now,
        },
      })
      .returning();

    return toAppUser(row);
  }
}
