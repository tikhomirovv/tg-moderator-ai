export const WARNING_TEMPLATE_PLACEHOLDERS = [
  { key: "{user_mention}", label: "Mention", hint: "Ping user (@username or name link)" },
  { key: "{user_name}", label: "Name", hint: "Display name without ping" },
  { key: "{rule_name}", label: "Rule", hint: "Violated rule name" },
  { key: "{warnings_current}", label: "Warn #", hint: "Warning number after this warn" },
  { key: "{warnings_max}", label: "Max warns", hint: "Threshold before ban" },
  { key: "{warnings_left}", label: "Left", hint: "Warnings left before ban" },
] as const;

export const BAN_TEMPLATE_PLACEHOLDERS = [
  { key: "{user_mention}", label: "Mention", hint: "Ping user (@username or name link)" },
  { key: "{user_name}", label: "Name", hint: "Display name without ping" },
  { key: "{rule_name}", label: "Rule", hint: "Violated rule name" },
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
