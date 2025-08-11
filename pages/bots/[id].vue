<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Bot: {{ botId }}</h2>
      <div class="space-x-2">
        <button
          class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Disable
        </button>
        <NuxtLink to="/bots" class="px-3 py-2 border rounded text-sm"
          >Back</NuxtLink
        >
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white border rounded p-4">
        <h3 class="font-medium mb-2">Info</h3>
        <div class="text-sm text-gray-600">ID: {{ botId }}</div>
        <div class="text-sm text-gray-600">Status: Online</div>
      </div>
      <div class="bg-white border rounded p-4">
        <h3 class="font-medium mb-2">Chats</h3>
        <div class="text-sm text-gray-600">Configured in config/bots.yaml</div>
      </div>
    </div>

    <div class="bg-white border rounded p-4">
      <h3 class="font-medium mb-2">Recent logs</h3>
      <div class="text-sm text-gray-500">Coming soon...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const botId = route.params.id as string;
</script>
