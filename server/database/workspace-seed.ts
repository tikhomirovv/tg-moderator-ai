import { RuleRepository } from "./repositories/rule-repository";
import { logger } from "../core/logger";

const defaultRules = [
  {
    id: "spam",
    name: "Спам и реклама",
    description: "Запрещены повторяющиеся сообщения, реклама без разрешения",
    ai_prompt:
      "Спам, реклама. Критерии: повторяющиеся сообщения, коммерческая реклама без разрешения, массовые рассылки, флуд.",
    delete_on_violation: true,
    ban_on_violation: true,
    warnings_before_ban: 3,
  },
  {
    id: "hate_speech",
    name: "Ненавистнические высказывания",
    description: "Запрещены оскорбления, дискриминация, призывы к насилию",
    ai_prompt:
      "Ненавистнические высказывания, оскорбления, пассивная агрессия, дискриминация, призывы к насилию.",
    delete_on_violation: true,
    ban_on_violation: true,
    warnings_before_ban: 2,
  },
  {
    id: "advertising",
    name: "Реклама",
    description: "Коммерческая реклама без разрешения администрации",
    ai_prompt:
      "Коммерческая реклама товаров или услуг без явного разрешения администрации чата.",
    delete_on_violation: true,
    ban_on_violation: false,
    warnings_before_ban: null,
  },
  {
    id: "gaming_violations",
    name: "Нарушения в игровых чатах",
    description: "Спам в игровых командах, оскорбления игроков",
    ai_prompt:
      "Нарушения в игровых чатах: спам в командах, оскорбления игроков, раскрытие личной информации.",
    delete_on_violation: false,
    ban_on_violation: true,
    warnings_before_ban: 3,
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
