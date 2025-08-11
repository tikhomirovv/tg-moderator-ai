import { TelegramBot } from "./core/bot";
import { BotRepository } from "./database/repositories/bot-repository";
import { RuleRepository } from "./database/repositories/rule-repository";
import { logger } from "./core/logger";

// Глобальное хранилище ботов
const bots = new Map<string, TelegramBot>();

// Инициализация всех ботов
export async function initializeBots(): Promise<void> {
  try {
    logger.info("Начинаем инициализацию ботов...");

    // Загружаем ботов из БД
    const botRepo = new BotRepository();
    const ruleRepo = new RuleRepository();

    const botsFromDb = await botRepo.findActive();
    const rulesFromDb = await ruleRepo.findActive();

    if (botsFromDb.length === 0) {
      logger.warn("Нет активных ботов в базе данных");
      return;
    }

    // Получаем токены из БД
    const botTokens = await botRepo.getActiveBotTokens();

    if (botTokens.length === 0) {
      logger.warn("Нет токенов для активных ботов в базе данных");
      return;
    }

    // Создаем и инициализируем ботов
    for (const botConfig of botsFromDb) {
      const token = botTokens.find((t) => t.botId === botConfig.id);

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

    logger.info(`Инициализировано ${bots.size} ботов из ${botsFromDb.length}`);
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
