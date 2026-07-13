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

export const TELEGRAM_HTML_DOCS_URL =
  "https://core.telegram.org/bots/api#html-style";

export type BotMessageHtmlHelpSection = {
  title: string;
  body: string;
  example?: string;
};

/** Copy for the Telegram HTML help modal (RU product text). */
export const BOT_MESSAGE_HTML_HELP: BotMessageHtmlHelpSection[] = [
  {
    title: "Формат",
    body:
      "Сообщения Warning и Ban отправляются в Telegram с parse_mode HTML. " +
      "Используйте только поддерживаемые теги; вложенные теги не нужны.",
  },
  {
    title: "Поддерживаемые теги",
    body:
      "<b>жирный</b>, <i>курсив</i>, <u>подчёркнутый</u>, <s>зачёркнутый</s>, " +
      "<code>моноширинный</code>, <pre>блок кода</pre>, " +
      '<a href="https://example.com">ссылка</a>, <tg-spoiler>спойлер</tg-spoiler>.',
    example: "<b>Важно!</b> Нарушение: <i>{rule_name}</i>",
  },
  {
    title: "Плейсхолдеры",
    body:
      "Подставляются сервером: {user_mention}, {user_name}, {rule_name}, " +
      "{warnings_current}, {warnings_max}, {warnings_left} (только Warning). " +
      "Кнопки над полем вставляют их в курсор.",
  },
  {
    title: "Упоминание пользователя",
    body:
      "Если в шаблоне нет {user_mention}, бот допишет mention в конце отдельным абзацем. " +
      "Если ставите {user_mention} сами — оставьте пустую строку перед ним, " +
      "не пишите сразу после {rule_name}.",
  },
  {
    title: "Переносы строк",
    body:
      "Новая строка — символ перевода строки (Enter в поле). " +
      "Для пустой строки между блоками нажмите Enter дважды.",
  },
  {
    title: "Экранирование",
    body:
      "Символы <, > и & в обычном тексте должны быть &lt;, &gt;, &amp;. " +
      "В плейсхолдерах и готовых HTML-тегах экранировать не нужно.",
  },
  {
    title: "Длина",
    body: "Не больше 4096 символов на шаблон (лимит Telegram).",
  },
];
