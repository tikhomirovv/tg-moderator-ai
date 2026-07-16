# Logging policy

Runtime log level: `LOG_LEVEL` env var (`info` default, `debug` for troubleshooting). Pino reads it in `server/core/logger.ts`.

## Levels

| Level | Use for | Examples |
|-------|---------|----------|
| **debug** | High-frequency operational detail | incoming Telegram updates, message text (truncated), LLM prompts/responses, chat lookup, DB ready in request path, statistics aggregation |
| **info** | Rare business events and lifecycle | app/DB startup, migrations OK, webhook set/remove, moderation outcome summary (rule + actions), user banned, database seed |
| **warn** | Degradation and expected anomalies | webhook secret reject, inactive bot, unknown chat, delivery unhealthy, silent-mode skipped Telegram actions |
| **error** | Failures | LLM/DB errors, webhook 500, uncaught handler exceptions |

## Guidelines

- At `LOG_LEVEL=info`, one moderated message should produce **a few** info lines (violation summary + action), not a step-by-step trace.
- Full LLM prompts and raw responses belong on **debug** only.
- Do not prefix messages with `"Debug:"` — use the correct level instead.
