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
              <span :class="bot.is_active ? 'text-green-600' : 'text-red-600'">
                {{ bot.is_active ? "Active" : "Inactive" }}
              </span>
            </div>
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
                  Rules: {{ chat.rules?.length || 0 }}, Warnings:
                  {{ chat.warnings_before_ban }}, Auto-delete:
                  {{ chat.auto_delete_violations ? "Yes" : "No" }}
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
        <h3 class="text-lg font-medium mb-4">Statistics</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">0</div>
            <div class="text-sm text-gray-600">Messages Processed</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-600">0</div>
            <div class="text-sm text-gray-600">Warnings Issued</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">0</div>
            <div class="text-sm text-gray-600">Users Banned</div>
          </div>
        </div>
      </div>

      <!-- Webhook Status -->
      <div class="bg-white border rounded p-6">
        <h3 class="text-lg font-medium mb-4">Webhook Status</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Status</div>
              <div class="text-sm text-gray-600">
                <span
                  :class="
                    webhookStatus?.active ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ webhookStatus?.active ? "Active" : "Inactive" }}
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="startWebhook"
                :disabled="webhookStatus?.active || webhookLoading"
                class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {{ webhookLoading ? "Starting..." : "Start Webhook" }}
              </button>
              <button
                @click="stopWebhook"
                :disabled="!webhookStatus?.active || webhookLoading"
                class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
              >
                {{ webhookLoading ? "Stopping..." : "Stop Webhook" }}
              </button>
            </div>
          </div>

          <div v-if="webhookStatus?.url">
            <div class="font-medium">Webhook URL</div>
            <div class="text-sm text-gray-600 break-all">
              {{ webhookStatus.url }}
            </div>
          </div>

          <div v-if="webhookStatus?.last_update">
            <div class="font-medium">Last Update</div>
            <div class="text-sm text-gray-600">
              {{ formatDate(webhookStatus.last_update) }}
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded p-3">
            <div class="text-sm text-blue-800">
              <strong>How to test:</strong>
              <ol class="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Start Webhook" to enable receiving updates</li>
                <li>Send a message to your bot in Telegram</li>
                <li>Check the logs below for moderation activity</li>
                <li>Your bot will analyze messages using AI rules</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Recent Activity</h3>
          <button
            @click="loadLogs"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
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
          No recent activity. Start webhook and send messages to see logs.
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Warnings Before Ban</label
            >
            <input
              v-model="newChat.warnings_before_ban"
              type="number"
              min="1"
              max="10"
              class="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label class="flex items-center">
              <input
                v-model="newChat.auto_delete_violations"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm font-medium text-gray-700"
                >Auto-delete violations</span
              >
            </label>
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
              <NuxtLink to="/config/rules" class="text-blue-600 hover:underline"
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
import { ref, onMounted } from "vue";

const route = useRoute();
const botId = route.params.id as string;

const bot = ref<any>(null);
const loading = ref(false);
const showAddChatModal = ref(false);
const editingChat = ref<any>(null);
const saving = ref(false);
const availableRules = ref<any[]>([]);
const webhookStatus = ref<any>(null);
const webhookLoading = ref(false);
const logs = ref<any[]>([]);

const newChat = ref({
  chat_id: "",
  name: "",
  warnings_before_ban: 3,
  auto_delete_violations: true,
  rules: [],
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
  } catch (error) {
    console.error("Error loading bot:", error);
  } finally {
    loading.value = false;
  }
}

async function loadRules() {
  try {
    const resp = await $fetch<any>("/api/config/rules");
    availableRules.value = resp?.data?.rules || [];
  } catch (error) {
    console.error("Error loading rules:", error);
  }
}

async function loadWebhookStatus() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/webhook/status`);
    webhookStatus.value = resp?.data;
  } catch (error) {
    console.error("Error loading webhook status:", error);
  }
}

async function startWebhook() {
  webhookLoading.value = true;
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/webhook/start`, {
      method: "POST",
    });
    if (resp?.data) {
      webhookStatus.value = resp.data;
    }
  } catch (error) {
    console.error("Error starting webhook:", error);
  } finally {
    webhookLoading.value = false;
  }
}

async function stopWebhook() {
  webhookLoading.value = true;
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/webhook/stop`, {
      method: "POST",
    });
    if (resp?.data) {
      webhookStatus.value = resp.data;
    }
  } catch (error) {
    console.error("Error stopping webhook:", error);
  } finally {
    webhookLoading.value = false;
  }
}

async function toggleBotStatus() {
  if (!bot.value) return;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { is_active: !bot.value.is_active },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error) {
    console.error("Error updating bot status:", error);
  }
}

function editChat(chat: any) {
  editingChat.value = chat;
  newChat.value = {
    chat_id: chat.chat_id.toString(),
    name: chat.name,
    warnings_before_ban: chat.warnings_before_ban,
    auto_delete_violations: chat.auto_delete_violations,
    rules: chat.rules || [],
  };
  showAddChatModal.value = true;
}

function closeChatModal() {
  showAddChatModal.value = false;
  editingChat.value = null;
  newChat.value = {
    chat_id: "",
    name: "",
    warnings_before_ban: 3,
    auto_delete_violations: true,
    rules: [],
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

onMounted(loadBot);
onMounted(loadRules);
onMounted(loadWebhookStatus);
onMounted(loadLogs);
</script>
