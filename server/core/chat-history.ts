export { USER_MESSAGES_PER_SCOPE as MAX_USER_MESSAGES_PER_SCOPE } from "./retention-policy";

export type ChatHistoryEntry = {
  text: string;
  /** ISO 8601 timestamp for LLM context. */
  timestamp: string;
};

type HistoryMessage = {
  message_id: number;
  text: string;
  timestamp: Date;
};

/** Build chronological LLM history (oldest first), excluding the current message. */
export function buildChatHistoryForPrompt(
  messages: HistoryMessage[],
  excludeMessageId?: number
): ChatHistoryEntry[] {
  const filtered = excludeMessageId
    ? messages.filter((message) => message.message_id !== excludeMessageId)
    : messages;

  return [...filtered]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-5)
    .map((message) => ({
      text: message.text,
      timestamp: message.timestamp.toISOString(),
    }));
}

/** IDs of oldest messages to delete when over retention limit. */
export function selectOldestMessageIdsToPrune(
  orderedIdsOldestFirst: number[],
  maxMessages: number
): number[] {
  if (orderedIdsOldestFirst.length <= maxMessages) {
    return [];
  }

  return orderedIdsOldestFirst.slice(
    0,
    orderedIdsOldestFirst.length - maxMessages
  );
}
