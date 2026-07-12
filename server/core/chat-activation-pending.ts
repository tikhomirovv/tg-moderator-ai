import type { Chat } from "../database/models/bot";
import type { ChatActivationPendingRow } from "../database/repositories/chat-activation-pending-repository";
import { ChatRepository } from "../database/repositories/chat-repository";
import { toChat } from "../database/mappers";

export type PendingActivationStatus =
  | "waiting"
  | "completed"
  | "failed"
  | "expired";

export type PendingActivationView = {
  status: PendingActivationStatus;
  pending_id: number;
  expires_at: Date;
  chat?: Chat;
  error?: {
    code: string;
    message: string;
  };
};

export function resolvePendingActivationStatus(
  pending: ChatActivationPendingRow,
  now = new Date()
): PendingActivationStatus {
  if (pending.completedAt && pending.resultChatId) {
    return "completed";
  }

  if (pending.failedCode) {
    return "failed";
  }

  if (pending.expiresAt <= now) {
    return "expired";
  }

  return "waiting";
}

export async function buildPendingActivationView(
  pending: ChatActivationPendingRow,
  botId: string,
  now = new Date()
): Promise<PendingActivationView> {
  const status = resolvePendingActivationStatus(pending, now);
  const view: PendingActivationView = {
    status,
    pending_id: pending.id,
    expires_at: pending.expiresAt,
  };

  if (status === "completed" && pending.resultChatId) {
    const chatRepo = new ChatRepository();
    const chatRow = await chatRepo.findByRowId(botId, pending.resultChatId);
    if (chatRow) {
      view.chat = toChat(chatRow, 0);
    }
  }

  if (status === "failed" && pending.failedCode) {
    view.error = {
      code: pending.failedCode,
      message: pending.failedMessage ?? "Chat activation failed",
    };
  }

  return view;
}
