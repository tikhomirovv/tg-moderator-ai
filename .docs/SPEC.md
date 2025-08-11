# Telegram AI Moderator Bot - Спецификация

## Обзор проекта

Telegram-бот модератор с искусственным интеллектом для автоматической модерации чатов на основе конфигурируемых правил.

## Технический стек

- **Runtime**: Bun
- **Language**: TypeScript
- **Framework**: Nuxt 3 (SSR + API роуты)
- **Frontend**: Vue 3 + Composition API
- **Logging**: Pino + pino-pretty
- **AI**: OpenAI GPT-4
- **Configuration**: YAML/JSON
- **Database**: SQLite (для логов и состояния)
- **UI**: Tailwind CSS + Headless UI

## Архитектура

### 1. Структура проекта

```
tg-moderator-ai/
├── server/
│   ├── core/
│   │   ├── bot.ts              # Основной класс бота
│   │   ├── ai-moderation.ts    # AI логика модерации
│   │   ├── config.ts           # Конфигурация
│   │   └── logger.ts           # Логирование
│   ├── types/
│   │   ├── config.ts           # Типы конфигурации
│   │   ├── moderation.ts       # Типы модерации
│   │   └── telegram.ts         # Типы Telegram API
│   ├── utils/
│   │   ├── security.ts         # Безопасность токенов
│   │   └── helpers.ts          # Вспомогательные функции
│   └── index.ts                # Точка входа сервера
├── server/api/                 # Nuxt API роуты
│   ├── bots/
│   │   ├── index.get.ts        # Список ботов
│   │   ├── [id].get.ts         # Информация о боте
│   │   └── [id]/logs.get.ts    # Логи бота
│   ├── moderation/
│   │   ├── stats.get.ts        # Статистика модерации
│   │   └── logs.get.ts         # Логи модерации
│   └── config/
│       ├── rules.get.ts        # Правила
│       └── rules.put.ts        # Обновление правил
├── pages/                      # Vue страницы
│   ├── index.vue               # Главная страница
│   ├── bots/
│   │   ├── index.vue           # Список ботов
│   │   └── [id].vue            # Детали бота
│   ├── moderation/
│   │   ├── stats.vue           # Статистика
│   │   └── logs.vue            # Логи
│   └── config/
│       └── rules.vue           # Управление правилами
├── components/                 # Vue компоненты
│   ├── ui/                     # UI компоненты
│   ├── bots/                   # Компоненты ботов
│   └── moderation/             # Компоненты модерации
├── config/
│   ├── bots.yaml               # Конфигурация ботов
│   └── rules.yaml              # Правила модерации
├── logs/                       # Логи
├── .env.example               # Пример переменных окружения
├── nuxt.config.ts             # Конфигурация Nuxt
└── package.json
```

### 2. Конфигурация

#### Структура конфигурации ботов (bots.yaml)

```yaml
bots:
  - id: "main_moderator"
    name: "Main Chat Moderator"
    # Автоматически ищет TELEGRAM_BOT_TOKEN_MAIN_MODERATOR
    chats:
      - chat_id: -1001234567890
        name: "Main Community"
        rules: ["spam", "hate_speech", "advertising"]
        warnings_before_ban: 3
        auto_delete_violations: true
      - chat_id: -1001234567891
        name: "Support Chat"
        rules: ["spam", "hate_speech"]
        warnings_before_ban: 2
        auto_delete_violations: false

  - id: "gaming_moderator"
    name: "Gaming Community Moderator"
    # Автоматически ищет TELEGRAM_BOT_TOKEN_GAMING_MODERATOR
    chats:
      - chat_id: -1001234567892
        name: "Gaming Chat"
        rules: ["spam", "hate_speech", "gaming_violations"]
        warnings_before_ban: 2
        auto_delete_violations: true
```

#### Структура правил (rules.yaml)

```yaml
rules:
  spam:
    name: "Спам и реклама"
    description: "Запрещены повторяющиеся сообщения, реклама без разрешения"
    ai_prompt: |
      Определи, является ли сообщение спамом или нежелательной рекламой.
      Критерии: повторяющиеся сообщения, коммерческая реклама без разрешения,
      массовые рассылки, флуд.
    severity: "medium"

  hate_speech:
    name: "Ненавистнические высказывания"
    description: "Запрещены оскорбления, дискриминация, призывы к насилию"
    ai_prompt: |
      Определи, содержит ли сообщение ненавистнические высказывания,
      оскорбления, дискриминацию или призывы к насилию.
    severity: "high"

  gaming_violations:
    name: "Нарушения в игровых чатах"
    description: "Спам в игровых командах, оскорбления игроков"
    ai_prompt: |
      Определи нарушения, специфичные для игровых чатов:
      спам в командах, оскорбления игроков, раскрытие личной информации.
    severity: "medium"
```

### 3. Динамическая загрузка токенов и безопасность

#### Паттерн именования переменных окружения:

```bash
# Паттерн: TELEGRAM_BOT_TOKEN_{BOT_ID.toUpperCase()}
TELEGRAM_BOT_TOKEN_MAIN_MODERATOR=your_main_bot_token
TELEGRAM_BOT_TOKEN_GAMING_MODERATOR=your_gaming_bot_token
OPENAI_API_KEY=your_openai_key
```

#### Алгоритм загрузки токенов:

1. **Чтение конфигурации** ботов из `bots.yaml`
2. **Генерация имени переменной** для каждого бота: `TELEGRAM_BOT_TOKEN_{BOT_ID.toUpperCase()}`
3. **Поиск токена** в переменных окружения
4. **Валидация** наличия токенов для всех настроенных ботов
5. **Запуск ботов** только при наличии всех необходимых токенов

#### Реализация в коде:

```typescript
interface BotToken {
  botId: string;
  token: string;
}

function loadBotTokens(bots: Bot[]): BotToken[] {
  const tokens: BotToken[] = [];

  for (const bot of bots) {
    const envKey = `TELEGRAM_BOT_TOKEN_${bot.id.toUpperCase()}`;
    const token = process.env[envKey];

    if (!token) {
      throw new Error(`Missing token for bot ${bot.id}. Set ${envKey} environment variable.`);
    }

    tokens.push({ botId: bot.id, token });
  }

  return tokens;
}
```



### 4. AI Модерация

#### Процесс анализа:

1. **Получение сообщения** из Telegram API
2. **Предварительная фильтрация** (длина, тип контента)
3. **AI анализ** с использованием OpenAI API
4. **Классификация нарушений** по правилам
5. **Принятие решения** (предупреждение/бан/игнорирование)

#### Структура AI запроса:

```typescript
interface AIModerationRequest {
  message: string;
  user_id: number;
  chat_id: number;
  rules: Rule[];
  context: {
    user_warnings: number;
    chat_history: Message[];
  };
}
```

### 5. Система предупреждений и банов

#### Состояние пользователя:

```typescript
interface UserState {
  user_id: number;
  chat_id: number;
  warnings: Warning[];
  is_banned: boolean;
  ban_expires_at?: Date;
  total_violations: number;
}
```

#### Процесс модерации:

1. **Нарушение обнаружено** → Создание предупреждения
2. **Лимит предупреждений достигнут** → Временный бан
3. **Повторные нарушения** → Увеличение срока бана
4. **Критические нарушения** → Перманентный бан

### 6. Логирование

#### Структура логов:

```typescript
interface ModerationLog {
  timestamp: Date;
  bot_id: string;
  chat_id: number;
  user_id: number;
  message_id: number;
  action: 'warning' | 'ban' | 'delete' | 'ignore';
  rule_violated: string;
  ai_confidence: number;
  ai_reasoning: string;
  moderator_override?: boolean;
}
```

#### Уровни логирования:

- **DEBUG**: Детальная информация о AI запросах
- **INFO**: Основные действия модерации
- **WARN**: Подозрительная активность
- **ERROR**: Ошибки API, проблемы с AI

### 7. API и интеграции

#### Telegram Bot API:
- Обработка сообщений
- Отправка предупреждений
- Управление банами
- Удаление сообщений

#### OpenAI API:
- Анализ контента
- Классификация нарушений
- Объяснение решений

#### Nuxt API роуты (веб-интерфейс):

```typescript
// GET /api/bots - Список всех ботов
// GET /api/bots/[id] - Информация о конкретном боте
// GET /api/bots/[id]/logs - Логи бота
// GET /api/moderation/stats - Статистика модерации
// GET /api/moderation/logs - Логи модерации
// GET /api/config/rules - Получить правила
// PUT /api/config/rules - Обновить правила
```

#### Веб-интерфейс (Vue 3 + Nuxt):

- **Главная страница**: Обзор всех ботов и статистика
- **Страница бота**: Детальная информация, логи, настройки
- **Статистика модерации**: Графики, метрики, анализ
- **Управление правилами**: Редактирование правил через веб-интерфейс
- **Логи**: Просмотр и фильтрация логов модерации

### 8. Производительность

- Асинхронная обработка сообщений
- Ограничение частоты запросов к OpenAI API

### 9. Развертывание

#### Требования:

- Node.js 18+ или Bun
- SQLite для локального развертывания
- OpenAI API ключ
- Telegram Bot токены

#### Docker поддержка:

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

#### Nuxt конфигурация (nuxt.config.ts):

```typescript
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'node-server'
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    // Переменные только для сервера
    telegramTokens: process.env,
    openaiApiKey: process.env.OPENAI_API_KEY
  }
})
```



## Следующие шаги

1. **Инициализация Nuxt проекта** с Bun и TypeScript
2. **Настройка базовой структуры** (папки, конфигурация)
3. **Реализация динамической загрузки токенов** из env
4. **Создание API роутов** для веб-интерфейса
5. **Интеграция с Telegram Bot API** (серверная часть)
6. **Реализация AI модерации** (OpenAI интеграция)
7. **Система логирования** с Pino
8. **Веб-интерфейс** (Vue компоненты, страницы)
9. **Отладка и тестирование**
