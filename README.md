# Telegram AI Moderator Bot

Telegram-бот модератор с искусственным интеллектом для автоматической модерации чатов на основе конфигурируемых правил.

## Технический стек

- **Runtime**: Bun
- **Language**: TypeScript
- **Framework**: Nuxt 3 (SSR + API роуты)
- **Frontend**: Vue 3 + Composition API
- **Logging**: Pino + pino-pretty
- **AI**: OpenAI GPT-4
- **Database**: MongoDB (с абстракцией для легкой смены)
- **UI**: Tailwind CSS

## Быстрый старт

### 1. Установка зависимостей

```bash
bun install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB (для Docker Compose)
MONGODB_URI=mongodb://admin:password@localhost:27017/tg-moderator?authSource=admin

# Настройки приложения
NODE_ENV=development
```

### 3. Запуск MongoDB

```bash
docker-compose up -d
```

### 4. Запуск приложения

```bash
bun run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Структура проекта

```
tg-moderator-ai/
├── server/
│   ├── core/              # Основная логика
│   ├── database/          # Работа с БД
│   │   ├── models/        # Модели данных
│   │   ├── repositories/  # Репозитории
│   │   └── seed.ts        # Начальные данные
│   ├── api/               # API роуты
│   └── types/             # TypeScript типы
├── pages/                 # Vue страницы
├── components/            # Vue компоненты
├── layouts/               # Макеты страниц
└── public/                # Статические файлы
```

## Управление ботами

### Создание бота через веб-интерфейс

1. Откройте http://localhost:3000/bots
2. Нажмите "Add Bot"
3. Заполните форму:
   - **Bot ID**: уникальный идентификатор
   - **Name**: название бота
   - **Token**: токен от @BotFather
   - **Chats**: настройки чатов

### Настройка чатов

Для каждого чата укажите:
- **Chat ID**: ID чата в Telegram
- **Name**: название чата
- **Rules**: выберите правила модерации
- **Warnings before ban**: количество предупреждений до бана
- **Auto delete violations**: автоматически удалять нарушения

## Управление правилами

### Создание правила

1. Откройте http://localhost:3000/config/rules
2. Нажмите "Add Rule"
3. Заполните форму:
   - **ID**: уникальный идентификатор
   - **Name**: название правила
   - **Description**: описание
   - **AI Prompt**: промпт для AI анализа
   - **Severity**: важность (low/medium/high)

### Настройка AI промпта

AI промпт должен содержать четкие инструкции для анализа сообщений:

```
Определи, является ли сообщение спамом.
Критерии: повторяющиеся сообщения, реклама без разрешения.
Ответь: YES/NO с объяснением.
```

## API Endpoints

### Боты
- `GET /api/bots` - список всех ботов
- `POST /api/bots` - создание бота
- `GET /api/bots/[id]` - информация о боте
- `PUT /api/bots/[id]` - обновление бота

### Правила
- `GET /api/config/rules` - список правил
- `PUT /api/config/rules` - обновление правил

### Модерация
- `GET /api/moderation/logs` - логи модерации

## Логирование

Приложение использует Pino для структурированного логирования:

- **INFO**: основные действия
- **ERROR**: ошибки и исключения
- **WARN**: предупреждения

Логи выводятся в консоль в формате JSON.

## Развертывание

### Docker

```bash
# Сборка образа
docker build -t tg-moderator .

# Запуск
docker run -p 3000:3000 --env-file .env tg-moderator
```

### Production

1. Установите MongoDB
2. Настройте переменные окружения
3. Запустите приложение:
   ```bash
   bun run build
   bun run start
   ```

## Поддержка

- Документация: [SPEC.md](.docs/SPEC.md)
- Issues: GitHub Issues
- Обсуждения: GitHub Discussions
