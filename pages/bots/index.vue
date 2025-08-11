<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Bots</h2>
      <button
        @click="refresh"
        class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        Refresh
      </button>
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
            <div class="text-lg font-medium">{{ bot.id }}</div>
            <div class="text-xs text-gray-500">
              Status:
              <span
                :class="bot.isRunning ? 'text-green-600' : 'text-red-600'"
                >{{ bot.isRunning ? "Online" : "Offline" }}</span
              >
            </div>
          </div>
          <NuxtLink
            :to="`/bots/${bot.id}`"
            class="text-blue-600 text-sm hover:underline"
            >Details</NuxtLink
          >
        </div>
      </div>
    </div>

    <div v-if="!loading && bots.length === 0" class="text-gray-500">
      No bots found
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const bots = ref<any[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    await $fetch("/api/init", { method: "POST" });
    const resp = await $fetch<any>("/api/bots");
    bots.value = resp?.data?.bots || [];
  } finally {
    loading.value = false;
  }
}

function refresh() {
  load();
}

onMounted(load);
</script>
