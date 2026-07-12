import { describe, expect, test } from "bun:test";
import {
  createLlmClient,
  DEFAULT_LLM_HOST,
  loadLlmConfig,
  resolveLlmLogHost,
  resolveLlmModel,
} from "../../../server/core/llm-provider";

describe("llm-provider", () => {
  test("loadLlmConfig reads LLM_* env vars", () => {
    const config = loadLlmConfig({
      LLM_API_KEY: "test-key",
      LLM_BASE_URL: "https://openrouter.ai/api/v1",
      LLM_MODEL: "gpt-4o-mini",
    });

    expect(config).toEqual({
      apiKey: "test-key",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "gpt-4o-mini",
    });
  });

  test("resolveLlmLogHost returns OpenAI default when base URL is missing", () => {
    expect(resolveLlmLogHost()).toBe(DEFAULT_LLM_HOST);
    expect(resolveLlmLogHost("")).toBe(DEFAULT_LLM_HOST);
  });

  test("resolveLlmLogHost extracts hostname from base URL", () => {
    expect(resolveLlmLogHost("https://openrouter.ai/api/v1")).toBe(
      "openrouter.ai"
    );
  });

  test("createLlmClient requires API key", () => {
    expect(() =>
      createLlmClient({
        apiKey: "",
        model: "gpt-4o-mini",
      })
    ).toThrow("LLM_API_KEY is not configured");
  });

  test("resolveLlmModel prefers LLM_MODEL env over baked default", () => {
    const previous = process.env.LLM_MODEL;
    process.env.LLM_MODEL = "openai/gpt-5.4-nano";

    try {
      expect(resolveLlmModel()).toBe("openai/gpt-5.4-nano");
    } finally {
      if (previous === undefined) {
        delete process.env.LLM_MODEL;
      } else {
        process.env.LLM_MODEL = previous;
      }
    }
  });

  test("createLlmClient accepts custom base URL", () => {
    const client = createLlmClient({
      apiKey: "test-key",
      baseUrl: "https://polza.ai/api/v1",
      model: "gpt-4o-mini",
    });

    expect(client).toBeDefined();
    expect((client as unknown as { baseURL?: string }).baseURL).toBe(
      "https://polza.ai/api/v1"
    );
  });
});
