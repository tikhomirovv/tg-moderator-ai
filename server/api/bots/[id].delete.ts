import { deleteBotPermanently, DeleteBotError } from "../../core/delete-bot";
import { requireBotAccess } from "../../utils/bot-access";
import { requireBotIdParam } from "../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  try {
    await requireBotAccess(event, botId);
    await deleteBotPermanently(botId);

    return {
      success: true,
      message: "Bot deleted successfully",
    };
  } catch (error) {
    if (error instanceof DeleteBotError) {
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
      statusMessage: "Error deleting bot",
    });
  }
});
