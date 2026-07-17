import type { LlmConfig } from "./llm-provider";
import { decryptSecret } from "./settings-encryption";
import { isSelfHostedMode } from "./deployment-mode";
import { InstanceSettingsRepository } from "../database/repositories/instance-settings-repository";

const DEFAULT_MODEL = "gpt-4.1-nano-2025-04-14";

export type ResolvedLlmConfigSource = "env" | "database" | "none";

export type ResolvedLlmConfig = {
  config: LlmConfig | null;
  source: ResolvedLlmConfigSource;
};

type DatabaseLlmSettings = {
  llm_base_url?: string | null;
  llm_model?: string | null;
};

/** Apply LLM_MODEL / LLM_BASE_URL env overrides on database instance settings. */
export function applyDatabaseLlmEnvOverrides(
  settings: DatabaseLlmSettings,
  env: NodeJS.ProcessEnv = process.env
): Pick<LlmConfig, "baseUrl" | "model"> {
  return {
    baseUrl:
      env.LLM_BASE_URL?.trim() || settings.llm_base_url?.trim() || undefined,
    model:
      env.LLM_MODEL?.trim() || settings.llm_model?.trim() || DEFAULT_MODEL,
  };
}

/** Env LLM_* overrides DB settings; DB used in self-hosted when env key is absent. */
export async function resolveLlmConfig(
  env: NodeJS.ProcessEnv = process.env
): Promise<ResolvedLlmConfig> {
  const envApiKey = env.LLM_API_KEY?.trim();
  const envBaseUrl = env.LLM_BASE_URL?.trim() || undefined;
  const envModel = env.LLM_MODEL?.trim() || DEFAULT_MODEL;

  if (envApiKey) {
    return {
      config: {
        apiKey: envApiKey,
        baseUrl: envBaseUrl,
        model: envModel,
      },
      source: "env",
    };
  }

  if (!isSelfHostedMode(env)) {
    return { config: null, source: "none" };
  }

  const repo = new InstanceSettingsRepository();
  const settings = await repo.get();
  if (!settings?.llm_api_key_encrypted) {
    return { config: null, source: "none" };
  }

  const apiKey = decryptSecret(settings.llm_api_key_encrypted, env);
  if (!apiKey) {
    return { config: null, source: "none" };
  }

  return {
    config: {
      apiKey,
      ...applyDatabaseLlmEnvOverrides(settings, env),
    },
    source: "database",
  };
}

export async function loadResolvedLlmConfig(
  env: NodeJS.ProcessEnv = process.env
): Promise<LlmConfig> {
  const resolved = await resolveLlmConfig(env);
  if (!resolved.config?.apiKey) {
    throw new Error("LLM API key is not configured");
  }
  return resolved.config;
}
