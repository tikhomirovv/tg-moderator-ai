/** Whitelist entry shape used when filtering rules before LLM analysis. */
export interface RuleWhitelistEntry {
  telegram_user_id: number | null;
  username: string | null;
}

/** Strip leading @ and compare usernames case-insensitively. */
export function normalizeWhitelistUsername(
  username: string | undefined | null
): string | null {
  if (!username) {
    return null;
  }
  const trimmed = username.trim().replace(/^@+/, "");
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
}

export function isSenderWhitelisted(
  entries: RuleWhitelistEntry[],
  sender: { id: number; username?: string }
): boolean {
  if (entries.length === 0) {
    return false;
  }

  const senderUsername = normalizeWhitelistUsername(sender.username);

  return entries.some((entry) => {
    if (
      entry.telegram_user_id !== null &&
      entry.telegram_user_id === sender.id
    ) {
      return true;
    }

    const entryUsername = normalizeWhitelistUsername(entry.username);
    return (
      entryUsername !== null &&
      senderUsername !== null &&
      entryUsername === senderUsername
    );
  });
}

/** Exclude rules where the message sender matches a whitelist entry. */
export function filterRulesByWhitelist<T extends { id: string }>(
  rules: T[],
  whitelistByRuleId: Map<string, RuleWhitelistEntry[]>,
  sender: { id: number; username?: string }
): T[] {
  return rules.filter((rule) => {
    const entries = whitelistByRuleId.get(rule.id) ?? [];
    return !isSenderWhitelisted(entries, sender);
  });
}
