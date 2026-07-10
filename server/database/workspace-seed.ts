import { RuleRepository } from "./repositories/rule-repository";
import { logger } from "../core/logger";

const defaultRules = [
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
    ai_prompt: `Определи, содержит ли сообщение ненавистнические высказывания, оскорбления, пассивную агрессию, дискриминацию или призывы к насилию.`,
    severity: "high" as const,
  },
  {
    id: "advertising",
    name: "Реклама",
    description: "Коммерческая реклама без разрешения администрации",
    ai_prompt: `Определи, содержит ли сообщение коммерческую рекламу товаров или услуг без явного разрешения администрации чата.`,
    severity: "medium" as const,
  },
  {
    id: "gaming_violations",
    name: "Нарушения в игровых чатах",
    description: "Спам в игровых командах, оскорбления игроков",
    ai_prompt: `Определи нарушения, специфичные для игровых чатов: спам в командах, оскорбления игроков, раскрытие личной информации.`,
    severity: "medium" as const,
  },
];

export async function seedWorkspaceRules(
  workspaceId: string,
  deps?: {
    ruleRepo?: Pick<RuleRepository, "findAll" | "create">;
  }
) {
  const ruleRepo = deps?.ruleRepo ?? new RuleRepository();
  const existingRules = await ruleRepo.findAll(workspaceId);

  if (existingRules.length > 0) {
    return;
  }

  logger.info({ workspaceId }, "Creating initial workspace rules");
  for (const rule of defaultRules) {
    await ruleRepo.create(workspaceId, rule);
  }
}
