import { TelegramUpdate, TelegramMessage } from "../types/telegram";
import { AIModerationRequest } from "../types/moderation";
import { Bot, Chat } from "../types/config";
import { analyzeMessage } from "./ai-moderation";
import { logModerationAction } from "./logger";
import { logger } from "./logger";
import { RuleRepository } from "../database/repositories/rule-repository";
import { ContextService } from "./context-service";

export class TelegramBot {
  private token: string;
  private botId: string;
  private botConfig: Bot;
  private webhookUrl?: string;
  private isRunning = false;
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
      const chatConfig = this.getChatConfig(message.chat.id);
      if (!chatConfig) {
        logger.warn(
          `Сообщение из неотслеживаемого чата: chat_id=${message.chat.id}, bot_id=${this.botId}`
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
      const rules = await ruleRepo.findByIds(chatConfig.rules || []);

      logger.info(
        `Загружено правил для чата ${chatConfig.name}: ${rules.length}`
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
        // Баним пользователя
        await this.contextService.handleUserBan(
          this.botId,
          message.chat.id,
          message.from.id,
          aiResponse.rule_violated || "unknown"
        );

        // Отправляем уведомление о бане
        const banText =
          `🚫 <b>Пользователь заблокирован!</b>\n\n` +
          `Пользователь <b>${
            message.from.first_name || message.from.username || message.from.id
          }</b> ` +
          `заблокирован за нарушение правил чата.\n` +
          `Количество предупреждений: <b>${userContext.user_warnings}</b>\n` +
          `Последнее нарушение: <b>${aiResponse.rule_violated}</b>`;

        await this.sendInfoMessage(message.chat.id, banText);

        logger.warn(
          `Пользователь ${message.from.id} забанен в чате ${message.chat.id} после ${userContext.user_warnings} предупреждений`
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

        // Логируем нарушение (старый метод для совместимости)
        logModerationAction({
          bot_id: this.botId,
          chat_id: message.chat.id,
          user_id: message.from.id,
          message_id: message.message_id,
          action: "warning",
          rule_violated: aiResponse.rule_violated,
          ai_confidence: aiResponse.confidence,
          ai_reasoning: aiResponse.reasoning,
        });

        // Отправляем предупреждение с информацией о количестве до бана
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
  private getChatConfig(chatId: number): Chat | null {
    return this.botConfig.chats.find((chat) => chat.chat_id === chatId) || null;
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

  // Проверка статуса бота
  isBotRunning(): boolean {
    return this.isRunning;
  }
}
