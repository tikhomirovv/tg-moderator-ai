import type { TelegramUser } from "../types/telegram";

export const DEFAULT_WARNING_TEMPLATE = `⚠️ <b>Предупреждение!</b>

Сообщение нарушает правила чата.
Нарушение: <b>{rule_name}</b>

Предупреждений: <b>{warnings_current}/{warnings_max}</b>
До блокировки: <b>{warnings_left}</b>

Пожалуйста, соблюдайте правила чата.`;

export const DEFAULT_BAN_TEMPLATE = `🚫 <b>Пользователь заблокирован!</b>

Нарушение правил чата.
Правило: <b>{rule_name}</b>`;

export type WarningTemplateContext = {
  user_mention: string;
  user_name: string;
  rule_name: string;
  warnings_current: string;
  warnings_max: string;
  warnings_left: string;
};

export type BanTemplateContext = {
  user_mention: string;
  user_name: string;
  rule_name: string;
};

type TemplateContext = WarningTemplateContext | BanTemplateContext;

export function resolveBotMessageTemplate(
  stored: string | null | undefined,
  fallback: string
): string {
  const trimmed = stored?.trim();
  return trimmed ? trimmed : fallback;
}

export function escapeTelegramHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildUserMention(
  from: Pick<TelegramUser, "id" | "first_name" | "username">
): string {
  const displayName = escapeTelegramHtml(
    from.first_name || from.username || String(from.id)
  );

  // Plain @username — Telegram parses as mention (ping, no profile preview).
  // tg://user?id= — same as picking a member without username in the client.
  if (from.username) {
    return `@${escapeTelegramHtml(from.username)}`;
  }

  return `<a href="tg://user?id=${from.id}">${displayName}</a>`;
}

export function buildUserName(
  from: Pick<TelegramUser, "id" | "first_name" | "username">
): string {
  return escapeTelegramHtml(
    from.first_name || from.username || String(from.id)
  );
}

function substitutePlaceholders(
  template: string,
  context: TemplateContext
): string {
  return template.replace(/\{([a-z_]+)\}/g, (match, key: string) => {
    if (key in context) {
      return context[key as keyof TemplateContext] ?? "";
    }
    return match;
  });
}

export function appendMentionIfMissing(
  template: string,
  rendered: string,
  mentionHtml: string
): string {
  if (template.includes("{user_mention}")) {
    return rendered;
  }
  return `${rendered}\n\n${mentionHtml}`;
}

/**
 * When {user_mention} is placed right after another placeholder (e.g.
 * `{rule_name}{user_mention}`), substitution glues mention to rule text.
 * Ensures a blank line before the mention block.
 */
export function ensureMentionOnOwnLine(
  rendered: string,
  mentionHtml: string
): string {
  if (!mentionHtml) {
    return rendered;
  }

  let result = rendered;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    const idx = result.indexOf(mentionHtml, searchFrom);
    if (idx === -1) {
      break;
    }

    if (idx > 0) {
      const charBefore = result[idx - 1];
      if (charBefore !== "\n" && charBefore !== " " && charBefore !== "\t") {
        result = `${result.slice(0, idx)}\n\n${result.slice(idx)}`;
        searchFrom = idx + 2 + mentionHtml.length;
        continue;
      }

      if (charBefore === "\n" && (idx < 2 || result[idx - 2] !== "\n")) {
        result = `${result.slice(0, idx)}\n${result.slice(idx)}`;
        searchFrom = idx + 1 + mentionHtml.length;
        continue;
      }
    }

    searchFrom = idx + mentionHtml.length;
  }

  return result;
}

export function renderBotMessage(
  template: string,
  context: TemplateContext
): string {
  const rendered = substitutePlaceholders(template, context);
  if ("user_mention" in context) {
    const withMention = appendMentionIfMissing(
      template,
      rendered,
      context.user_mention
    );
    return ensureMentionOnOwnLine(withMention, context.user_mention);
  }
  return rendered;
}

/** Omit reply_to when the violation message will be deleted. */
export function resolveModerationReplyToMessageId(
  telegramDelete: boolean,
  messageId: number
): number | undefined {
  return telegramDelete ? undefined : messageId;
}
