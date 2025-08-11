import { RuleRepository } from "./repositories/rule-repository";
import { logger } from "../core/logger";

export async function seedDatabase() {
  const ruleRepo = new RuleRepository();

  // Создаем только начальные правила
  const rules = [
    {
      id: "spam",
      name: "Спам и реклама",
      description: "Запрещены повторяющиеся сообщения, реклама без разрешения",
      ai_prompt: `Определи, является ли сообщение спамом или нежелательной рекламой.
Критерии: повторяющиеся сообщения, коммерческая реклама без разрешения,
массовые рассылки, флуд.`,
      severity: "medium" as const,
    },
    {
      id: "hate_speech",
      name: "Ненавистнические высказывания",
      description: "Запрещены оскорбления, дискриминация, призывы к насилию",
      ai_prompt: `Определи, содержит ли сообщение ненавистнические высказывания, оскорбления, пассивную агрессию, дискриминацию или призывы к насилию.

Критерии пассивной агрессии:
- Скрытые оскорбления и насмешки ("давай гуляй", "ну и что ты расскажешь еще, деточка")
- Завуалированные угрозы и манипуляции
- Саркастичные комментарии с целью унижения
- Подавляющие и контролирующие высказывания
- Повторяющиеся провокационные сообщения`,
      severity: "high" as const,
    },
    {
      id: "advertising",
      name: "Реклама",
      description: "Коммерческая реклама без разрешения администрации",
      ai_prompt: `Определи, содержит ли сообщение коммерческую рекламу товаров или услуг
без явного разрешения администрации чата.`,
      severity: "medium" as const,
    },
    {
      id: "gaming_violations",
      name: "Нарушения в игровых чатах",
      description: "Спам в игровых командах, оскорбления игроков",
      ai_prompt: `Определи нарушения, специфичные для игровых чатов:
спам в командах, оскорбления игроков, раскрытие личной информации.`,
      severity: "medium" as const,
    },
  ];

  try {
    // Проверяем, есть ли уже данные
    const existingRules = await ruleRepo.findAll();

    if (existingRules.length === 0) {
      logger.info("Creating initial rules...");
      for (const rule of rules) {
        await ruleRepo.create(rule);
      }
      logger.info(`Created ${rules.length} rules`);
    }

    logger.info("Database seeding completed (rules only)");
  } catch (error) {
    logger.error({ error: error as Error }, "Error seeding database");
    throw error;
  }
}
