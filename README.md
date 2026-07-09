# Telegram AI Moderator Bot

🤖 **Telegram-бот модератор с искусственным интеллектом** для автоматической модерации чатов на основе конфигурируемых правил и AI-анализа.

## ✨ Возможности

- 🤖 **AI-модерация**: Автоматический анализ сообщений с помощью OpenAI GPT-4
- ⚙️ **Гибкая настройка**: Конфигурируемые правила модерации для каждого чата
- 📊 **Веб-интерфейс**: Удобное управление ботами и настройками
- 📝 **Логирование**: Подробные логи всех действий модерации
- 🔄 **Webhook интеграция**: Прямая интеграция с Telegram Bot API
- 🎯 **Точечная настройка**: Разные правила для разных чатов
- 🚫 **Автоматические действия**: Предупреждения, удаление сообщений, баны

## 🛠 Технический стек

- **Runtime**: [Bun](https://bun.sh/) - быстрый JavaScript runtime
- **Framework**: [Nuxt 3](https://nuxt.com/) (SSR + API роуты)
- **Frontend**: [Vue 3](https://vuejs.org/) + Composition API
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - утилитарный CSS фреймворк
- **AI**: [OpenAI GPT-4](https://openai.com/) - для анализа сообщений
- **Database**: [MongoDB](https://www.mongodb.com/) с абстракцией для легкой смены
- **Logging**: [Pino](https://getpino.io/) + pino-pretty для структурированного логирования
- **Deployment**: Docker Compose для простого развертывания

## 🚀 Быстрый старт

### Предварительные требования

- [Bun](https://bun.sh/) (рекомендуется) или Node.js 18+
- [Docker](https://www.docker.com/) и Docker Compose
- [localtunnel](https://github.com/localtunnel/localtunnel) для HTTPS в разработке (webhook)
- Telegram Bot Token от [@BotFather](https://t.me/BotFather)

### 1. Клонирование и установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd tg-moderator-ai

# Установка зависимостей
bun install
```

### 2. Настройка переменных окружения

```bash
# Копирование примера конфигурации
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
# OpenAI API (обязательно)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-nano-2025-04-14

# MongoDB (для Docker Compose)
MONGODB_URI=mongodb://admin:password@localhost:27017/tg-moderator?authSource=admin

# Базовый URL для webhook (должен быть доступен из интернета)
# Dev: localtunnel — https://your-subdomain.loca.lt
# Prod: https://your-domain.com
BASE_URL=https://your-subdomain.loca.lt

# Настройки приложения
NODE_ENV=development
```

### 3. Запуск базы данных

```bash
# Запуск MongoDB через Docker Compose
docker-compose up -d mongodb

# Проверка статуса
docker-compose ps
```

### 4. HTTPS для разработки (localtunnel)

Telegram требует HTTPS для webhook:

```bash
# В отдельном терминале (порт приложения — 3001)
bunx localtunnel --port 3001

# Скопируйте выданный HTTPS URL в .env:
# BASE_URL=https://your-subdomain.loca.lt
```

Перезапустите `bun run dev` после смены `BASE_URL`.

### 5. Запуск приложения

```bash
# Запуск в режиме разработки
bun run dev
```

Приложение будет доступно на http://localhost:3001

### 6. Инициализация базы данных

При первом запуске база данных автоматически инициализируется с базовыми данными.

## 🔌 API Endpoints

### Боты
- `GET /api/bots` - список всех ботов
- `POST /api/bots` - создание бота
- `GET /api/bots/[id]` - информация о боте
- `PUT /api/bots/[id]` - обновление бота
- `DELETE /api/bots/[id]` - удаление бота

### Конфигурация
- `GET /api/config/rules` - список правил
- `POST /api/config/rules` - создание правила
- `PUT /api/config/rules/[id]` - обновление правила
- `DELETE /api/config/rules/[id]` - удаление правила

### Модерация
- `GET /api/moderation/logs` - логи модерации
- `GET /api/moderation/stats` - статистика модерации

### Telegram Webhook
- `POST /api/telegram/webhook/[botId]` - webhook для Telegram

## 📝 Логирование

Приложение использует Pino для структурированного логирования:

- **INFO**: основные действия (создание бота, обработка сообщений)
- **ERROR**: ошибки и исключения
- **WARN**: предупреждения (неправильные токены, ошибки API)

Логи выводятся в консоль в формате JSON для удобного парсинга.

## 🐳 Развертывание

### Docker Compose (рекомендуется)

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Ручное развертывание

1. Установите MongoDB
2. Настройте переменные окружения
3. Запустите приложение:
   ```bash
   bun run build
   bun run start
   ```

## 🔧 Разработка

### Команды разработки

```bash
# Запуск в режиме разработки
bun run dev

# Сборка для продакшена
bun run build

```

## 🐛 Устранение неполадок

### Частые проблемы

1. **Webhook не работает**:
   - Убедитесь, что BASE_URL доступен из интернета
   - Проверьте, что используется HTTPS
   - Проверьте логи на наличие ошибок

2. **Бот не отвечает**:
   - Проверьте правильность токена
   - Убедитесь, что бот добавлен в чат
   - Проверьте права бота в чате

3. **Ошибки MongoDB**:
   - Убедитесь, что MongoDB запущена
   - Проверьте строку подключения в .env
   - Проверьте права доступа к базе данных

### Логи и отладка

```bash
# Просмотр логов приложения
bun run dev

# Просмотр логов Docker
docker-compose logs -f

# Просмотр логов MongoDB
docker-compose logs mongodb
```

## 📄 Лицензия

Этот проект распространяется под лицензией [Creative Commons Attribution-NonCommercial 4.0 International](LICENSE).

**⭐ Если проект вам понравился, поставьте звездочку на GitHub!**
