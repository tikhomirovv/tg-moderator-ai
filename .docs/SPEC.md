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
- **Database**: MongoDB (с абстракцией для легкой смены)
- **UI**: Tailwind CSS + Headless UI

## Архитектура

### 1. Структура проекта

```
tg-moderator-ai/
├── server/
│   ├── core/
│   │   ├── bot.ts              # Основной класс бота
│   │   ├── ai-moderation.ts    # AI логика модерации
│   │   └── logger.ts           # Логирование
│   ├── database/
│   │   ├── connection.ts       # Абстракция подключения к БД
│   │   ├── seed.ts             # Начальные данные
│   │   ├── models/
│   │   │   ├── bot.ts          # Модель бота
│   │   │   └── rule.ts         # Модель правила
│   │   └── repositories/
│   │       ├── bot-repository.ts    # Репозиторий ботов
│   │       └── rule-repository.ts   # Репозиторий правил
│   ├── types/
│   │   ├── moderation.ts       # Типы модерации
│   │   └── telegram.ts         # Типы Telegram API
│   ├── utils/
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
├── logs/                       # Логи
├── .env.example               # Пример переменных окружения
├── docker-compose.yml         # MongoDB контейнер
├── nuxt.config.ts             # Конфигурация Nuxt
└── package.json
```

### 2. База данных

#### Абстракция БД

Проект использует абстракцию для работы с базой данных, что позволяет легко сменить БД:

```typescript
interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getDb(): Db;
  isConnected(): boolean;
}
```

#### Модели данных

**Бот (Bot)**:
```typescript
interface Bot {
  _id?: ObjectId;
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название бота
  chats: Chat[];                 // Список чатов
  is_active: boolean;            // Активен ли бот
  created_at: Date;
  updated_at: Date;
}

interface Chat {
  chat_id: number;               // ID чата в Telegram
  name: string;                  // Название чата
  rules: string[];               // Список правил
  warnings_before_ban: number;   // Количество предупреждений до бана
  auto_delete_violations: boolean; // Автоудаление нарушений
}
```

**Правило (Rule)**:
```typescript
interface Rule {
  _id?: ObjectId;
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название правила
  description: string;           // Описание
  ai_prompt: string;             // Промпт для AI
  severity: 'low' | 'medium' | 'high'; // Важность
  is_active: boolean;            // Активно ли правило
  created_at: Date;
  updated_at: Date;
}
```

### 3. Динамическая загрузка токенов и безопасность

#### Паттерн именования переменных окружения:

```bash
# Паттерн: TELEGRAM_BOT_TOKEN_{BOT_ID.toUpperCase()}
TELEGRAM_BOT_TOKEN_MAIN_MODERATOR=your_main_bot_token
TELEGRAM_BOT_TOKEN_GAMING_MODERATOR=your_gaming_bot_token
OPENAI_API_KEY=your_openai_key
MONGODB_URI=mongodb://admin:password@localhost:27017/tg-moderator?authSource=admin
```

#### Алгоритм загрузки токенов:

1. **Чтение ботов** из базы данных
2. **Генерация имени переменной** для каждого бота: `TELEGRAM_BOT_TOKEN_{BOT_ID.toUpperCase()}`
3. **Поиск токена** в переменных окружения
4. **Валидация** наличия токенов для всех активных ботов
5. **Запуск ботов** только при наличии всех необходимых токенов

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
- MongoDB (локально или облачно)
- OpenAI API ключ
- Telegram Bot токены

#### Docker поддержка:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:8.0.12
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: tg-moderator
    volumes:
      - mongodb_data:/data/db
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
    '@nuxt/fonts'
  ],
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    mongodbUri: process.env.MONGODB_URI
  }
})
```

## Следующие шаги

1. **Запуск MongoDB** через Docker Compose
2. **Настройка переменных окружения** (.env файл)
3. **Запуск приложения** и проверка инициализации БД
4. **Тестирование веб-интерфейса** для управления ботами и правилами
5. **Интеграция с Telegram Bot API** (серверная часть)
6. **Реализация AI модерации** (OpenAI интеграция)
7. **Система логирования** с Pino
8. **Отладка и тестирование**
