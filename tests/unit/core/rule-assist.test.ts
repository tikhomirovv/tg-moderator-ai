import { describe, expect, test } from "bun:test";
import {
  buildRuleAssistUserPrompt,
  isRuleAssistDraftMode,
  parseRuleAssistResponse,
  validateRuleAssistInput,
} from "../../../server/core/rule-assist";

describe("rule-assist", () => {
  test("validateRuleAssistInput requires instruction", () => {
    expect(
      validateRuleAssistInput({
        description: "x",
        ai_prompt: "y",
        instruction: "  ",
      })
    ).toBe("instruction is required");
    expect(
      validateRuleAssistInput({
        description: "",
        ai_prompt: "",
        instruction: "add exception",
      })
    ).toBeNull();
  });

  test("buildRuleAssistUserPrompt includes current fields and request", () => {
    const prompt = buildRuleAssistUserPrompt({
      name: "Ads",
      description: "No ads",
      ai_prompt: "Ban ads",
      instruction: "allow personal tips",
    });
    expect(prompt).toContain("Rule name (context): Ads");
    expect(prompt).toContain("Mode: revise");
    expect(prompt).toContain("No ads");
    expect(prompt).toContain("Ban ads");
    expect(prompt).toContain("allow personal tips");
  });

  test("buildRuleAssistUserPrompt uses create mode when fields are empty", () => {
    expect(
      isRuleAssistDraftMode({ description: "  ", ai_prompt: "" })
    ).toBe(true);
    const prompt = buildRuleAssistUserPrompt({
      description: "",
      ai_prompt: "",
      instruction: "Ban politics",
    });
    expect(prompt).toContain("Mode: create new rule");
    expect(prompt).toContain("(empty)");
  });

  test("parseRuleAssistResponse extracts name, description and ai_prompt", () => {
    const result = parseRuleAssistResponse(
      `Here you go:\n{"name":"Ads","description":"Short","ai_prompt":"Long rule text"}`
    );
    expect(result).toEqual({
      name: "Ads",
      description: "Short",
      ai_prompt: "Long rule text",
    });
  });

  test("parseRuleAssistResponse rejects missing fields", () => {
    expect(() =>
      parseRuleAssistResponse('{"description":"only desc","ai_prompt":"x"}')
    ).toThrow(/missing name, description, or ai_prompt/);
  });
});
