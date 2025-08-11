import { handleTelegramUpdate } from "../../../index";

export default defineEventHandler(async (event) => {
  try {
    // Получаем ID бота из параметров маршрута
    const botId = getRouterParam(event, "botId");

    if (!botId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID бота не указан",
      });
    }

    // Получаем тело запроса (обновление от Telegram)
    const update = await readBody(event);

    // Обрабатываем обновление
    await handleTelegramUpdate(botId, update);

    // Возвращаем успешный ответ
    return { ok: true };
  } catch (error) {
    console.error("Ошибка обработки вебхука:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка обработки вебхука",
    });
  }
});
