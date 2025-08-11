<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Rules</h2>
      <button
        @click="save"
        class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        Save
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="(rule, key) in rules"
        :key="key"
        class="bg-white border rounded p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium">{{ key }}</h3>
          <span class="text-xs px-2 py-0.5 rounded bg-gray-100">{{
            rule.severity
          }}</span>
        </div>
        <p class="text-sm text-gray-600 mb-2">{{ rule.description }}</p>
        <textarea
          v-model="rule.ai_prompt"
          class="w-full border rounded p-2 text-sm"
          rows="4"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const rules = ref<Record<string, any>>({});

async function load() {
  const resp = await $fetch<any>("/api/config/rules");
  rules.value = resp?.data?.rules || {};
}

async function save() {
  await $fetch("/api/config/rules", {
    method: "PUT",
    body: { rules: rules.value },
  });
}

onMounted(load);
</script>
