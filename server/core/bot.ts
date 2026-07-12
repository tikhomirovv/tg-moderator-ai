import { TelegramUpdate, TelegramMessage } from "../types/telegram";
import { Bot as DbBot } from "../database/models/bot";
import { AIModerationRequest, AIModerationResponse } from "../types/moderation";
import { Bot, Chat as ConfigChat } from "../types/config";
import { Rule as DbRule } from "../database/models/rule";
import { analyzeMessage } from "./ai-moderation";
import { logger } from "./logger";
import { RuleRepository } from "../database/repositories/rule-repository";
import { BotRepository } from "../database/repositories/bot-repository";
import { ChatRepository } from "../database/repositories/chat-repository";
import { ContextService } from "./context-service";
import { planViolationModeration } from "./moderation-actions";
import {
  buildUserMention,
  buildUserName,
  DEFAULT_BAN_TEMPLATE,
  DEFAULT_WARNING_TEMPLATE,
  escapeTelegramHtml,
  renderBotMessage,
  resolveBotMessageTemplate,
  resolveModerationReplyToMessageId,
} from "./bot-message-templates";
import {
  buildModerationDecisionRequest,
  saveModerationDecision,
} from "./moderation-decision";

export class TelegramBot {
  private token: string;
  private botId: string;
  private botConfig: Bot;
  private warningTemplate: string;
  private banTemplate: string;
  private webhookUrl?: string;
  private contextService: ContextService;

  constructor(token: string, botId: string, botConfig: DbBot) {
    this.token = token;
    this.botId = botId;
    this.botConfig = {
      id: botConfig.id,
      name: botConfig.name,
      chats: botConfig.chats,
    };
    this.warningTemplate = resolveBotMessageTemplate(
      botConfig.warning_message_template,
      DEFAULT_WARNING_TEMPLATE
    );
    this.banTemplate = resolveBotMessageTemplate(
      botConfig.ban_message_template,
      DEFAULT_BAN_TEMPLATE
    );
    this.contextService = new ContextService();
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      logger.debug(
        `Получено обновление для бота ${this.botId}, update_id: ${update.update_id}`
      );

      if (!update.message) {
        logger.debug(
          `Игнорируем обновление без сообщения: update_id=${update.update_id}`
        );
        return;
      }

      const message = update.message;

      logger.debug(
        `Обрабатываем сообщение от пользователя ${message.from.id} в чате ${message.chat.id}`
      );

      const chatConfig = await this.getChatConfig(message.chat.id);
      if (!chatConfig) {
        const chatLabel = this.describeTelegramChat(message.chat);
        logger.warn(
          `Сообщение из неотслеживаемого чата: chat_id=${message.chat.id}, chat=${chatLabel}, bot_id=${this.botId}`
        );
        return;
      }

      logger.debug(`Чат найден в конфигурации: ${chatConfig.name}`);

      if (!message.text) {
        logger.debug(
          `Игнорируем сообщение без текста: message_id=${message.message_id}`
        );
        return;
      }

      logger.debug(
        `Начинаем анализ сообщения: "${message.text.substring(0, 50)}${
          message.text.length > 50 ? "..." : ""
        }"`
      );

      await this.analyzeAndModerate(message, chatConfig);
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка обработки обновления");
    }
  }

  private async analyzeAndModerate(
    message: TelegramMessage,
    chatConfig: ConfigChat
  ): Promise<void> {
    try {
      await this.contextService.saveMessage(
        this.botId,
        message.chat.id,
        message.from.id,
        message.message_id,
        message.text!,
        new Date(message.date * 1000)
      );

      const chatRepo = new ChatRepository();
      const chatRow = await chatRepo.findByTelegramChatId(
        this.botId,
        message.chat.id
      );
      if (!chatRow) {
        logger.warn(
          { chatId: message.chat.id, botId: this.botId },
          "Chat row missing while processing message"
        );
        return;
      }

      const ruleRepo = new RuleRepository();
      const applicableRules = await ruleRepo.findActiveForChat(
        this.botId,
        chatRow.id
      );

      if (applicableRules.length === 0) {
        logger.debug(
          {
            chatId: message.chat.id,
            userId: message.from.id,
          },
          "No active rules for chat — skipping LLM"
        );
        return;
      }

      logger.debug(
        `Загружено правил для чата ${chatConfig.name}: ${applicableRules.length}`
      );

      const userContext = await this.contextService.getUserContext(
        this.botId,
        message.chat.id,
        message.from.id,
        {
          username: message.from.username,
          first_name: message.from.first_name,
          last_name: message.from.last_name,
        },
        { excludeMessageId: message.message_id }
      );

      const aiRequest: AIModerationRequest = {
        message: message.text!,
        user_id: message.from.id,
        username: message.from.username,
        chat_id: message.chat.id,
        rules: applicableRules.map((rule) => rule.id),
        context: {
          user_warnings: userContext.user_warnings,
          chat_history: userContext.chat_history,
        },
      };

      const aiResponse = await analyzeMessage(
        aiRequest,
        applicableRules.map((rule) => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          ai_prompt: rule.ai_prompt,
        }))
      );

      await saveModerationDecision(
        buildModerationDecisionRequest({
          botId: this.botId,
          chatId: message.chat.id,
          userId: message.from.id,
          messageId: message.message_id,
          messageText: message.text!,
          rulesApplied: applicableRules.map((rule) => rule.id),
          timestamp: new Date(message.date * 1000),
          aiResponse,
        })
      );

      if (aiResponse.violation_detected) {
        const violatedRule = applicableRules.find(
          (rule) => rule.id === aiResponse.rule_violated
        );
        await this.handleViolation(
          message,
          chatConfig,
          aiResponse,
          violatedRule ?? null
        );
      } else {
        logger.debug(
          `Сообщение от пользователя ${message.from.id} не содержит нарушений`
        );
      }
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка анализа сообщения");
    }
  }

  private async handleViolation(
    message: TelegramMessage,
    chatConfig: ConfigChat,
    aiResponse: AIModerationResponse,
    violatedRule: DbRule | null
  ): Promise<void> {
    try {
      const userContext = await this.contextService.getUserContext(
        this.botId,
        message.chat.id,
        message.from.id
      );

      const ruleConfig = violatedRule ?? {
        delete_on_violation: false,
        ban_on_violation: false,
        warnings_before_ban: null,
      };

      const plan = planViolationModeration({
        silentMode: Boolean(chatConfig.silent_mode),
        rule: ruleConfig,
        userWarningsBefore: userContext.user_warnings,
      });

      const ruleId = aiResponse.rule_violated ?? violatedRule?.id;
      const ruleDisplayName =
        violatedRule?.name ?? aiResponse.rule_violated ?? "unknown";

      if (plan.logBan) {
        await this.contextService.handleUserBan(
          this.botId,
          message.chat.id,
          message.from.id,
          ruleId
        );

        if (plan.telegramBan) {
          await this.banUser(message.chat.id, message.from.id, ruleDisplayName);

          const banText = renderBotMessage(this.banTemplate, {
            user_mention: buildUserMention(message.from),
            user_name: buildUserName(message.from),
            rule_name: escapeTelegramHtml(ruleDisplayName),
          });

          await this.sendInfoMessage(message.chat.id, banText);
        }

        logger.warn(
          `Пользователь ${message.from.id} ${
            plan.telegramBan ? "забанен" : "would be banned (silent)"
          } в чате ${message.chat.id} после ${
            userContext.user_warnings
          } предупреждений`
        );
      } else if (plan.logWarning) {
        await this.contextService.handleWarning(
          this.botId,
          message.chat.id,
          message.from.id,
          message.message_id,
          ruleId,
          aiResponse.confidence,
          aiResponse.reasoning
        );

        if (plan.telegramWarning) {
          const warningsCurrent = userContext.user_warnings + 1;
          const warningsLeft = plan.warningsBeforeBan - warningsCurrent;
          const warningText = renderBotMessage(this.warningTemplate, {
            user_mention: buildUserMention(message.from),
            user_name: buildUserName(message.from),
            rule_name: escapeTelegramHtml(ruleDisplayName),
            warnings_current: String(warningsCurrent),
            warnings_max: String(plan.warningsBeforeBan),
            warnings_left: String(Math.max(warningsLeft, 0)),
          });

          await this.sendMessage(
            message.chat.id,
            warningText,
            resolveModerationReplyToMessageId(
              plan.telegramDelete,
              message.message_id
            )
          );
        } else {
          logger.warn(
            `Silent mode: warning logged but not sent for user ${message.from.id} in chat ${message.chat.id}`
          );
        }
      } else if (plan.logAudit) {
        await this.contextService.logViolationAudit(
          this.botId,
          message.chat.id,
          message.from.id,
          message.message_id,
          ruleId,
          aiResponse.confidence,
          aiResponse.reasoning
        );
      }

      if (plan.logDelete) {
        if (plan.telegramDelete) {
          await this.deleteMessage(message.chat.id, message.message_id);
        }

        await this.contextService.handleMessageDeletion(
          this.botId,
          message.chat.id,
          message.message_id,
          `Violation: ${ruleDisplayName}`,
          ruleId
        );
      }

      logger.info(
        {
          botId: this.botId,
          chatId: message.chat.id,
          userId: message.from.id,
          rule: ruleDisplayName,
          ruleId,
          confidence: aiResponse.confidence,
          warn: plan.logWarning,
          delete: plan.logDelete,
          ban: plan.logBan,
          silentMode: Boolean(chatConfig.silent_mode),
        },
        "Moderation violation handled"
      );
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка обработки нарушения");
    }
  }

  private async sendInfoMessage(chatId: number, text: string): Promise<void> {
    await this.sendMessage(chatId, text);
  }

  private async getChatConfig(chatId: number): Promise<ConfigChat | null> {
    try {
      const botRepo = new BotRepository();
      const updatedBotConfig = await botRepo.findByIdWithToken(this.botId);

      if (!updatedBotConfig) {
        logger.warn(`Bot ${this.botId} not found in database`);
        return null;
      }

      this.botConfig = {
        id: updatedBotConfig.id,
        name: updatedBotConfig.name,
        chats: updatedBotConfig.chats,
      };

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

  private async sendMessage(
    chatId: number,
    text: string,
    replyToMessageId?: number
  ): Promise<void> {
    const messageData: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    };

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
          until_date: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          revoke_messages: true,
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
            url,
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

  getBotId(): string {
    return this.botId;
  }
}
