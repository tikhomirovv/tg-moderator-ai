import pino from "pino";

// Создаем основной логгер
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

// Создаем логгер для модерации
export const moderationLogger = pino(
  {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  },
  pino.destination("./logs/moderation.log")
);

// Создаем логгер для ошибок
export const errorLogger = pino(
  {
    level: "error",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  },
  pino.destination("./logs/errors.log")
);

// Функция для логирования действий модерации
export function logModerationAction(data: {
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  action: "warning" | "ban" | "delete" | "ignore";
  rule_violated?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
}) {
  moderationLogger.info({
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Функция для логирования ошибок
export function logError(error: Error, context?: Record<string, any>) {
  errorLogger.error({
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
