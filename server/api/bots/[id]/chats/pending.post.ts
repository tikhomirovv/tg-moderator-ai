import {
  CHAT_ACTIVATION_PENDING_TTL_MS,
  ChatActivationPendingRepository,
} from "../../../../database/repositories/chat-activation-pending-repository";
import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  const { user } = await requireBotAccess(event, botId);

  const pendingRepo = new ChatActivationPendingRepository();
  const expiresAt = new Date(Date.now() + CHAT_ACTIVATION_PENDING_TTL_MS);
  const pending = await pendingRepo.create(botId, user.id, expiresAt);

  return {
    success: true,
    data: {
      pending_id: pending.id,
      expires_at: pending.expiresAt,
    },
  };
});
