import { describe, expect, test } from "bun:test";
import type OpenAI from "openai";
import {
  analyzeMessage,
  buildModerationSystemPrompt,
  buildModerationUserPrompt,
} from "../../../server/core/ai-moderation";

function createCapturingClient(
  responseContent: string,
  onCreate?: (messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) => void
): OpenAI {
  return {
    chat: {
      completions: {
        create: async (params) => {
          onCreate?.(params.messages);
          return {
            choices: [{ message: { content: responseContent } }],
          };
        },
      },
    },
  } as unknown as OpenAI;
}

describe("buildModerationSystemPrompt", () => {
  test("contains moderator role and JSON format without rule-specific content", () => {
    const prompt = buildModerationSystemPrompt();

    expect(prompt).toContain("chat moderator");
    expect(prompt).toContain("violation_detected");
    expect(prompt).not.toContain("MESSAGE TO ANALYZE");
    expect(prompt).not.toContain("CHAT RULES");
  });
});

describe("buildModerationUserPrompt", () => {
  test("includes rules and message without duplicated system instructions", () => {
    const prompt = buildModerationUserPrompt(
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
          ai_prompt: "commercial links without permission",
        },
      ]
    );

    expect(prompt).toContain("MESSAGE TO ANALYZE");
    expect(prompt).toContain("[spam]");
    expect(prompt).toContain("commercial links without permission");
    expect(prompt).toContain("Previous warnings: 1");
    expect(prompt).not.toContain("JSON response only");
    expect(prompt).not.toContain("You are a chat moderator");
  });
});

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
        },
      ],
      {
        client,
        model: "gpt-test",
        config: {
          apiKey: "test",
          model: "gpt-test",
        },
      }
    );

    expect(result.violation_detected).toBe(true);
    expect(result.rule_violated).toBe("spam");
    expect(result.confidence).toBeCloseTo(0.91);
  });

  test("sends system and user prompts without duplicated methodology", async () => {
    let capturedMessages:
      | OpenAI.Chat.Completions.ChatCompletionMessageParam[]
      | undefined;

    const client = createCapturingClient(
      JSON.stringify({
        violation_detected: false,
        confidence: 0.1,
        reasoning: "Allowed",
      }),
      (messages) => {
        capturedMessages = messages;
      }
    );

    await analyzeMessage(
      {
        message: "hello",
        context: { user_warnings: 0, chat_history: [] },
      },
      [
        {
          id: "spam",
          name: "Spam",
          description: "No spam",
          ai_prompt: "commercial ads",
        },
      ],
      {
        client,
        model: "gpt-test",
        config: {
          apiKey: "test",
          model: "gpt-test",
        },
      }
    );

    const system = String(capturedMessages?.[0]?.content ?? "");
    const user = String(capturedMessages?.[1]?.content ?? "");

    expect(system).toContain("chat moderator");
    expect(user).toContain("MESSAGE TO ANALYZE");
    expect(user).not.toContain("JSON response only");
    expect(system).not.toContain("MESSAGE TO ANALYZE");
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
        },
      }
    );

    expect(result.violation_detected).toBe(false);
  });
});

function createMockClient(responseContent: string): OpenAI {
  return createCapturingClient(responseContent);
}
