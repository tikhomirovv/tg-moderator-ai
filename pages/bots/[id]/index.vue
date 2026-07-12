<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Bot Details</h2>
      <div class="flex gap-2">
        <button
          @click="showAddChatModal = true"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
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
          :to="`/bots/${botId}/rules`"
          class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
        >
          Rules
        </NuxtLink>
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

    <div v-else-if="bot" class="space-y-6">
      <!-- Основная информация -->
      <div class="bg-white border rounded p-6">
        <h3 class="text-lg font-medium mb-4">Bot Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot ID</label
            >
            <div class="text-lg">@{{ bot.id }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Name</label
            >
            <div class="text-lg">{{ bot.name }}</div>
          </div>
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
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="font-medium">{{ chat.name }}</div>
                <div class="text-sm text-gray-600">ID: {{ chat.chat_id }}</div>
                <div class="text-sm text-gray-600">
                  Rules: {{ chat.rules?.length || 0 }}
                </div>
                <div class="text-sm text-gray-600">
                  Silent Mode:
                  <span :class="getSilentModeClass(chat)">
                    {{ getSilentModeText(chat) }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
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
    </div>

    <div v-else class="text-gray-500">Bot not found</div>

    <!-- Modal для добавления/редактирования чата -->
    <div
      v-if="showAddChatModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ editingChat ? "Edit Chat" : "Add New Chat" }}
        </h3>

        <form @submit.prevent="saveChat" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Chat ID</label
            >
            <input
              v-model="newChat.chat_id"
              type="number"
              class="w-full border rounded px-3 py-2"
              placeholder="123456789"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              Numeric chat ID from Telegram
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Chat Name</label
            >
            <input
              v-model="newChat.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="My Chat"
              required
            />
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Rules</label
            >
            <div
              v-if="availableRules.length > 0"
              class="space-y-2 max-h-32 overflow-y-auto border rounded p-2"
            >
              <label
                v-for="rule in availableRules"
                :key="rule.id"
                class="flex items-center"
              >
                <input
                  v-model="newChat.rules"
                  :value="rule.id"
                  type="checkbox"
                  class="mr-2"
                />
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ rule.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ rule.description }}
                  </div>
                </div>
              </label>
            </div>
            <div v-else class="text-sm text-gray-500">
              No rules available.
              <NuxtLink
                :to="`/bots/${botId}/rules`"
                class="text-blue-600 hover:underline"
                >Create rules first</NuxtLink
              >
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="saving"
            >
              {{
                saving ? "Saving..." : editingChat ? "Update Chat" : "Add Chat"
              }}
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

const route = useRoute();
const botId = route.params.id as string;

const bot = ref<any>(null);
const loading = ref(false);
const showAddChatModal = ref(false);
const editingChat = ref<any>(null);
const saving = ref(false);
const availableRules = ref<any[]>([]);
const accessCode = ref<string | null>(null);
const teamMembers = ref<any[]>([]);
const teamLoading = ref(false);
const statusError = ref("");
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
  rules: [] as string[],
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
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    if (status !== 404) {
      console.error("Error loading bot:", error);
    }
  } finally {
    loading.value = false;
  }
}

async function loadRules() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/rules`);
    availableRules.value = resp?.data?.rules || [];
  } catch (error) {
    console.error("Error loading rules:", error);
  }
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
    rules: chat.rules || [],
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
    rules: [],
    silent_mode: false,
  };
}

async function saveChat() {
  saving.value = true;
  try {
    const chatData = {
      ...newChat.value,
      chat_id: parseInt(newChat.value.chat_id),
    };

    const updatedChats = [...(bot.value.chats || [])];

    if (editingChat.value) {
      // Обновляем существующий чат
      const index = updatedChats.findIndex(
        (c) => c.chat_id === editingChat.value.chat_id
      );
      if (index !== -1) {
        updatedChats[index] = chatData;
      }
    } else {
      // Добавляем новый чат
      updatedChats.push(chatData);
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

onMounted(async () => {
  await loadBot();
  await Promise.all([loadRules(), loadLogs(), loadStatistics(), loadTeam()]);
});
</script>
