export const WARNING_TEMPLATE_PLACEHOLDERS = [
  {
    key: "{user_mention}",
    labelKey: "botTemplate.placeholders.warning.userMention.label",
    hintKey: "botTemplate.placeholders.warning.userMention.hint",
  },
  {
    key: "{user_name}",
    labelKey: "botTemplate.placeholders.warning.userName.label",
    hintKey: "botTemplate.placeholders.warning.userName.hint",
  },
  {
    key: "{rule_name}",
    labelKey: "botTemplate.placeholders.warning.ruleName.label",
    hintKey: "botTemplate.placeholders.warning.ruleName.hint",
  },
  {
    key: "{warnings_current}",
    labelKey: "botTemplate.placeholders.warning.warningsCurrent.label",
    hintKey: "botTemplate.placeholders.warning.warningsCurrent.hint",
  },
  {
    key: "{warnings_max}",
    labelKey: "botTemplate.placeholders.warning.warningsMax.label",
    hintKey: "botTemplate.placeholders.warning.warningsMax.hint",
  },
  {
    key: "{warnings_left}",
    labelKey: "botTemplate.placeholders.warning.warningsLeft.label",
    hintKey: "botTemplate.placeholders.warning.warningsLeft.hint",
  },
] as const;

export const BAN_TEMPLATE_PLACEHOLDERS = [
  {
    key: "{user_mention}",
    labelKey: "botTemplate.placeholders.ban.userMention.label",
    hintKey: "botTemplate.placeholders.ban.userMention.hint",
  },
  {
    key: "{user_name}",
    labelKey: "botTemplate.placeholders.ban.userName.label",
    hintKey: "botTemplate.placeholders.ban.userName.hint",
  },
  {
    key: "{rule_name}",
    labelKey: "botTemplate.placeholders.ban.ruleName.label",
    hintKey: "botTemplate.placeholders.ban.ruleName.hint",
  },
] as const;

export const DEFAULT_WARNING_TEMPLATE_PREVIEW = `⚠️ <b>Предупреждение!</b>

Сообщение нарушает правила чата.
Нарушение: <b>{rule_name}</b>

Предупреждений: <b>{warnings_current}/{warnings_max}</b>
До блокировки: <b>{warnings_left}</b>

Пожалуйста, соблюдайте правила чата.`;

export const DEFAULT_BAN_TEMPLATE_PREVIEW = `🚫 <b>Пользователь заблокирован!</b>

Нарушение правил чата.
Правило: <b>{rule_name}</b>`;

export const TELEGRAM_HTML_DOCS_URL =
  "https://core.telegram.org/bots/api#html-style";
