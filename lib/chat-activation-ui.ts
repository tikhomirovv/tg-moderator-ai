/** Shown in Add Chat modal — platform + Telegram preconditions. */
export const CHAT_ACTIVATION_PREREQUISITES = [
  "Войти на платформу тем же Telegram-аккаунтом, что пишет /activate.",
  "Вы — owner бота на платформе (не manager).",
  "Бот — администратор группы с правами удалять сообщения и ограничивать участников.",
  "Бот включён (Enable) — иначе webhook не обработает /activate.",
] as const;

export const CHAT_ACTIVATION_EXISTING_GROUP_HINT =
  "Откройте группу в Telegram и отправьте /activate (или /activate@имя_бота). " +
  "Бот ответит об успехе или ошибке; чат появится здесь после подключения.";

export const CHAT_ACTIVATION_NEW_GROUP_HINT =
  "Откроется Telegram для добавления бота в группу. " +
  "Если бот уже в нужной группе — выберите «Бот уже в группе».";

export const CHAT_ACTIVATION_POPUP_BLOCKED_MESSAGE =
  "Браузер заблокировал окно Telegram. Разрешите всплывающие окна или выберите «Бот уже в группе» и выполните /activate.";

export const CHAT_ACTIVATION_EXPIRED_MESSAGE =
  "Время ожидания истекло. Если бот уже в группе — выполните /activate там. Иначе попробуйте снова.";
