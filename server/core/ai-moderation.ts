import type OpenAI from "openai";
import { AIModerationRequest, AIModerationResponse } from "../types/moderation";
import { Rule } from "../types/config";
import { logger } from "./logger";
import {
  createLlmClient,
  loadLlmConfig,
  resolveLlmLogHost,
  resolveLlmModel,
  type LlmConfig,
} from "./llm-provider";

type AnalyzeMessageOptions = {
  client?: OpenAI;
  model?: string;
  config?: LlmConfig;
};

export function buildModerationSystemPrompt(): string {
  return `You are a chat moderator. Analyze messages for violations using ONLY the rules provided in the user message.

Rules:
- Use only the listed rules. Do not invent additional rules or apply general moderation heuristics.
- If there are no rules, or the message does not violate any listed rule, set violation_detected to false.

Context and history:
- chat_history: this user's recent messages in the chat (oldest first; text + timestamp). Use it to interpret MESSAGE TO ANALYZE — not to retroactively flag older messages.
- From history, infer when relevant: speaker intent (good-faith question, attack, joke, commercial pitch), tone (sarcasm, irony, quoted/roleplay speech), references to earlier topics ("that", "yes", replies meaningless without prior lines), and multi-message patterns (spam bursts, rule evasion split across messages).
- A message innocent in isolation may still violate a rule when history shows intent (e.g. completing a prohibited link or insult across two messages). Conversely, do not flag friendly banter or on-topic discussion that only looks harsh without hostile intent in context.
- Short or ambiguous lines: prefer lower confidence unless history clearly supports a rule violation.
- user_warnings: repeated borderline behavior in history may justify stricter reading of the current message, but you must still match a listed rule — warnings alone are not a violation.
- Violation decision applies only to MESSAGE TO ANALYZE; history informs interpretation, not separate penalties.
- In reasoning: briefly state how history (or lack of it) affected intent/tone/confidence when it mattered.

Respond with JSON only, no extra text:
{
  "violation_detected": true/false,
  "rule_violated": "rule_id" (if violation exists),
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation including context"
}`;
}

export function buildModerationUserPrompt(
  request: AIModerationRequest,
  rules: Rule[]
): string {
  const rulesText = rules
    .map(
      (rule) =>
        `- [${rule.id}] ${rule.name}: ${rule.description}\n  Criteria: ${rule.ai_prompt}`
    )
    .join("\n");

  const historyJson = JSON.stringify(request.context.chat_history);

  return `USER CONTEXT:
- Previous warnings: ${request.context.user_warnings}
- Recent messages (oldest first): ${historyJson}

CHAT RULES (${rules.length}):
${rules.length > 0 ? rulesText : "No rules configured"}

MESSAGE TO ANALYZE:
"${request.message}"`;
}

export async function analyzeMessage(
  request: AIModerationRequest,
  rules: Rule[],
  options: AnalyzeMessageOptions = {}
): Promise<AIModerationResponse> {
  try {
    const config = options.config ?? loadLlmConfig();
    const model = options.model ?? resolveLlmModel(config);
    const client = options.client ?? createLlmClient(config);
    const systemPrompt = buildModerationSystemPrompt();
    const userPrompt = buildModerationUserPrompt(request, rules);

    logger.debug(
      {
        messageLength: request.message.length,
        rulesCount: rules.length,
        model,
        llm_host: resolveLlmLogHost(config.baseUrl),
      },
      "Sending moderation request to LLM"
    );

    logger.debug(
      {
        systemPrompt,
        userPrompt,
        rulesCount: rules.length,
        rules: rules.map((r) => ({ name: r.name })),
      },
      "Final LLM moderation prompt"
    );

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("Empty response from LLM");
    }

    const result = parseAIResponse(response);

    logger.info(
      {
        violation_detected: result.violation_detected,
        rule_violated: result.rule_violated,
        confidence: result.confidence,
        model,
        llm_host: resolveLlmLogHost(config.baseUrl),
      },
      "LLM moderation analysis completed"
    );

    logger.debug(
      { ai_response: response },
      "LLM moderation raw response"
    );

    return result;
  } catch (error) {
    logger.error({ error: error as Error }, "LLM moderation analysis failed");
    throw new Error("Failed to analyze message");
  }
}

function parseAIResponse(response: string): AIModerationResponse {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON not found in LLM response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      violation_detected: Boolean(parsed.violation_detected),
      rule_violated: parsed.rule_violated || undefined,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reasoning: parsed.reasoning || "No explanation",
    };
  } catch (error) {
    logger.error(
      { error: error as Error, response },
      "Failed to parse LLM response"
    );

    return {
      violation_detected: false,
      confidence: 0,
      reasoning: "Failed to parse LLM response",
    };
  }
}
