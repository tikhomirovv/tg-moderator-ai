import OpenAI from "openai";

export const DEFAULT_LLM_HOST = "api.openai.com";

export type LlmConfig = {
  apiKey: string;
  baseUrl?: string;
  model: string;
};

export function resolveLlmLogHost(baseUrl?: string): string {
  if (!baseUrl) {
    return DEFAULT_LLM_HOST;
  }

  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "unknown";
  }
}

export function loadLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig {
  return {
    apiKey: env.LLM_API_KEY || "",
    baseUrl: env.LLM_BASE_URL?.trim() || undefined,
    model: env.LLM_MODEL || "gpt-4.1-nano-2025-04-14",
  };
}

export function createLlmClient(config: LlmConfig = loadLlmConfig()): OpenAI {
  if (!config.apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });
}

export function resolveLlmModel(config: LlmConfig = loadLlmConfig()): string {
  // Docker deploy sets LLM_MODEL at container start; Nuxt runtimeConfig is baked at image build.
  const envModel = config.model;
  if (process.env.LLM_MODEL?.trim()) {
    return envModel;
  }

  try {
    const runtimeConfig = useRuntimeConfig();
    if (runtimeConfig.llmModel) {
      return runtimeConfig.llmModel;
    }
  } catch {
    // Outside Nuxt runtime (e.g. bun test)
  }

  return envModel;
}
