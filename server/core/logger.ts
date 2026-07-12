import pino from "pino";

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

/** Log structured errors to stdout (same stream as logger — Docker-friendly). */
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({
    err: error,
    context,
  });
}
