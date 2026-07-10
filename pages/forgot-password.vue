<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Reset password</h1>

      <p
        v-if="done"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3"
      >
        If an account exists for that email, we sent a reset link. Check your
        inbox.
      </p>

      <form v-else class="space-y-4" @submit.prevent="requestReset">
        <p class="text-sm text-gray-600">
          Enter your email and we will send you a link to choose a new password.
        </p>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          :disabled="loading"
        >
          {{ loading ? "Sending..." : "Send reset link" }}
        </button>
      </form>

      <p class="text-sm text-gray-600">
        <NuxtLink to="/login" class="text-blue-600 hover:underline"
          >Back to sign in</NuxtLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { formatAuthError } from "~/lib/auth-errors";

definePageMeta({
  layout: false,
});

const email = ref("");
const loading = ref(false);
const error = ref("");
const done = ref(false);

function getResetRedirectUrl() {
  if (import.meta.client) {
    return `${window.location.origin}/reset-password`;
  }
  return `${process.env.BETTER_AUTH_URL || "http://localhost:3001"}/reset-password`;
}

async function requestReset() {
  loading.value = true;
  error.value = "";

  const { error: resetError } = await authClient.requestPasswordReset({
    email: email.value,
    redirectTo: getResetRedirectUrl(),
  });

  loading.value = false;

  if (resetError) {
    error.value = formatAuthError(resetError, "Could not send reset link");
    return;
  }

  done.value = true;
}
</script>
