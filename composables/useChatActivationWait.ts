import { onBeforeUnmount, ref } from "vue";

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 3 * 60 * 1000;

export type ChatActivationWaitStatus =
  | "idle"
  | "waiting"
  | "completed"
  | "failed"
  | "expired";

export type ChatActivationStartMode = "new_group" | "existing_group";

type PendingPollResponse = {
  status: "waiting" | "completed" | "failed" | "expired";
  pending_id: number;
  expires_at: string;
  chat?: unknown;
  error?: { code: string; message: string };
};

type UseChatActivationWaitOptions = {
  botId: string;
  botUsername: string;
  onCompleted?: () => void | Promise<void>;
};

export function useChatActivationWait(options: UseChatActivationWaitOptions) {
  const { t } = useI18n();

  const status = ref<ChatActivationWaitStatus>("idle");
  const message = ref("");
  const pendingId = ref<number | null>(null);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let stopAt = 0;

  function clearPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  async function pollOnce() {
    if (!pendingId.value) return;

    if (Date.now() >= stopAt) {
      status.value = "expired";
      message.value = t("chatActivation.expiredMessage");
      clearPolling();
      return;
    }

    try {
      const resp = await $fetch<{ data: PendingPollResponse }>(
        `/api/bots/${options.botId}/chats/pending/${pendingId.value}`
      );
      const data = resp.data;

      if (data.status === "completed") {
        status.value = "completed";
        message.value = t("chatActivation.completed");
        clearPolling();
        await options.onCompleted?.();
        return;
      }

      if (data.status === "failed") {
        status.value = "failed";
        message.value = data.error?.message ?? t("chatActivation.failedDefault");
        clearPolling();
        return;
      }

      if (data.status === "expired") {
        status.value = "expired";
        message.value = t("chatActivation.expiredMessage");
        clearPolling();
      }
    } catch {
      // Keep polling on transient errors.
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible" && status.value === "waiting") {
      void pollOnce();
    }
  }

  function startPolling() {
    clearPolling();
    stopAt = Date.now() + MAX_WAIT_MS;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void pollOnce();
    pollTimer = setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);
  }

  async function start(mode: ChatActivationStartMode = "new_group") {
    status.value = "waiting";
    message.value =
      mode === "existing_group"
        ? t("chatActivation.existingGroupHint")
        : t("chatActivation.newGroupHint");
    pendingId.value = null;

    const resp = await $fetch<{
      data: { pending_id: number; expires_at: string };
    }>(`/api/bots/${options.botId}/chats/pending`, {
      method: "POST",
      body: {},
    });

    pendingId.value = resp.data.pending_id;

    if (mode === "new_group") {
      const deepLink = `https://t.me/${options.botUsername}?startgroup&admin=delete_messages+restrict_members`;
      const popup = window.open(deepLink, "_blank", "noopener,noreferrer");
      if (!popup) {
        status.value = "failed";
        message.value = t("chatActivation.popupBlockedMessage");
        clearPolling();
        return;
      }
    }

    startPolling();
  }

  function reset() {
    clearPolling();
    status.value = "idle";
    message.value = "";
    pendingId.value = null;
  }

  onBeforeUnmount(() => {
    clearPolling();
  });

  return {
    status,
    message,
    pendingId,
    start,
    reset,
    isWaiting: () => status.value === "waiting",
  };
}
