import { CreditService } from "../../../../core/credit-service";
import { isSaasMode } from "../../../../core/deployment-mode";
import {
  syncBotOpenProviderPayments,
  syncBotPurchaseFromProvider,
} from "../../../../core/payment-sync";
import { ProviderPaymentRepository } from "../../../../database/repositories/provider-payment-repository";
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

  let syncStatus: Awaited<
    ReturnType<typeof syncBotPurchaseFromProvider>
  >["status"] | undefined;

  if (paymentId) {
    const sync = await syncBotPurchaseFromProvider(botId, paymentId);
    syncStatus = sync.status;
  } else {
    const open = await new ProviderPaymentRepository().findOpenByBotId(botId);
    if (open.length > 0) {
      const sync = await syncBotOpenProviderPayments(botId);
      syncStatus = sync.status;
    }
  }

  const creditService = new CreditService();
  const balance = await creditService.getBalance(botId);

  return {
    success: true,
    data: {
      ...(syncStatus !== undefined && { sync_status: syncStatus }),
      balance,
    },
  };
});
