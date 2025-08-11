<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Bot Details</h2>
      <div class="flex gap-2">
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
        <h3 class="text-lg font-medium mb-4">
          Chats ({{ bot.chats?.length || 0 }})
        </h3>
        <div v-if="bot.chats && bot.chats.length > 0" class="space-y-3">
          <div
            v-for="chat in bot.chats"
            :key="chat.chat_id"
            class="border rounded p-3"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">{{ chat.name }}</div>
                <div class="text-sm text-gray-600">ID: {{ chat.chat_id }}</div>
                <div class="text-sm text-gray-600">
                  Rules: {{ chat.rules?.length || 0 }}, Warnings:
                  {{ chat.warnings_before_ban }}, Auto-delete:
                  {{ chat.auto_delete_violations ? "Yes" : "No" }}
                </div>
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
    </div>

    <div v-else class="text-gray-500">Bot not found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const route = useRoute();
const botId = route.params.id as string;

const bot = ref<any>(null);
const loading = ref(false);

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

onMounted(loadBot);
</script>
