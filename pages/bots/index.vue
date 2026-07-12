<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Bots</h2>
      <div class="flex gap-2">
        <button
          @click="showAddModal = true"
          class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Add Bot
        </button>
        <button
          @click="refresh"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-gray-500">Loading...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="bg-white border rounded p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-medium">{{ bot.name }}</div>
            <div class="text-xs text-gray-500">@{{ bot.id }}</div>
            <div class="text-xs text-gray-500">
              Status:
              <span
                :class="bot.is_active ? 'text-green-600' : 'text-red-600'"
                >{{ bot.is_active ? "Active" : "Inactive" }}</span
              >
            </div>
            <div class="text-xs text-gray-500">
              Chats: {{ bot.chats?.length || 0 }}
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <NuxtLink
              :to="`/bots/${bot.id}`"
              class="text-blue-600 text-sm hover:underline"
              >Details</NuxtLink
            >
            <NuxtLink
              :to="`/bots/${bot.id}`"
              class="text-green-600 text-sm hover:underline"
              >Add Chat</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && bots.length === 0" class="text-gray-500">
      No bots found. Create your first bot to get started.
    </div>

    <!-- Modal для добавления бота -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Add New Bot</h3>

        <form @submit.prevent="createBot" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot ID</label
            >
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">@</span>
              <input
                v-model="newBot.id"
                type="text"
                class="w-full border rounded px-3 py-2 pl-8"
                placeholder="my_bot"
                @input="formatBotId"
                required
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">Enter without @ symbol</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot Name</label
            >
            <input
              v-model="newBot.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="My Telegram Bot"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot Token</label
            >
            <input
              v-model="newBot.token"
              type="password"
              class="w-full border rounded px-3 py-2"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Get token from @BotFather</p>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="creating"
            >
              {{ creating ? "Creating..." : "Create Bot" }}
            </button>
            <button
              type="button"
              @click="showAddModal = false"
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

const bots = ref<any[]>([]);
const loading = ref(false);
const creating = ref(false);
const showAddModal = ref(false);

const newBot = ref({
  id: "",
  name: "",
  token: "",
  chats: [],
});

function formatBotId() {
  // Убираем @ если пользователь его ввел
  if (newBot.value.id.startsWith("@")) {
    newBot.value.id = newBot.value.id.substring(1);
  }

  // Убираем пробелы и специальные символы
  newBot.value.id = newBot.value.id.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
}

async function load() {
  loading.value = true;
  try {
    await $fetch("/api/init", { method: "POST" });
    const resp = await $fetch<any>("/api/bots");
    bots.value = resp?.data?.bots || [];
  } catch (error) {
    console.error("Error loading bots:", error);
  } finally {
    loading.value = false;
  }
}

async function createBot() {
  creating.value = true;
  try {
    await $fetch("/api/bots", {
      method: "POST",
      body: newBot.value,
    });

    // Очищаем форму и закрываем модальное окно
    newBot.value = { id: "", name: "", token: "", chats: [] };
    showAddModal.value = false;

    // Перезагружаем список ботов
    await load();
  } catch (error) {
    console.error("Error creating bot:", error);
  } finally {
    creating.value = false;
  }
}

function refresh() {
  load();
}

onMounted(load);
</script>
