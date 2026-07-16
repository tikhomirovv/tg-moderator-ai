/** Planning baseline from billing-economics.md — per successful moderation call. */
export const PLANNING_LLM_COST_RUB = 0.05;

export type TokenUsage = {
  prompt_tokens: number;
  completion_tokens: number;
};

/**
 * Estimate RUB cost from token usage.
 * Uses gpt-4.1-nano reference rates when tokens are available; otherwise planning baseline.
 */
export function estimateLlmCostRub(
  usage: TokenUsage | null | undefined,
  success: boolean
): number {
  if (!success) {
    return 0;
  }

  if (!usage) {
    return PLANNING_LLM_COST_RUB;
  }

  const inputCostUsd = (usage.prompt_tokens / 1_000_000) * 0.1;
  const outputCostUsd = (usage.completion_tokens / 1_000_000) * 0.4;
  const rubRate = 100;
  const estimated = (inputCostUsd + outputCostUsd) * rubRate;

  if (estimated <= 0) {
    return PLANNING_LLM_COST_RUB;
  }

  return Math.round(estimated * 1_000_000) / 1_000_000;
}
