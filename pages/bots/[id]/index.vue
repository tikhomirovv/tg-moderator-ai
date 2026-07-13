<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Bot Details</h2>
      <div class="flex gap-2">
        <button
          v-if="isOwner"
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          :disabled="chatActivation.status.value === 'waiting'"
          @click="startChatActivation"
        >
          Add Chat
        </button>
        <button
          @click="toggleBotStatus"
          :class="
            bot?.is_active
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          "
          class="px-3 py-2 text-white rounded text-sm"
        >
          {{ bot?.is_active ? "Disable" : "Enable" }}
        </button>
        <NuxtLink
          :to="`/bots/${botId}/audit`"
          class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
        >
          Audit
        </NuxtLink>
        <NuxtLink
          to="/bots"
          class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
        >
          Back
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-gray-500">Loading...</div>

    <template v-else>
      <div
        v-if="chatActivation.status.value !== 'idle'"
        class="mb-4 rounded border p-4 text-sm"
        :class="activationBannerClass"
      >
        <p>{{ chatActivation.message.value }}</p>
        <button
          v-if="chatActivation.status.value === 'failed' || chatActivation.status.value === 'expired'"
          type="button"
          class="mt-2 text-blue-700 hover:underline"
          @click="retryChatActivation"
        >
          Попробовать снова
        </button>
      </div>

      <div v-if="bot" class="space-y-6">
      <!-- Основная информация -->
      <div class="bg-white border rounded p-6">
        <h3 class="text-lg font-medium mb-4">Bot Information</h3>
        <div class="flex items-start gap-4 mb-4">
          <img
            v-if="bot.photo_file_id"
            :src="botPhotoUrl(botId)"
            :alt="bot.name"
            class="h-16 w-16 rounded-full object-cover bg-gray-100 shrink-0"
          />
          <div
            v-else
            class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500 shrink-0"
          >
            {{ botInitials(bot.name) }}
          </div>
          <div class="min-w-0">
            <div class="text-lg font-medium">{{ bot.name }}</div>
            <div class="text-sm text-gray-600">@{{ bot.id }}</div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Status</label
            >
            <div class="text-sm">
              <span :class="aggregatedStatusClass">{{ aggregatedStatusText }}</span>
            </div>
            <p v-if="deliveryProblemMessage" class="text-sm text-red-600 mt-1">
              {{ deliveryProblemMessage }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Created</label
            >
            <div class="text-sm text-gray-600">
              {{ formatDate(bot.created_at) }}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border rounded p-6">
        <h3 class="text-lg font-medium mb-2">Moderation messages</h3>
        <p class="text-sm text-gray-600 mb-4">
          Per-bot Warning and Ban texts (Telegram HTML). If
          <code class="text-xs">{user_mention}</code>
          is missing from the template, a mention is appended automatically.
        </p>

        <div class="flex gap-2 mb-4 border-b">
          <button
            type="button"
            class="px-3 py-2 text-sm border-b-2 -mb-px"
            :class="
              messageTemplateTab === 'warning'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="messageTemplateTab = 'warning'"
          >
            Warning
          </button>
          <button
            type="button"
            class="px-3 py-2 text-sm border-b-2 -mb-px"
            :class="
              messageTemplateTab === 'ban'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="messageTemplateTab = 'ban'"
          >
            Ban
          </button>
        </div>

        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="chip in activeTemplateChips"
            :key="chip.key"
            type="button"
            class="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
            :title="chip.hint"
            @click="insertTemplatePlaceholder(chip.key)"
          >
            {{ chip.label }}
          </button>
        </div>

        <textarea
          ref="templateTextareaRef"
          v-model="activeTemplateDraft"
          rows="8"
          class="w-full border rounded px-3 py-2 font-mono text-sm"
        />

        <p v-if="templateSaveError" class="text-sm text-red-600 mt-2">
          {{ templateSaveError }}
        </p>
        <p v-if="templateSaveSuccess" class="text-sm text-green-600 mt-2">
          Templates saved.
        </p>

        <div class="flex gap-2 mt-4">
          <button
            type="button"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            :disabled="savingTemplates"
            @click="saveMessageTemplates"
          >
            {{ savingTemplates ? "Saving..." : "Save" }}
          </button>
          <button
            type="button"
            class="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            :disabled="savingTemplates"
            @click="resetAndSaveMessageTemplates"
          >
            Reset to default
          </button>
        </div>
      </div>

      <div class="bg-white border rounded p-6">
        <h3 class="text-lg font-medium mb-4">Team Access</h3>
        <div v-if="teamLoading" class="text-gray-500 text-sm">Loading team...</div>
        <div v-else class="space-y-4">
          <div v-if="isOwner && accessCode" class="flex flex-wrap items-center gap-3">
            <div class="text-sm">
              Access code:
              <code class="bg-gray-100 px-2 py-1 rounded">{{ accessCode }}</code>
            </div>
            <button
              type="button"
              class="text-sm text-blue-600 hover:underline"
              @click="copyAccessCode"
            >
              Copy
            </button>
            <button
              type="button"
              class="text-sm text-red-600 hover:underline"
              @click="revokeAccessCode"
            >
              Revoke
            </button>
          </div>
          <p v-else-if="isOwner" class="text-sm text-gray-500">
            Access code is available to bot owners.
          </p>
          <p v-else class="text-sm text-gray-500">
            Access codes are managed by the bot owner.
          </p>

          <div v-if="teamMembers.length" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700">Members</h4>
            <div
              v-for="member in teamMembers"
              :key="member.user_id"
              class="flex items-center justify-between text-sm border rounded px-3 py-2"
            >
              <div>
                <span class="font-medium">
                  {{ member.username ? `@${member.username}` : member.name }}
                </span>
                <span class="text-gray-500 ml-2">{{ member.role }}</span>
              </div>
              <button
                v-if="isOwner && member.role === 'manager'"
                type="button"
                class="text-red-600 hover:underline"
                @click="removeMember(member.user_id)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Чаты -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">
            Chats ({{ bot.chats?.length || 0 }})
          </h3>
        </div>
        <div v-if="bot.chats && bot.chats.length > 0" class="space-y-3">
          <div
            v-for="chat in bot.chats"
            :key="chat.chat_id"
            class="border rounded p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <img
                  v-if="chat.id && chat.photo_file_id"
                  :src="chatPhotoUrl(chat.id)"
                  :alt="chat.name"
                  class="h-10 w-10 rounded-full object-cover bg-gray-100"
                />
                <div
                  v-else
                  class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                >
                  TG
                </div>
                <div class="min-w-0">
                  <div class="font-medium truncate">{{ chat.name }}</div>
                  <div class="text-sm text-gray-600">ID: {{ chat.chat_id }}</div>
                  <div class="text-sm text-gray-600">
                    Rules: {{ chat.rules_count || 0 }}
                  </div>
                  <div class="text-sm text-gray-600">
                    Silent Mode:
                    <span :class="getSilentModeClass(chat)">
                      {{ getSilentModeText(chat) }}
                    </span>
                  </div>
                  <div class="mt-1">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                      :class="chatHealthBadgeClass(chat)"
                    >
                      {{ chatHealthLabel(chat) }}
                    </span>
                    <p
                      v-if="chat.health_message && chat.health_status !== 'ok'"
                      class="text-xs text-red-600 mt-1"
                    >
                      {{ chat.health_message }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <NuxtLink
                  :to="`/bots/${botId}/chats/${chat.chat_id}/moderation`"
                  class="text-green-700 text-sm hover:underline"
                >
                  Moderation
                </NuxtLink>
                <button
                  @click="editChat(chat)"
                  class="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  @click="removeChat(chat.chat_id)"
                  class="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500">No chats configured</div>
      </div>

      <!-- Статистика -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Statistics</h3>
          <button
            @click="loadStatistics"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ statistics?.today?.messages_processed || 0 }}
            </div>
            <div class="text-sm text-gray-600">Messages Processed (Today)</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-600">
              {{ statistics?.today?.warnings_issued || 0 }}
            </div>
            <div class="text-sm text-gray-600">Warnings Issued (Today)</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">
              {{ statistics?.users?.banned_count || 0 }}
            </div>
            <div class="text-sm text-gray-600">Users Banned (Total)</div>
          </div>
        </div>

        <!-- Дополнительная статистика -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 rounded p-4">
            <h4 class="font-medium text-gray-700 mb-2">This Week</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Total Messages:</span>
                <span class="font-medium">{{
                  statistics?.week?.total_messages_processed || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Total Warnings:</span>
                <span class="font-medium">{{
                  statistics?.week?.total_warnings_issued || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Messages Deleted:</span>
                <span class="font-medium">{{
                  statistics?.week?.total_messages_deleted || 0
                }}</span>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 rounded p-4">
            <h4 class="font-medium text-gray-700 mb-2">Users</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Active (24h):</span>
                <span class="font-medium text-green-600">{{
                  statistics?.users?.active_count || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Banned:</span>
                <span class="font-medium text-red-600">{{
                  statistics?.users?.banned_count || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Max Unique:</span>
                <span class="font-medium">{{
                  statistics?.week?.max_unique_users || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Recent Activity</h3>
          <div class="flex gap-2">
            <NuxtLink
              :to="`/bots/${botId}/audit`"
              class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Audit
            </NuxtLink>
            <button
              @click="loadLogs"
              class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
        <div v-if="logs.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="log in logs"
            :key="log.id"
            class="border rounded p-2 text-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium">{{ log.action }}</span>
                <span class="text-gray-600"> - {{ log.message }}</span>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(log.timestamp) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-4">
          No recent activity. Send messages to the bot to see logs here.
        </div>
      </div>

      <div v-if="isOwner" class="bg-white border border-red-200 rounded p-6">
        <h3 class="text-lg font-medium text-red-700 mb-2">Danger zone</h3>
        <p class="text-sm text-gray-600 mb-4">
          Удаление бота безвозвратно удалит чаты, правила, участников команды и
          историю модерации. Отключение бота (Disable) данные не удаляет.
        </p>

        <div v-if="!showDeleteConfirm" class="flex">
          <button
            type="button"
            class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            @click="openDeleteConfirm"
          >
            Удалить бота
          </button>
        </div>

        <div v-else class="space-y-3 max-w-md">
          <p class="text-sm text-gray-700">
            Введите <code class="bg-gray-100 px-1 rounded">@{{ bot.id }}</code> или
            <code class="bg-gray-100 px-1 rounded">DELETE</code> для подтверждения.
          </p>
          <input
            v-model="deleteConfirmText"
            type="text"
            class="w-full border rounded px-3 py-2 text-sm"
            :placeholder="`@${bot.id}`"
          />
          <p v-if="deleteError" class="text-sm text-red-600">{{ deleteError }}</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
              :disabled="!canConfirmDelete || deletingBot"
              @click="deleteBot"
            >
              {{ deletingBot ? "Удаление..." : "Подтвердить удаление" }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
              :disabled="deletingBot"
              @click="cancelDeleteConfirm"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>

      <div v-else class="text-gray-500">Bot not found</div>
    </template>

    <!-- Modal for chat silent mode -->
    <div
      v-if="showAddChatModal && editingChat"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">Edit Chat</h3>

        <form @submit.prevent="saveChat" class="space-y-4">
          <div class="text-sm text-gray-600">
            <div class="font-medium">{{ editingChat?.name }}</div>
            <div>ID: {{ editingChat?.chat_id }}</div>
          </div>

          <!-- Silent mode: DB logging only, no Telegram side effects -->
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-700 mb-3">Silent Mode</h4>

            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  v-model="newChat.silent_mode"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm font-medium text-gray-700"
                  >Enable Silent Mode</span
                >
              </label>
            </div>

            <div class="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p class="font-medium mb-1">Silent Mode:</p>
              <p>
                • <strong>Enabled:</strong> violations logged to DB only — no
                Telegram delete, ban, or warning messages
              </p>
              <p>
                • <strong>Disabled:</strong> per-rule actions apply (delete,
                warn, ban as configured on each rule)
              </p>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="saving"
            >
              {{ saving ? "Saving..." : "Update Chat" }}
            </button>
            <button
              type="button"
              @click="closeChatModal"
              class="px-3 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  BAN_TEMPLATE_PLACEHOLDERS,
  DEFAULT_BAN_TEMPLATE_PREVIEW,
  DEFAULT_WARNING_TEMPLATE_PREVIEW,
  WARNING_TEMPLATE_PLACEHOLDERS,
} from "~/lib/bot-message-template-ui";

const route = useRoute();
const router = useRouter();
const botId = route.params.id as string;

const bot = ref<any>(null);

usePageTitle(() => bot.value?.name ?? "Бот");

const chatActivation = useChatActivationWait({
  botId,
  botUsername: botId,
  onCompleted: async () => {
    await loadBot();
    chatActivation.reset();
  },
});
const loading = ref(false);
const showAddChatModal = ref(false);
const editingChat = ref<any>(null);
const saving = ref(false);
const accessCode = ref<string | null>(null);
const teamMembers = ref<any[]>([]);
const teamLoading = ref(false);
const statusError = ref("");
const messageTemplateTab = ref<"warning" | "ban">("warning");
const warningTemplateDraft = ref("");
const banTemplateDraft = ref("");
const templateTextareaRef = ref<HTMLTextAreaElement | null>(null);
const savingTemplates = ref(false);
const templateSaveError = ref("");
const templateSaveSuccess = ref(false);
const showDeleteConfirm = ref(false);
const deleteConfirmText = ref("");
const deleteError = ref("");
const deletingBot = ref(false);
const logs = ref<any[]>([]);
const statistics = ref<any>({
  today: {
    messages_processed: 0,
    warnings_issued: 0,
    messages_deleted: 0,
    users_banned: 0,
    unique_users: 0,
  },
  week: {
    total_messages_processed: 0,
    total_warnings_issued: 0,
    total_messages_deleted: 0,
    total_users_banned: 0,
    max_unique_users: 0,
    days_count: 0,
  },
  users: {
    banned_count: 0,
    active_count: 0,
  },
});

const newChat = ref({
  chat_id: "",
  name: "",
  silent_mode: false,
});

const aggregatedStatusText = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") return "Working";
  if (status === "disabled") return "Disabled";
  if (status === "degraded" || status === "unavailable") return "Problem";
  return "Unknown";
});

const aggregatedStatusClass = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") {
    return "text-green-600";
  }
  if (status === "disabled") {
    return "text-gray-600";
  }
  return "text-red-600";
});

const isOwner = computed(() => bot.value?.my_role === "owner");

const canConfirmDelete = computed(() => {
  const value = deleteConfirmText.value.trim();
  if (!bot.value) return false;
  return value === "DELETE" || value === `@${bot.value.id}` || value === bot.value.id;
});

const activationBannerClass = computed(() => {
  const value = chatActivation.status.value;
  if (value === "waiting") return "border-blue-200 bg-blue-50 text-blue-900";
  if (value === "completed") return "border-green-200 bg-green-50 text-green-900";
  return "border-red-200 bg-red-50 text-red-900";
});

const activeTemplateChips = computed(() =>
  messageTemplateTab.value === "warning"
    ? WARNING_TEMPLATE_PLACEHOLDERS
    : BAN_TEMPLATE_PLACEHOLDERS
);

const activeTemplateDraft = computed({
  get() {
    return messageTemplateTab.value === "warning"
      ? warningTemplateDraft.value
      : banTemplateDraft.value;
  },
  set(value: string) {
    if (messageTemplateTab.value === "warning") {
      warningTemplateDraft.value = value;
    } else {
      banTemplateDraft.value = value;
    }
  },
});

const { insertAtCursor: insertTemplatePlaceholder } = useTemplateInsert(
  templateTextareaRef,
  activeTemplateDraft
);

const deliveryProblemMessage = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "degraded" || status === "unavailable") {
    return bot.value?.delivery_message;
  }
  return "";
});

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadBot() {
  loading.value = true;
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`);
    bot.value = resp?.data;
    syncMessageTemplateDrafts();
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    if (status !== 404) {
      console.error("Error loading bot:", error);
    }
  } finally {
    loading.value = false;
  }
}

function syncMessageTemplateDrafts() {
  warningTemplateDraft.value =
    bot.value?.warning_message_template ?? DEFAULT_WARNING_TEMPLATE_PREVIEW;
  banTemplateDraft.value =
    bot.value?.ban_message_template ?? DEFAULT_BAN_TEMPLATE_PREVIEW;
}

async function saveMessageTemplates() {
  savingTemplates.value = true;
  templateSaveError.value = "";
  templateSaveSuccess.value = false;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: {
        warning_message_template: warningTemplateDraft.value.trim() || null,
        ban_message_template: banTemplateDraft.value.trim() || null,
      },
    });

    if (resp?.data) {
      bot.value = resp.data;
      syncMessageTemplateDrafts();
    }
    templateSaveSuccess.value = true;
  } catch (error: any) {
    templateSaveError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Failed to save message templates";
  } finally {
    savingTemplates.value = false;
  }
}

function resetMessageTemplates() {
  warningTemplateDraft.value = DEFAULT_WARNING_TEMPLATE_PREVIEW;
  banTemplateDraft.value = DEFAULT_BAN_TEMPLATE_PREVIEW;
}

async function resetAndSaveMessageTemplates() {
  resetMessageTemplates();
  savingTemplates.value = true;
  templateSaveError.value = "";
  templateSaveSuccess.value = false;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: {
        warning_message_template: null,
        ban_message_template: null,
      },
    });

    if (resp?.data) {
      bot.value = resp.data;
      syncMessageTemplateDrafts();
    }
    templateSaveSuccess.value = true;
  } catch (error: any) {
    templateSaveError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Failed to reset message templates";
  } finally {
    savingTemplates.value = false;
  }
}

async function startChatActivation() {
  try {
    await chatActivation.start();
  } catch (error: any) {
    chatActivation.status.value = "failed";
    chatActivation.message.value =
      error?.data?.statusMessage || error?.message || "Failed to start chat activation";
  }
}

function retryChatActivation() {
  chatActivation.reset();
  void startChatActivation();
}

function chatPhotoUrl(chatRowId: number) {
  return `/api/bots/${botId}/chats/row/${chatRowId}/photo`;
}

function botPhotoUrl(id: string) {
  return `/api/bots/${id}/photo`;
}

function botInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "B").toUpperCase();
}

function chatHealthLabel(chat: any) {
  if (chat.health_status === "ok") return "Готов";
  if (chat.health_status === "degraded") return "Внимание";
  if (chat.health_status === "unhealthy") return "Не работает";
  return "Неизвестно";
}

function chatHealthBadgeClass(chat: any) {
  if (chat.health_status === "ok") return "bg-green-100 text-green-800";
  if (chat.health_status === "degraded") return "bg-yellow-100 text-yellow-800";
  if (chat.health_status === "unhealthy") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

async function toggleBotStatus() {
  if (!bot.value) return;

  statusError.value = "";

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { is_active: !bot.value.is_active },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error: any) {
    statusError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Failed to update bot status";
    console.error("Error updating bot status:", error);
  }
}

async function loadStatistics() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/statistics`);
    if (resp?.data?.statistics) {
      statistics.value = resp.data.statistics;
    }
  } catch (error) {
    console.error("Error loading statistics:", error);
    // При ошибке оставляем дефолтные значения
  }
}

function editChat(chat: any) {
  editingChat.value = chat;
  newChat.value = {
    chat_id: chat.chat_id,
    name: chat.name,
    silent_mode: chat.silent_mode,
  };
  showAddChatModal.value = true;
}

function closeChatModal() {
  showAddChatModal.value = false;
  editingChat.value = null;
  newChat.value = {
    chat_id: "",
    name: "",
    silent_mode: false,
  };
}

async function saveChat() {
  if (!editingChat.value) return;

  saving.value = true;
  try {
    const updatedChats = [...(bot.value.chats || [])];
    const index = updatedChats.findIndex(
      (c) => c.chat_id === editingChat.value.chat_id
    );
    if (index !== -1) {
      updatedChats[index] = {
        ...updatedChats[index],
        silent_mode: newChat.value.silent_mode,
      };
    }

    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { chats: updatedChats },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }

    closeChatModal();
  } catch (error) {
    console.error("Error saving chat:", error);
  } finally {
    saving.value = false;
  }
}

async function removeChat(chatId: number) {
  if (!confirm("Are you sure you want to remove this chat?")) return;

  try {
    const updatedChats = bot.value.chats.filter(
      (c: any) => c.chat_id !== chatId
    );

    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { chats: updatedChats },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error) {
    console.error("Error removing chat:", error);
  }
}

async function loadLogs() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/logs`);
    logs.value = resp?.data?.logs || [];
  } catch (error) {
    console.error("Error loading logs:", error);
  }
}

function getSilentModeClass(chat: any) {
  if (chat.silent_mode) {
    return "text-gray-600"; // Monitor only
  } else {
    return "text-green-600"; // Full moderation
  }
}

function getSilentModeText(chat: any) {
  if (chat.silent_mode) {
    return "Monitor Only";
  } else {
    return "Full Moderation";
  }
}

async function loadTeam() {
  teamLoading.value = true;
  try {
    const [codeResp, membersResp] = await Promise.all([
      $fetch<any>(`/api/bots/${botId}/team/access-code`).catch(() => null),
      $fetch<any>(`/api/bots/${botId}/team/members`),
    ]);
    accessCode.value = codeResp?.data?.code ?? null;
    teamMembers.value = membersResp?.data?.members ?? [];
  } catch (error) {
    console.error("Error loading team:", error);
  } finally {
    teamLoading.value = false;
  }
}

async function copyAccessCode() {
  if (!accessCode.value) return;
  await navigator.clipboard.writeText(accessCode.value);
}

async function revokeAccessCode() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/team/access-code/revoke`, {
      method: "POST",
      body: {},
    });
    accessCode.value = resp?.data?.code ?? null;
  } catch (error) {
    console.error("Error revoking access code:", error);
  }
}

async function removeMember(userId: string) {
  try {
    await $fetch(`/api/bots/${botId}/team/members/${userId}`, {
      method: "DELETE",
    });
    await loadTeam();
  } catch (error) {
    console.error("Error removing member:", error);
  }
}

function openDeleteConfirm() {
  deleteError.value = "";
  deleteConfirmText.value = "";
  showDeleteConfirm.value = true;
}

function cancelDeleteConfirm() {
  showDeleteConfirm.value = false;
  deleteConfirmText.value = "";
  deleteError.value = "";
}

async function deleteBot() {
  if (!canConfirmDelete.value) return;

  deletingBot.value = true;
  deleteError.value = "";

  try {
    await $fetch(`/api/bots/${botId}`, { method: "DELETE" });
    await router.push("/bots");
  } catch (error: any) {
    deleteError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Не удалось удалить бота";
  } finally {
    deletingBot.value = false;
  }
}

onMounted(async () => {
  await loadBot();
  await Promise.all([loadLogs(), loadStatistics(), loadTeam()]);
});
</script>
