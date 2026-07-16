import {
  isModerationActionType,
  moderationActionColorClass,
  moderationActionI18nKey,
  type ModerationActionType,
} from "~/lib/moderation-action-ui";

export function useModerationActionDisplay() {
  const { t } = useI18n();

  function actionLabel(action: string): string {
    if (!isModerationActionType(action)) {
      return action;
    }
    return t(moderationActionI18nKey(action));
  }

  function actionClass(action: string): string {
    if (!isModerationActionType(action)) {
      return "text-gray-700";
    }
    return moderationActionColorClass(action);
  }

  return {
    actionLabel,
    actionClass,
    isModerationActionType,
  };
}

export type { ModerationActionType };
