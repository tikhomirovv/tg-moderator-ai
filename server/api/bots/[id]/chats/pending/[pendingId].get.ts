import { buildPendingActivationView } from "../../../../../core/chat-activation-pending";
import { ChatActivationPendingRepository } from "../../../../../database/repositories/chat-activation-pending-repository";
import { requireBotAccess } from "../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  const { user } = await requireBotAccess(event, botId, ["owner"]);

  const pendingIdParam = getRouterParam(event, "pendingId");
  const pendingId = Number(pendingIdParam);
  if (!Number.isFinite(pendingId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "pendingId must be a number",
    });
  }

  const pendingRepo = new ChatActivationPendingRepository();
  const pending = await pendingRepo.findById(botId, pendingId);

  if (!pending) {
    throw createError({
      statusCode: 404,
      statusMessage: "Pending activation not found",
    });
  }

  if (pending.userId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: "Pending activation belongs to another user",
    });
  }

  const data = await buildPendingActivationView(pending, botId);

  return {
    success: true,
    data,
  };
});
