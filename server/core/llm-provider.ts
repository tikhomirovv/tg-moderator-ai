import OpenAI from "openai";

export type LlmProviderName = "openai" | "openrouter" | "polza" | "custom";

export type LlmProviderConfig = {
  apiKey: string;
  baseUrl?: string;
  model: string;
  provider: LlmProviderName;
};

export function loadLlmConfig(
  env: NodeJS.ProcessEnv = process.env
): LlmProviderConfig {
  const provider = (env.LLM_PROVIDER || "openai") as LlmProviderName;

  return {
    apiKey: env.LLM_API_KEY || "",
    baseUrl: env.LLM_BASE_URL?.trim() || undefined,
    model: env.LLM_MODEL || "gpt-4.1-nano-2025-04-14",
    provider,
  };
}

export function createLlmClient(
  config: LlmProviderConfig = loadLlmConfig()
): OpenAI {
  if (!config.apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });
}

export function resolveLlmModel(
  config: LlmProviderConfig = loadLlmConfig()
): string {
  try {
    const runtimeConfig = useRuntimeConfig();
    if (runtimeConfig.llmModel) {
      return runtimeConfig.llmModel;
    }
  } catch {
    // Outside Nuxt runtime (e.g. bun test)
  }

  return config.model;
}
