import { requireSession } from "../../utils/session";
import { isSelfHostedMode } from "../../core/deployment-mode";
import { InstanceSettingsRepository } from "../../database/repositories/instance-settings-repository";

type UpdateBody = {
  api_key?: string | null;
  base_url?: string | null;
  model?: string | null;
};

export default defineEventHandler(async (event) => {
  if (!isSelfHostedMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Instance LLM settings are only available in self-hosted mode",
    });
  }

  await requireSession(event);
  const body = (await readBody(event)) as UpdateBody;
  const repo = new InstanceSettingsRepository();

  const updated = await repo.upsert({
    api_key: body.api_key,
    base_url: body.base_url,
    model: body.model,
  });

  return {
    success: true,
    data: {
      has_api_key: Boolean(updated.llm_api_key_encrypted),
      base_url: updated.llm_base_url ?? null,
      model: updated.llm_model ?? null,
      updated_at: updated.updated_at,
    },
    message: "LLM settings updated",
  };
});
