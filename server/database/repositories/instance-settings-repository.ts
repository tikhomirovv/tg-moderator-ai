import { eq } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { instanceSettings } from "../schema";
import type {
  InstanceSettings,
  UpdateInstanceSettingsRequest,
} from "../models/instance-settings";
import { encryptSecret } from "../../core/settings-encryption";

function toInstanceSettings(
  row: typeof instanceSettings.$inferSelect
): InstanceSettings {
  return {
    id: row.id,
    llm_api_key_encrypted: row.llmApiKeyEncrypted,
    llm_base_url: row.llmBaseUrl,
    llm_model: row.llmModel,
    updated_at: row.updatedAt,
  };
}

export class InstanceSettingsRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async get(): Promise<InstanceSettings | null> {
    const [row] = await this.db
      .select()
      .from(instanceSettings)
      .where(eq(instanceSettings.id, "default"))
      .limit(1);

    return row ? toInstanceSettings(row) : null;
  }

  async upsert(data: UpdateInstanceSettingsRequest): Promise<InstanceSettings> {
    const existing = await this.get();
    const now = new Date();

    const values: Partial<typeof instanceSettings.$inferInsert> = {
      id: "default",
      updatedAt: now,
    };

    if (data.base_url !== undefined) {
      values.llmBaseUrl = data.base_url?.trim() || null;
    }
    if (data.model !== undefined) {
      values.llmModel = data.model?.trim() || null;
    }
    if (data.api_key !== undefined) {
      values.llmApiKeyEncrypted =
        data.api_key && data.api_key.trim()
          ? encryptSecret(data.api_key.trim())
          : null;
    }

    if (!existing) {
      const [row] = await this.db
        .insert(instanceSettings)
        .values({
          id: "default",
          llmApiKeyEncrypted: values.llmApiKeyEncrypted ?? null,
          llmBaseUrl: values.llmBaseUrl ?? null,
          llmModel: values.llmModel ?? null,
          updatedAt: now,
        })
        .returning();
      return toInstanceSettings(row);
    }

    const [row] = await this.db
      .update(instanceSettings)
      .set(values)
      .where(eq(instanceSettings.id, "default"))
      .returning();

    return toInstanceSettings(row);
  }
}
