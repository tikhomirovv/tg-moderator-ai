import { and, eq, inArray } from "drizzle-orm";
import { ChatRepository } from "../database/repositories/chat-repository";

export type ChatNameLookup = Pick<
  ChatRepository,
  "findNamesByTelegramChatIds"
>;

/** Resolve Telegram chat ids to display names per bot. */
export async function loadChatNameMap(
  entries: Array<{ botId: string; chatId: number }>,
  deps?: { chatRepo?: ChatNameLookup }
): Promise<Map<string, string>> {
  const byBot = new Map<string, Set<number>>();

  for (const entry of entries) {
    const ids = byBot.get(entry.botId) ?? new Set<number>();
    ids.add(entry.chatId);
    byBot.set(entry.botId, ids);
  }

  const names = new Map<string, string>();
  if (byBot.size === 0) {
    return names;
  }

  const chatRepo = deps?.chatRepo ?? new ChatRepository();
  for (const [botId, chatIds] of byBot) {
    const rows = await chatRepo.findNamesByTelegramChatIds(botId, [...chatIds]);
    for (const row of rows) {
      names.set(chatNameKey(botId, row.chatId), row.name);
    }
  }

  return names;
}

export function chatNameKey(botId: string, chatId: number): string {
  return `${botId}:${chatId}`;
}

export function resolveChatName(
  botId: string,
  chatId: number,
  names: Map<string, string>
): string | null {
  return names.get(chatNameKey(botId, chatId)) ?? null;
}
