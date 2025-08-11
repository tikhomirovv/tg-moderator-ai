import { readFileSync } from "fs";
import { parse } from "yaml";
import { Bot, BotsConfig, Rule, RulesConfig, BotToken } from "../types/config";
import { logger } from "./logger";

// Загрузка конфигурации ботов
export function loadBotsConfig(): BotsConfig {
  try {
    const configPath = "./config/bots.yaml";
    const configContent = readFileSync(configPath, "utf8");
    const config = parse(configContent) as BotsConfig;

    logger.info(`Загружена конфигурация для ${config.bots.length} ботов`);
    return config;
  } catch (error) {
    logger.error(
      { error: error as Error },
      "Ошибка загрузки конфигурации ботов"
    );
    throw new Error("Не удалось загрузить конфигурацию ботов");
  }
}

// Загрузка правил модерации
export function loadRulesConfig(): RulesConfig {
  try {
    const configPath = "./config/rules.yaml";
    const configContent = readFileSync(configPath, "utf8");
    const config = parse(configContent) as RulesConfig;

    logger.info(
      `Загружено ${Object.keys(config.rules).length} правил модерации`
    );
    return config;
  } catch (error) {
    logger.error({ error: error as Error }, "Ошибка загрузки правил модерации");
    throw new Error("Не удалось загрузить правила модерации");
  }
}

// Загрузка токенов ботов из переменных окружения
export function loadBotTokens(bots: Bot[]): BotToken[] {
  const tokens: BotToken[] = [];

  for (const bot of bots) {
    const envKey = `TELEGRAM_BOT_TOKEN_${bot.id.toUpperCase()}`;
    const token = process.env[envKey];

    if (!token) {
      const error = `Отсутствует токен для бота ${bot.id}. Установите переменную окружения ${envKey}`;
      logger.error(error);
      throw new Error(error);
    }

    tokens.push({ botId: bot.id, token });
    logger.info(`Загружен токен для бота: ${bot.id}`);
  }

  return tokens;
}

// Получение конфигурации чата по ID
export function getChatConfig(
  botId: string,
  chatId: number,
  botsConfig: BotsConfig
) {
  const bot = botsConfig.bots.find((b) => b.id === botId);
  if (!bot) {
    return null;
  }

  return bot.chats.find((chat) => chat.chat_id === chatId) || null;
}

// Получение правил для чата
export function getChatRules(
  botId: string,
  chatId: number,
  botsConfig: BotsConfig,
  rulesConfig: RulesConfig
) {
  const chatConfig = getChatConfig(botId, chatId, botsConfig);
  if (!chatConfig) {
    return [];
  }

  return chatConfig.rules
    .map((ruleId) => rulesConfig.rules[ruleId])
    .filter(Boolean);
}
