import { logger } from "./logger";

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

/** Normalize a raw whitelist entry for storage: digits → user id, else lowercase username. */
export function normalizeWhitelistEntry(raw: string): string | null {
  const trimmed = raw.trim().replace(/^@+/, "");
  if (trimmed.length === 0) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed.toLowerCase();
}

export type WhitelistEntryType = "user_id" | "username";

/** Classify a stored whitelist entry as user id or username. */
export function parseWhitelistEntry(entry: string): WhitelistEntryType {
  return /^\d+$/.test(entry) ? "user_id" : "username";
}

export function matchesWhitelistEntry(
  entry: string,
  sender: { id: number; username?: string }
): boolean {
  if (parseWhitelistEntry(entry) === "user_id") {
    return sender.id === Number(entry);
  }

  const senderUsername = normalizeWhitelistUsername(sender.username);
  return senderUsername !== null && senderUsername === entry;
}

export function findMatchingWhitelistEntry(
  entries: string[],
  sender: { id: number; username?: string }
): string | null {
  for (const entry of entries) {
    if (matchesWhitelistEntry(entry, sender)) {
      return entry;
    }
  }
  return null;
}

export function isSenderWhitelisted(
  entries: string[],
  sender: { id: number; username?: string }
): boolean {
  if (entries.length === 0) {
    return false;
  }
  return findMatchingWhitelistEntry(entries, sender) !== null;
}

export interface WhitelistFilterLogContext {
  botId: string;
  chatId: number;
}

/** Exclude rules where the message sender matches a whitelist entry. */
export function filterRulesByWhitelist<T extends { id: string; name?: string }>(
  rules: T[],
  whitelistByRuleId: Map<string, string[]>,
  sender: { id: number; username?: string },
  logContext?: WhitelistFilterLogContext
): T[] {
  return rules.filter((rule) => {
    const entries = whitelistByRuleId.get(rule.id) ?? [];
    const matchedEntry = findMatchingWhitelistEntry(entries, sender);

    if (matchedEntry !== null) {
      logger.info(
        {
          botId: logContext?.botId,
          chatId: logContext?.chatId,
          ruleId: rule.id,
          ruleName: rule.name,
          userId: sender.id,
          username: sender.username,
          whitelistEntry: matchedEntry,
        },
        "Rule skipped for whitelisted user"
      );
      return false;
    }

    return true;
  });
}
