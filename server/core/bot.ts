import { TelegramUpdate, TelegramMessage } from "../types/telegram";
import { AIModerationRequest } from "../types/moderation";
import { Bot, Chat } from "../types/config";
import { analyzeMessage } from "./ai-moderation";
import { logger } from "./logger";
import { RuleRepository } from "../database/repositories/rule-repository";
import { BotRepository } from "../database/repositories/bot-repository";
import { ContextService } from "./context-service";

export class TelegramBot {
  private token: string;
  private botId: string;
  private botConfig: Bot;
  private webhookUrl?: string;
  private contextService: ContextService;

  constructor(token: string, botId: string, botConfig: Bot) {
    this.token = token;
    this.botId = botId;
    this.botConfig = botConfig;
    this.contextService = new ContextService();
  }

  // Обработка входящих обновлений
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      logger.info(
        `Получено обновление для бота ${this.botId}, update_id: ${update.update_id}`
      );

      if (!update.message) {
        logger.debug(
          `Игнорируем обновление без сообщения: update_id=${update.update_id}`
        );
        return; // Игнорируем обновления без сообщений
      }

      const message = update.message;

      logger.info(
        `Обрабатываем сообщение от пользователя ${message.from.id} в чате ${message.chat.id}`
      );

      // Проверяем, что сообщение из отслеживаемого чата
      const chatConfig = await this.getChatConfig(message.chat.id);
      if (!chatConfig) {
        const chatLabel = this.describeTelegramChat(message.chat);
        logger.warn(
          `Сообщение из неотслеживаемого чата: chat_id=${message.chat.id}, chat=${chatLabel}, bot_id=${this.botId}`
        );
        return; // Игнорируем сообщения из неотслеживаемых чатов
      }

      logger.info(
        `Чат найден в конфигурации: ${chatConfig.name}, правил: ${
          chatConfig.rules?.length || 0
        }`
      );

      // Проверяем, что сообщение содержит текст
      if (!message.text) {
        logger.debug(
          `Игнорируем сообщение без текста: message_id=${message.message_id}`
        );
        return;
      }

      logger.info(
        `Начинаем анализ сообщения: "${message.text.substring(0, 50)}${
          message.text.length > 50 ? "..." : ""
        }"`
      );

      // Анализируем сообщение
      await this.analyzeAndModerate(message, chatConfig);
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка обработки обновления");
    }
  }

  // Анализ и модерация сообщения
  private async analyzeAndModerate(
    message: TelegramMessage,
    chatConfig: Chat
  ): Promise<void> {
    try {
      // Сохраняем сообщение в базу данных
      await this.contextService.saveMessage(
        this.botId,
        message.chat.id,
        message.from.id,
        message.message_id,
        message.text!,
        new Date(message.date * 1000) // Telegram date в секундах, конвертируем в миллисекунды
      );

      // Получаем правила из базы данных
      const ruleRepo = new RuleRepository();
      const rules = await ruleRepo.findByIds(
        chatConfig.rules || [],
        this.botConfig.workspace_id
      );

      logger.info(
        `Загружено правил для чата ${chatConfig.name}: ${rules.length}`
      );

      // Отладочная информация о правилах
      logger.info(
        `Правила чата ${chatConfig.name} - ID: ${
          chatConfig.rules?.join(", ") || "нет"
        }, загружено: ${rules.length}`
      );

      // Получаем контекст пользователя
      const userContext = await this.contextService.getUserContext(
        this.botId,
        message.chat.id,
        message.from.id,
        {
          username: message.from.username,
          first_name: message.from.first_name,
          last_name: message.from.last_name,
        }
      );

      // Формируем запрос для AI
      const aiRequest: AIModerationRequest = {
        message: message.text!,
        user_id: message.from.id,
        chat_id: message.chat.id,
        rules: chatConfig.rules,
        context: {
          user_warnings: userContext.user_warnings,
          chat_history: userContext.chat_history,
        },
      };

      // Анализируем сообщение с помощью AI
      const aiResponse = await analyzeMessage(aiRequest, rules);

      if (aiResponse.violation_detected) {
        // Нарушение обнаружено
        await this.handleViolation(message, chatConfig, aiResponse);
      } else {
        // Нарушений нет
        logger.debug(
          `Сообщение от пользователя ${message.from.id} не содержит нарушений`
        );
      }
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка анализа сообщения");
    }
  }

  // Обработка нарушения
  private async handleViolation(
    message: TelegramMessage,
    chatConfig: Chat,
    aiResponse: any
  ): Promise<void> {
    try {
      // Получаем актуальный контекст пользователя перед обработкой
      const userContext = await this.contextService.getUserContext(
        this.botId,
        message.chat.id,
        message.from.id
      );

      // Проверяем, нужно ли забанить пользователя
      const shouldBan =
        userContext.user_warnings >= chatConfig.warnings_before_ban;

      if (shouldBan) {
        // Сохраняем информацию о бане в БД
        await this.contextService.handleUserBan(
          this.botId,
          message.chat.id,
          message.from.id,
          aiResponse.rule_violated || "unknown"
        );

        // Баним пользователя (если не silent режим)
        if (!chatConfig.silent_mode) {
          // Реальный бан через Telegram API
          await this.banUser(
            message.chat.id,
            message.from.id,
            aiResponse.rule_violated
          );

          const banText =
            `🚫 <b>Пользователь заблокирован!</b>\n\n` +
            `Пользователь <b>${
              message.from.first_name ||
              message.from.username ||
              message.from.id
            }</b> ` +
            `заблокирован за нарушение правил чата.\n` +
            `Количество предупреждений: <b>${userContext.user_warnings}</b>\n` +
            `Последнее нарушение: <b>${aiResponse.rule_violated}</b>`;

          await this.sendInfoMessage(message.chat.id, banText);
        }

        logger.warn(
          `Пользователь ${message.from.id} ${
            chatConfig.silent_mode ? "would be banned" : "забанен"
          } в чате ${message.chat.id} после ${
            userContext.user_warnings
          } предупреждений (silent: ${chatConfig.silent_mode})`
        );
      } else {
        // Обрабатываем предупреждение
        await this.contextService.handleWarning(
          this.botId,
          message.chat.id,
          message.from.id,
          message.message_id,
          aiResponse.rule_violated || "unknown",
          aiResponse.confidence,
          aiResponse.reasoning
        );

        // Отправляем предупреждение (если не silent режим)
        if (!chatConfig.silent_mode) {
          const warningsLeft =
            chatConfig.warnings_before_ban - userContext.user_warnings;
          const warningText =
            `⚠️ <b>Предупреждение!</b>\n\n` +
            `Сообщение нарушает правила чата.\n` +
            `Нарушение: <b>${aiResponse.rule_violated}</b>\n` +
            `Уверенность: <b>${Math.round(
              aiResponse.confidence * 100
            )}%</b>\n\n` +
            `Предупреждений: <b>${userContext.user_warnings + 1}/${
              chatConfig.warnings_before_ban
            }</b>\n` +
            `До блокировки: <b>${warningsLeft - 1}</b>\n\n` +
            `Пожалуйста, соблюдайте правила чата.`;

          // Отвечаем на сообщение с нарушением
          await this.sendMessage(
            message.chat.id,
            warningText,
            message.message_id
          );
        } else {
          logger.info(
            `Silent mode: Warning logged but not sent for user ${message.from.id} in chat ${message.chat.id}`
          );
        }
      }

      // Удаляем сообщение если настроено
      if (chatConfig.auto_delete_violations) {
        await this.deleteMessage(message.chat.id, message.message_id);

        // Обрабатываем удаление сообщения
        await this.contextService.handleMessageDeletion(
          this.botId,
          message.chat.id,
          message.message_id,
          `Violation: ${aiResponse.rule_violated}`
        );
      }
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка обработки нарушения");
    }
  }

  // Отправка информационного сообщения (без ответа)
  private async sendInfoMessage(chatId: number, text: string): Promise<void> {
    await this.sendMessage(chatId, text);
  }

  // Получение информации о боте
  private async getBotInfo(): Promise<any> {
    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/getMe`
    );
    const data = await response.json();

    if (!data.ok) {
      throw new Error(
        `Ошибка получения информации о боте: ${data.description}`
      );
    }

    return data.result;
  }

  // Получение конфигурации чата
  private async getChatConfig(chatId: number): Promise<Chat | null> {
    try {
      // Webhook path has no session — bot id is globally unique in DB.
      const botRepo = new BotRepository();
      const updatedBotConfig = await botRepo.findByIdWithToken(this.botId);

      if (!updatedBotConfig) {
        logger.warn(`Bot ${this.botId} not found in database`);
        return null;
      }

      // Обновляем локальную конфигурацию
      this.botConfig = {
        id: updatedBotConfig.id,
        name: updatedBotConfig.name,
        chats: updatedBotConfig.chats,
      };

      // Ищем чат в обновленной конфигурации
      const chatConfig = this.botConfig.chats.find(
        (chat) => chat.chat_id === chatId
      );

      if (chatConfig) {
        logger.debug(`Found chat config for ${chatId}: ${chatConfig.name}`);
      } else {
        logger.debug(`No chat config found for ${chatId}`);
      }

      return chatConfig || null;
    } catch (error) {
      logger.error(
        { error: error as Error },
        `Error getting chat config for ${chatId}`
      );
      // Возвращаем локальную конфигурацию как fallback
      return (
        this.botConfig.chats.find((chat) => chat.chat_id === chatId) || null
      );
    }
  }

  private describeTelegramChat(chat: TelegramMessage["chat"]) {
    const title = chat.title?.trim();
    const username = chat.username ? `@${chat.username}` : null;
    const parts = [title, username, chat.type].filter(Boolean);
    return parts.join(" · ") || "unknown";
  }

  // Отправка сообщения
  private async sendMessage(
    chatId: number,
    text: string,
    replyToMessageId?: number
  ): Promise<void> {
    const messageData: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    };

    // Если указан ID сообщения для ответа, добавляем reply_to_message_id
    if (replyToMessageId) {
      messageData.reply_to_message_id = replyToMessageId;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка отправки сообщения: ${response.statusText}`);
    }
  }

  // Удаление сообщения
  private async deleteMessage(
    chatId: number,
    messageId: number
  ): Promise<void> {
    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/deleteMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
        }),
      }
    );

    if (!response.ok) {
      logger.warn(
        `Не удалось удалить сообщение ${messageId}: ${response.statusText}`
      );
    }
  }

  // Бан пользователя в чате
  private async banUser(
    chatId: number,
    userId: number,
    reason?: string
  ): Promise<void> {
    const response = await fetch(
      `https://api.telegram.org/bot${this.token}/banChatMember`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId,
          until_date: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 дней
          revoke_messages: true, // Удаляем все сообщения пользователя
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      logger.warn(
        `Не удалось забанить пользователя ${userId}: ${
          errorData.description || response.statusText
        }`
      );
      throw new Error(
        `Ошибка бана пользователя: ${
          errorData.description || response.statusText
        }`
      );
    }

    logger.info(`Пользователь ${userId} забанен в чате ${chatId}`);
  }

  // Установка вебхука
  async setWebhook(url: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.token}/setWebhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url,
            allowed_updates: ["message", "edited_message"],
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Ошибка установки вебхука: ${data.description}`);
      }

      this.webhookUrl = url;
      logger.info(`Вебхук установлен для бота ${this.botId}: ${url}`);
    } catch (error) {
      logger.error(
        { error: error as Error },
        `Ошибка установки вебхука для бота ${this.botId}`
      );
      throw error;
    }
  }

  // Получение информации о боте
  getBotId(): string {
    return this.botId;
  }
}
