import { UserContextRepository } from "../database/repositories/user-context-repository";
import { UserMessageRepository } from "../database/repositories/user-message-repository";
import { ModerationActionRepository } from "../database/repositories/moderation-action-repository";
import { ChatStatisticsRepository } from "../database/repositories/chat-statistics-repository";
import { logger } from "./logger";

export class ContextService {
  private userContextRepo: UserContextRepository;
  private userMessageRepo: UserMessageRepository;
  private moderationActionRepo: ModerationActionRepository;
  private chatStatsRepo: ChatStatisticsRepository;

  constructor() {
    this.userContextRepo = new UserContextRepository();
    this.userMessageRepo = new UserMessageRepository();
    this.moderationActionRepo = new ModerationActionRepository();
    this.chatStatsRepo = new ChatStatisticsRepository();
  }

  // Получение контекста пользователя для AI анализа
  async getUserContext(
    botId: string,
    chatId: number,
    userId: number,
    userInfo?: { username?: string; first_name?: string; last_name?: string }
  ) {
    try {
      // Получаем или создаем контекст пользователя
      const userContext = await this.userContextRepo.getOrCreate(
        botId,
        chatId,
        userId,
        userInfo
      );

      // Получаем последние сообщения пользователя
      const recentMessages = await this.userMessageRepo.getRecentMessages(
        botId,
        chatId,
        userId,
        5
      );

      return {
        user_warnings: userContext.warnings_count,
        chat_history: recentMessages.map((m) => m.text),
        is_banned: userContext.is_banned,
      };
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка получения контекста пользователя"
      );
      return {
        user_warnings: 0,
        chat_history: [],
        is_banned: false,
      };
    }
  }

  // Сохранение входящего сообщения
  async saveMessage(
    botId: string,
    chatId: number,
    userId: number,
    messageId: number,
    text: string,
    timestamp: Date
  ) {
    try {
      await this.userMessageRepo.create({
        bot_id: botId,
        chat_id: chatId,
        user_id: userId,
        message_id: messageId,
        text: text,
        timestamp: timestamp,
      });

      // Обновляем статистику
      await this.incrementMessageCount(botId, chatId);

      logger.debug(
        `Сообщение сохранено: bot=${botId}, chat=${chatId}, user=${userId}, msg=${messageId}`
      );
    } catch (error) {
      logger.error({ error: error as Error }, "Ошибка сохранения сообщения");
    }
  }

  // Обработка предупреждения
  async handleWarning(
    botId: string,
    chatId: number,
    userId: number,
    messageId: number,
    ruleViolated: string,
    aiConfidence: number,
    aiReasoning: string
  ) {
    try {
      // Увеличиваем счетчик предупреждений
      await this.userContextRepo.incrementWarnings(botId, chatId, userId);

      // Создаем запись о действии модерации
      await this.moderationActionRepo.create({
        bot_id: botId,
        chat_id: chatId,
        user_id: userId,
        message_id: messageId,
        action_type: "warning",
        rule_violated: ruleViolated,
        ai_confidence: aiConfidence,
        ai_reasoning: aiReasoning,
        timestamp: new Date(),
        moderator_bot_id: botId,
      });

      // Обновляем статистику
      await this.incrementWarningCount(botId, chatId);

      logger.info(
        `Предупреждение выдано: bot=${botId}, chat=${chatId}, user=${userId}, rule=${ruleViolated}`
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обработки предупреждения"
      );
    }
  }

  // Обработка удаления сообщения
  async handleMessageDeletion(
    botId: string,
    chatId: number,
    messageId: number,
    reason: string
  ) {
    try {
      // Помечаем сообщение как удаленное
      await this.userMessageRepo.markAsDeleted(
        botId,
        chatId,
        messageId,
        reason
      );

      // Создаем запись о действии модерации
      await this.moderationActionRepo.create({
        bot_id: botId,
        chat_id: chatId,
        user_id: 0, // Будет заполнено из сообщения
        message_id: messageId,
        action_type: "delete",
        rule_violated: reason,
        ai_confidence: 1.0,
        ai_reasoning: reason,
        timestamp: new Date(),
        moderator_bot_id: botId,
      });

      // Обновляем статистику
      await this.incrementDeletedMessageCount(botId, chatId);

      logger.info(
        `Сообщение удалено: bot=${botId}, chat=${chatId}, msg=${messageId}, reason=${reason}`
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обработки удаления сообщения"
      );
    }
  }

  // Обработка бана пользователя
  async handleUserBan(
    botId: string,
    chatId: number,
    userId: number,
    ruleId: string
  ) {
    try {
      // Баним пользователя
      await this.userContextRepo.banUser(botId, chatId, userId, ruleId);

      // Создаем запись о действии модерации
      await this.moderationActionRepo.create({
        bot_id: botId,
        chat_id: chatId,
        user_id: userId,
        message_id: 0,
        action_type: "ban",
        rule_violated: ruleId,
        ai_confidence: 1.0,
        ai_reasoning: `User banned for violating rule: ${ruleId}`,
        timestamp: new Date(),
        moderator_bot_id: botId,
      });

      // Обновляем статистику
      await this.incrementBannedUserCount(botId, chatId);

      logger.info(
        `Пользователь забанен: bot=${botId}, chat=${chatId}, user=${userId}, rule=${ruleId}`
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обработки бана пользователя"
      );
    }
  }

  // Получение статистики чата
  async getChatStatistics(botId: string, chatId: number, date?: Date) {
    try {
      const targetDate = date || new Date();
      const dateKey = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );

      let stats = await this.chatStatsRepo.findByDate(botId, chatId, dateKey);

      if (!stats) {
        // Создаем новую запись статистики
        stats = await this.chatStatsRepo.create({
          bot_id: botId,
          chat_id: chatId,
          date: dateKey,
          messages_processed: 0,
          warnings_issued: 0,
          messages_deleted: 0,
          users_banned: 0,
          unique_users: 0,
        });
      }

      return stats;
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка получения статистики чата"
      );
      return null;
    }
  }

  // Приватные методы для обновления статистики
  private async incrementMessageCount(botId: string, chatId: number) {
    try {
      const today = new Date();
      const dateKey = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      await this.chatStatsRepo.incrementField(
        botId,
        chatId,
        dateKey,
        "messages_processed"
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обновления счетчика сообщений"
      );
    }
  }

  private async incrementWarningCount(botId: string, chatId: number) {
    try {
      const today = new Date();
      const dateKey = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      await this.chatStatsRepo.incrementField(
        botId,
        chatId,
        dateKey,
        "warnings_issued"
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обновления счетчика предупреждений"
      );
    }
  }

  private async incrementDeletedMessageCount(botId: string, chatId: number) {
    try {
      const today = new Date();
      const dateKey = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      await this.chatStatsRepo.incrementField(
        botId,
        chatId,
        dateKey,
        "messages_deleted"
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обновления счетчика удаленных сообщений"
      );
    }
  }

  private async incrementBannedUserCount(botId: string, chatId: number) {
    try {
      const today = new Date();
      const dateKey = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      await this.chatStatsRepo.incrementField(
        botId,
        chatId,
        dateKey,
        "users_banned"
      );
    } catch (error) {
      logger.error(
        { error: error as Error },
        "Ошибка обновления счетчика забаненных пользователей"
      );
    }
  }
}
