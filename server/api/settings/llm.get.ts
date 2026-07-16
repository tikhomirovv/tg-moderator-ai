import { requireSession } from "../../utils/session";
import { isSelfHostedMode } from "../../core/deployment-mode";
import { InstanceSettingsRepository } from "../../database/repositories/instance-settings-repository";

export default defineEventHandler(async (event) => {
  if (!isSelfHostedMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Instance LLM settings are only available in self-hosted mode",
    });
  }

  await requireSession(event);
  const repo = new InstanceSettingsRepository();
  const settings = await repo.get();

  return {
    success: true,
    data: {
      has_api_key: Boolean(settings?.llm_api_key_encrypted),
      base_url: settings?.llm_base_url ?? null,
      model: settings?.llm_model ?? null,
      updated_at: settings?.updated_at ?? null,
    },
  };
});
