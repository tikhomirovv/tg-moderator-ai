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

// Функция для логирования ошибок
export function logError(error: Error, context?: Record<string, any>) {
  errorLogger.error({
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
