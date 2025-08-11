# Telegram AI Moderator

Система автоматической модерации Telegram чатов с использованием искусственного интеллекта.

## Технологии

- **Runtime**: Bun
- **Framework**: Nuxt 4
- **Language**: TypeScript
- **AI**: OpenAI GPT-4
- **Logging**: Pino
- **UI**: Vue 3 + Tailwind CSS

## Быстрый старт

### 1. Установка зависимостей

```bash
bun install
```

### 2. Настройка переменных окружения

Скопируйте файл `env.example` в `.env` и заполните необходимые переменные:

```bash
cp env.example .env
```

Отредактируйте `.env`:

```env
# Telegram Bot Tokens
# Паттерн: TELEGRAM_BOT_TOKEN_{BOT_ID.toUpperCase()}
TELEGRAM_BOT_TOKEN_MAIN_MODERATOR=your_main_bot_token_here
TELEGRAM_BOT_TOKEN_GAMING_MODERATOR=your_gaming_bot_token_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Настройки приложения
NODE_ENV=development
```

### 3. Настройка конфигурации

Отредактируйте файлы конфигурации в папке `config/`:

- `config/bots.yaml` - настройки ботов и чатов
- `config/rules.yaml` - правила модерации

### 4. Запуск в режиме разработки

```bash
bun run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### 5. Настройка вебхуков

После запуска приложения нужно настроить вебхуки для ваших ботов.
Отправьте POST запрос на `/api/init` для инициализации ботов.

## Структура проекта

```
tg-moderator-ai/
├── server/                 # Серверная логика
│   ├── core/              # Основные модули
│   │   ├── bot.ts         # Класс Telegram бота
│   │   ├── ai-moderation.ts # AI логика модерации
│   │   ├── config.ts      # Загрузка конфигурации
│   │   └── logger.ts      # Логирование
│   ├── types/             # TypeScript типы
│   ├── api/               # API роуты
│   └── index.ts           # Точка входа сервера
├── config/                # Конфигурационные файлы
│   ├── bots.yaml          # Настройки ботов
│   └── rules.yaml         # Правила модерации
├── app.vue                # Главная страница
└── nuxt.config.ts         # Конфигурация Nuxt
```

## API Endpoints

- `GET /api/bots` - Список активных ботов
- `POST /api/init` - Инициализация ботов
- `POST /api/telegram/webhook/[botId]` - Вебхук для Telegram

## Конфигурация ботов

В файле `config/bots.yaml` настройте ваших ботов:

```yaml
bots:
  - id: "main_moderator"
    name: "Main Chat Moderator"
    chats:
      - chat_id: -1001234567890
        name: "Main Community"
        rules: ["spam", "hate_speech", "advertising"]
        warnings_before_ban: 3
        auto_delete_violations: true
```

## Правила модерации

В файле `config/rules.yaml` определите правила:

```yaml
rules:
  spam:
    name: "Спам и реклама"
    description: "Запрещены повторяющиеся сообщения, реклама без разрешения"
    ai_prompt: |
      Определи, является ли сообщение спамом или нежелательной рекламой.
    severity: "medium"
```

## Логирование

Логи сохраняются в папке `logs/`:
- `moderation.log` - логи модерации
- `errors.log` - ошибки

## Развертывание

### Docker

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json .
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Переменные окружения для продакшена

Убедитесь, что все необходимые переменные окружения установлены:
- `TELEGRAM_BOT_TOKEN_*` - токены ваших ботов
- `OPENAI_API_KEY` - ключ OpenAI API
- `NODE_ENV=production`

## Поддержка

Для получения помощи создайте issue в репозитории проекта.
