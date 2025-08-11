import { TelegramBot } from "./core/bot";
import { loadBotsConfig, loadRulesConfig, loadBotTokens } from "./core/config";
import { logger } from "./core/logger";

// Глобальное хранилище ботов
const bots = new Map<string, TelegramBot>();

// Инициализация всех ботов
export async function initializeBots(): Promise<void> {
  try {
    logger.info("Начинаем инициализацию ботов...");

    // Загружаем конфигурации
    const botsConfig = loadBotsConfig();
    const rulesConfig = loadRulesConfig();
    const tokens = loadBotTokens(botsConfig.bots);

    // Создаем и инициализируем ботов
    for (const botConfig of botsConfig.bots) {
      const token = tokens.find((t) => t.botId === botConfig.id);

      if (!token) {
        logger.error(`Токен не найден для бота: ${botConfig.id}`);
        continue;
      }

      const bot = new TelegramBot(token.token, botConfig.id, botConfig);

      try {
        await bot.initialize();
        bots.set(botConfig.id, bot);
        logger.info(`Бот ${botConfig.id} успешно инициализирован`);
      } catch (error) {
        logger.error(
          { error: error as Error },
          `Ошибка инициализации бота ${botConfig.id}`
        );
      }
    }

    logger.info(
      `Инициализировано ${bots.size} ботов из ${botsConfig.bots.length}`
    );
  } catch (error) {
    logger.error(
      { error: error as Error },
      "Критическая ошибка инициализации ботов"
    );
    throw error;
  }
}

// Обработка обновления от Telegram
export async function handleTelegramUpdate(
  botId: string,
  update: any
): Promise<void> {
  const bot = bots.get(botId);

  if (!bot) {
    logger.warn(`Бот ${botId} не найден`);
    return;
  }

  await bot.handleUpdate(update);
}

// Получение списка активных ботов
export function getActiveBots(): string[] {
  return Array.from(bots.keys());
}

// Получение информации о боте
export function getBotInfo(
  botId: string
): { id: string; isRunning: boolean } | null {
  const bot = bots.get(botId);

  if (!bot) {
    return null;
  }

  return {
    id: bot.getBotId(),
    isRunning: bot.isBotRunning(),
  };
}

// Установка вебхуков для всех ботов
export async function setupWebhooks(baseUrl: string): Promise<void> {
  logger.info("Настройка вебхуков для ботов...");

  for (const [botId, bot] of bots) {
    try {
      const webhookUrl = `${baseUrl}/api/telegram/webhook/${botId}`;
      await bot.setWebhook(webhookUrl);
    } catch (error) {
      logger.error(
        { error: error as Error },
        `Ошибка установки вебхука для бота ${botId}`
      );
    }
  }
}

// Экспортируем для использования в Nuxt API роутах
export { bots };
