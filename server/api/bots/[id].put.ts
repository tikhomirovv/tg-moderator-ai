import { BotRepository } from "../../database/repositories/bot-repository";
import { UpdateBotRequest } from "../../database/models/bot";
import {
  BotLifecycleError,
  disableBot,
  enableBot,
} from "../../utils/bot-lifecycle";
import {
  getBotDeliveryHealthForWorkspace,
  withDeliveryHealth,
} from "../../utils/bot-delivery";

function buildBotResponse(
  bot: NonNullable<Awaited<ReturnType<BotRepository["findById"]>>>,
  health: Awaited<ReturnType<typeof getBotDeliveryHealthForWorkspace>>
) {
  return withDeliveryHealth(bot, health);
}

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const body = (await readBody(event)) as UpdateBotRequest;
    const workspaceId = getWorkspaceId(event);
    const botRepo = new BotRepository();

    if (body.is_active !== undefined) {
      const current = await botRepo.findById(botId!, workspaceId);
      if (!current) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bot not found",
        });
      }

      if (body.is_active !== current.is_active) {
        const lifecycle = body.is_active
          ? await enableBot(botId!, workspaceId)
          : await disableBot(botId!, workspaceId);

        const { is_active: _ignored, ...rest } = body;
        if (Object.keys(rest).length === 0) {
          const health = await getBotDeliveryHealthForWorkspace(
            botId!,
            workspaceId
          );
          return {
            success: true,
            data: buildBotResponse(lifecycle.bot, health),
            warning: lifecycle.warning,
            message: body.is_active
              ? "Bot enabled successfully"
              : "Bot disabled successfully",
          };
        }

        const bot = await botRepo.update(botId!, workspaceId, rest);
        const health = await getBotDeliveryHealthForWorkspace(
          botId!,
          workspaceId
        );
        return {
          success: true,
          data: bot ? buildBotResponse(bot, health) : lifecycle.bot,
          warning: lifecycle.warning,
          message: "Bot updated successfully",
        };
      }
    }

    const bot = await botRepo.update(botId!, workspaceId, body);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const health = await getBotDeliveryHealthForWorkspace(botId!, workspaceId);

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
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating bot",
    });
  }
});
