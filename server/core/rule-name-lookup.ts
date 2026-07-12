import { RuleRepository } from "../database/repositories/rule-repository";

export type RuleNameLookup = Pick<RuleRepository, "findByIds">;

/** Resolve rule ids to display names for a workspace. */
export async function loadRuleNameMap(
  workspaceId: string,
  ruleIds: Array<string | null | undefined>,
  deps?: { ruleRepo?: RuleNameLookup }
): Promise<Map<string, string>> {
  const uniqueIds = [
    ...new Set(
      ruleIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const ruleRepo = deps?.ruleRepo ?? new RuleRepository();
  const rules = await ruleRepo.findByIds(uniqueIds, workspaceId);

  return new Map(rules.map((rule) => [rule.id, rule.name]));
}

export function resolveRuleName(
  ruleId: string | null | undefined,
  names: Map<string, string>
): string | null {
  if (!ruleId) {
    return null;
  }

  return names.get(ruleId) ?? null;
}

export function enrichWithRuleName<
  T extends { rule_violated?: string | null },
>(item: T, names: Map<string, string>): T & { rule_name: string | null } {
  return {
    ...item,
    rule_name: resolveRuleName(item.rule_violated, names),
  };
}
