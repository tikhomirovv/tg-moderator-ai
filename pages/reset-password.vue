<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Choose new password</h1>

      <p
        v-if="done"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3"
      >
        Password updated. You can sign in with your new password.
        <NuxtLink to="/login" class="block mt-2 font-medium text-green-800 hover:underline">
          Go to sign in
        </NuxtLink>
      </p>

      <p
        v-else-if="!token"
        class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3"
      >
        Reset link is missing or invalid. Request a new one from the forgot
        password page.
      </p>

      <form v-else class="space-y-4" @submit.prevent="submitNewPassword">
        <div>
          <label class="block text-sm font-medium mb-1">New password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Confirm password</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          :disabled="loading"
        >
          {{ loading ? "Saving..." : "Update password" }}
        </button>
      </form>

      <p class="text-sm text-gray-600">
        <NuxtLink to="/forgot-password" class="text-blue-600 hover:underline"
          >Request a new link</NuxtLink
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

const route = useRoute();
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const done = ref(false);

const token = computed(() => {
  const value = route.query.token;
  return typeof value === "string" ? value : "";
});

async function submitNewPassword() {
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  error.value = "";

  const { error: resetError } = await authClient.resetPassword({
    newPassword: password.value,
    token: token.value,
  });

  loading.value = false;

  if (resetError) {
    error.value = formatAuthError(resetError, "Could not reset password");
    return;
  }

  done.value = true;
}
</script>
