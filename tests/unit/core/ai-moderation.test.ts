import { describe, expect, test } from "bun:test";
import type OpenAI from "openai";
import { analyzeMessage } from "../../../server/core/ai-moderation";

function createMockClient(responseContent: string): OpenAI {
  return {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: responseContent } }],
        }),
      },
    },
  } as unknown as OpenAI;
}

describe("analyzeMessage", () => {
  test("parses LLM JSON response", async () => {
    const client = createMockClient(
      JSON.stringify({
        violation_detected: true,
        rule_violated: "spam",
        confidence: 0.91,
        reasoning: "Promotional link",
      })
    );

    const result = await analyzeMessage(
      {
        message: "buy now",
        context: {
          user_warnings: 1,
          chat_history: ["hello"],
        },
      },
      [
        {
          id: "spam",
          name: "Spam",
          description: "No spam",
          ai_prompt: "detect spam",
          severity: "medium",
          is_active: true,
        },
      ],
      {
        client,
        model: "gpt-test",
        config: {
          apiKey: "test",
          model: "gpt-test",
          provider: "openai",
        },
      }
    );

    expect(result.violation_detected).toBe(true);
    expect(result.rule_violated).toBe("spam");
    expect(result.confidence).toBeCloseTo(0.91);
  });

  test("works with alternate provider config without throwing", async () => {
    const client = createMockClient(
      JSON.stringify({
        violation_detected: false,
        confidence: 0.2,
        reasoning: "Allowed",
      })
    );

    const result = await analyzeMessage(
      {
        message: "hello team",
        context: {
          user_warnings: 0,
          chat_history: [],
        },
      },
      [],
      {
        client,
        model: "openrouter/test-model",
        config: {
          apiKey: "test",
          baseUrl: "https://openrouter.ai/api/v1",
          model: "openrouter/test-model",
          provider: "openrouter",
        },
      }
    );

    expect(result.violation_detected).toBe(false);
  });
});
