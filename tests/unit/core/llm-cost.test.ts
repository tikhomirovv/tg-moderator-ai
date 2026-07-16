import { describe, expect, test } from "bun:test";
import {
  PLANNING_LLM_COST_RUB,
  estimateLlmCostRub,
} from "../../../server/core/llm-cost";

describe("llm-cost", () => {
  test("returns zero for failed moderation", () => {
    expect(estimateLlmCostRub({ prompt_tokens: 1000, completion_tokens: 100 }, false)).toBe(0);
  });

  test("uses planning baseline when usage missing", () => {
    expect(estimateLlmCostRub(null, true)).toBe(PLANNING_LLM_COST_RUB);
  });

  test("estimates from token usage", () => {
    const cost = estimateLlmCostRub(
      { prompt_tokens: 2_500, completion_tokens: 150 },
      true
    );
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(PLANNING_LLM_COST_RUB);
  });
});
