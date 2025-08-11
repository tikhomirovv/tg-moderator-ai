import { initializeBots } from "../index";

export default defineEventHandler(async (event) => {
  try {
    console.log("Инициализация Telegram ботов...");
    await initializeBots();
    console.log("Telegram боты успешно инициализированы");

    return {
      success: true,
      message: "Боты успешно инициализированы",
    };
  } catch (error) {
    console.error("Ошибка инициализации ботов:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка инициализации ботов",
    });
  }
});
