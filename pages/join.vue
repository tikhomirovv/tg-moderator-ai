<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Join a team</h1>
      <p class="text-sm text-gray-600">
        Введите access code от владельца бота.
      </p>

      <form class="space-y-4" @submit.prevent="joinTeam">
        <div>
          <label class="block text-sm font-medium mb-1">Access code</label>
          <input
            v-model="code"
            type="text"
            required
            class="w-full border rounded px-3 py-2"
            placeholder="abc123..."
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          :disabled="loading"
        >
          {{ loading ? "Joining..." : "Join team" }}
        </button>
      </form>

      <p class="text-sm text-gray-500 text-center">
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Back to login</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const code = ref("");
const loading = ref(false);
const error = ref("");

async function joinTeam() {
  loading.value = true;
  error.value = "";

  try {
    const response = await $fetch<{ data: { bot_id: string } }>("/api/bots/join", {
      method: "POST",
      body: { code: code.value.trim() },
    });
    await navigateTo(`/bots/${response.data.bot_id}`);
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : "Failed to join team";
  } finally {
    loading.value = false;
  }
}
</script>
