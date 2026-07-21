import type OpenAI from "openai";
import { logger } from "./logger";
import {
  createLlmClient,
  resolveLlmLogHost,
  resolveLlmModel,
  type LlmConfig,
} from "./llm-provider";
import { loadResolvedLlmConfig } from "./instance-llm-settings";
import type { TokenUsage } from "./llm-cost";

export type RuleAssistInput = {
  name?: string;
  description: string;
  ai_prompt: string;
  instruction: string;
};

export type RuleAssistResult = {
  description: string;
  ai_prompt: string;
};

export type RewriteRuleTextOptions = {
  client?: OpenAI;
  model?: string;
  config?: LlmConfig;
};

export function isRuleAssistDraftMode(
  input: Pick<RuleAssistInput, "description" | "ai_prompt">
): boolean {
  return !input.description.trim() && !input.ai_prompt.trim();
}

export function buildRuleAssistSystemPrompt(): string {
  return `You help chat moderators write and refine moderation rules for an AI moderator.

The operator provides:
- optional rule name (context only)
- current short description and current rule text (criteria the AI uses when checking messages) — either or both may be empty
- a request in plain language

When description and rule text are empty:
- Treat the request as a specification for a new rule. Draft both fields from scratch in the requested language (Russian or English).

When any current text exists:
- Apply the requested changes while preserving the rule's intent unless the operator explicitly asks to change it.
- Keep the same language as the existing rule text.

Always:
- Write clear plain-language criteria: what counts as a violation and what is allowed (use "Violation:" / "Not a violation:" or "Нарушение:" / "Не нарушение:" sections when helpful, matching existing product templates).
- Provide a short one-line description for humans and a fuller rule text for the moderation AI.
- Start rule text with a clear framing line when appropriate (e.g. "Treat … as a violation" / "Считать нарушением …").

Respond with JSON only, no markdown fences or extra text:
{
  "description": "short one-line summary",
  "ai_prompt": "full rule text for the moderation AI"
}`;
}

export function buildRuleAssistUserPrompt(input: RuleAssistInput): string {
  const nameBlock = input.name?.trim()
    ? `Rule name (context): ${input.name.trim()}\n`
    : "";

  const mode = isRuleAssistDraftMode(input)
    ? "Mode: create new rule from the operator request."
    : "Mode: revise the existing rule per the operator request.";

  return `${nameBlock}${mode}

Current description:
${input.description.trim() || "(empty)"}

Current rule text:
${input.ai_prompt.trim() || "(empty)"}

Operator request:
${input.instruction.trim()}`;
}

export function parseRuleAssistResponse(raw: string): RuleAssistResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("JSON not found in LLM response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    description?: unknown;
    ai_prompt?: unknown;
  };

  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : "";
  const ai_prompt =
    typeof parsed.ai_prompt === "string" ? parsed.ai_prompt.trim() : "";

  if (!description || !ai_prompt) {
    throw new Error("LLM response missing description or ai_prompt");
  }

  return { description, ai_prompt };
}

export function validateRuleAssistInput(
  input: RuleAssistInput
): string | null {
  if (!input.instruction?.trim()) {
    return "instruction is required";
  }
  return null;
}

export async function rewriteRuleText(
  input: RuleAssistInput,
  options: RewriteRuleTextOptions = {}
): Promise<{
  result: RuleAssistResult;
  model: string;
  usage: TokenUsage | null;
}> {
  const validationError = validateRuleAssistInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const config = options.config ?? (await loadResolvedLlmConfig());
  const model = options.model ?? resolveLlmModel(config);
  const client = options.client ?? createLlmClient(config);
  const systemPrompt = buildRuleAssistSystemPrompt();
  const userPrompt = buildRuleAssistUserPrompt(input);

  logger.debug(
    { systemPrompt, userPrompt },
    "Rule assist LLM prompt"
  );

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from LLM");
  }

  logger.debug({ ai_response: content }, "Rule assist LLM raw response");

  const result = parseRuleAssistResponse(content);
  const usage: TokenUsage | null = completion.usage
    ? {
        prompt_tokens: completion.usage.prompt_tokens ?? 0,
        completion_tokens: completion.usage.completion_tokens ?? 0,
      }
    : null;

  logger.info(
    {
      model,
      llm_host: resolveLlmLogHost(config.baseUrl),
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
    },
    "Rule assist rewrite completed"
  );

  return { result, model, usage };
}
