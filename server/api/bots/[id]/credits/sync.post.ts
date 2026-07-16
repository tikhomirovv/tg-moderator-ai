import { CreditService } from "../../../../core/credit-service";
import { isSaasMode } from "../../../../core/deployment-mode";
import { syncBotPurchaseFromProvider } from "../../../../core/payment-sync";
import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";

type SyncBody = {
  payment_id?: string;
};

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Credits sync is only available in SaaS mode",
    });
  }

  const botId = requireBotIdParam(event);
  await requireBotAccess(event, botId);

  const body = (await readBody(event)) as SyncBody;
  const paymentId = body?.payment_id?.trim();
  if (!paymentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "payment_id is required",
    });
  }

  const sync = await syncBotPurchaseFromProvider(botId, paymentId);
  const creditService = new CreditService();
  const balance = await creditService.getBalance(botId);

  return {
    success: true,
    data: {
      sync_status: sync.status,
      balance,
    },
  };
});
