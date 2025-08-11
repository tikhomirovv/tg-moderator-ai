import { getActiveBots, getBotInfo } from "../../index";

export default defineEventHandler(async (event) => {
  try {
    const activeBots = getActiveBots();

    const botsInfo = activeBots.map((botId) => {
      const info = getBotInfo(botId);
      return {
        id: botId,
        isRunning: info?.isRunning || false,
      };
    });

    return {
      success: true,
      data: {
        bots: botsInfo,
        total: botsInfo.length,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка получения списка ботов",
    });
  }
});
