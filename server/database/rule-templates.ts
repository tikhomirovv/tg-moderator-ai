import { RuleRepository } from "./repositories/rule-repository";
import { logger } from "../core/logger";

export const RULE_TEMPLATES = [
  {
    name: "Спам и реклама",
    description: "Запрещены повторяющиеся сообщения, реклама без разрешения",
    ai_prompt:
      "Спам, реклама. Критерии: повторяющиеся сообщения, коммерческая реклама без разрешения, массовые рассылки, флуд.",
    delete_on_violation: true,
    ban_on_violation: true,
    warnings_before_ban: 3,
  },
  {
    name: "Ненавистнические высказывания",
    description: "Запрещены оскорбления, дискриминация, призывы к насилию",
    ai_prompt:
      "Ненавистнические высказывания, оскорбления, пассивная агрессия, дискриминация, призывы к насилию.",
    delete_on_violation: true,
    ban_on_violation: true,
    warnings_before_ban: 2,
  },
  {
    name: "Реклама",
    description: "Коммерческая реклама без разрешения администрации",
    ai_prompt:
      "Коммерческая реклама товаров или услуг без явного разрешения администрации чата.",
    delete_on_violation: true,
    ban_on_violation: false,
    warnings_before_ban: null,
  },
  {
    name: "Нарушения в игровых чатах",
    description: "Спам в игровых командах, оскорбления игроков",
    ai_prompt:
      "Нарушения в игровых чатах: спам в командах, оскорбления игроков, раскрытие личной информации.",
    delete_on_violation: false,
    ban_on_violation: true,
    warnings_before_ban: 3,
  },
] as const;

export async function applyTemplateToBot(
  botId: string,
  deps?: {
    ruleRepo?: Pick<RuleRepository, "create">;
  }
) {
  const ruleRepo = deps?.ruleRepo ?? new RuleRepository();
  logger.info({ botId }, "Applying rule templates to bot");

  for (const rule of RULE_TEMPLATES) {
    await ruleRepo.create(botId, rule);
  }
}
