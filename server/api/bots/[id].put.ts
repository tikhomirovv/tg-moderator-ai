import { BotRepository } from "../../database/repositories/bot-repository";
import { UpdateBotRequest } from "../../database/models/bot";
import {
  BotLifecycleError,
  disableBot,
  enableBot,
} from "../../utils/bot-lifecycle";
import { getBotDeliveryHealth, withDeliveryHealth } from "../../utils/bot-delivery";
import { requireBotAccess } from "../../utils/bot-access";
import { requireBotIdParam } from "../../utils/get-bot-id-param";
import { validateBotMessageTemplate } from "../../utils/bot-message-template-validation";

function buildBotResponse(
  bot: NonNullable<Awaited<ReturnType<BotRepository["findById"]>>>,
  health: Awaited<ReturnType<typeof getBotDeliveryHealth>>
) {
  return withDeliveryHealth(bot, health);
}

export default defineEventHandler(async (event) => {
  try {
    const botId = requireBotIdParam(event);
    await requireBotAccess(event, botId);
    const body = (await readBody(event)) as UpdateBotRequest;
    const botRepo = new BotRepository();

    let warningTemplate: string | null | undefined;
    let banTemplate: string | null | undefined;
    try {
      warningTemplate = validateBotMessageTemplate(
        body.warning_message_template,
        "warning_message_template"
      );
      banTemplate = validateBotMessageTemplate(
        body.ban_message_template,
        "ban_message_template"
      );
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage:
          error instanceof Error ? error.message : "Invalid message template",
      });
    }

    const normalizedBody: UpdateBotRequest = {
      ...body,
      ...(warningTemplate !== undefined
        ? { warning_message_template: warningTemplate }
        : {}),
      ...(banTemplate !== undefined ? { ban_message_template: banTemplate } : {}),
    };

    if (normalizedBody.is_active !== undefined) {
      const current = await botRepo.findById(botId);
      if (!current) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bot not found",
        });
      }

      if (normalizedBody.is_active !== current.is_active) {
        const lifecycle = normalizedBody.is_active
          ? await enableBot(botId)
          : await disableBot(botId);

        const { is_active: _ignored, ...rest } = normalizedBody;
        if (Object.keys(rest).length === 0) {
          const health = await getBotDeliveryHealth(event, botId);
          return {
            success: true,
            data: buildBotResponse(lifecycle.bot, health),
            warning: lifecycle.warning,
            message: normalizedBody.is_active
              ? "Bot enabled successfully"
              : "Bot disabled successfully",
          };
        }

        const bot = await botRepo.update(botId, rest);
        const health = await getBotDeliveryHealth(event, botId);
        return {
          success: true,
          data: bot ? buildBotResponse(bot, health) : lifecycle.bot,
          warning: lifecycle.warning,
          message: "Bot updated successfully",
        };
      }
    }

    const bot = await botRepo.update(botId, normalizedBody);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const health = await getBotDeliveryHealth(event, botId);

    return {
      success: true,
      data: buildBotResponse(bot, health),
      message: "Bot updated successfully",
    };
  } catch (error) {
    if (error instanceof BotLifecycleError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
      });
    }
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating bot",
    });
  }
});
