<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Sign in</h1>

      <p
        v-if="verifyRequired"
        class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3"
      >
        Verify your email before signing in. Check Mailpit.
      </p>

      <form class="space-y-4" @submit.prevent="signIn">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input
            v-model="password"
            type="password"
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
          {{ loading ? "Signing in..." : "Sign in" }}
        </button>
      </form>

      <p class="text-sm text-gray-600">
        No account?
        <NuxtLink to="/register" class="text-blue-600 hover:underline"
          >Register</NuxtLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

definePageMeta({
  layout: false,
});

const route = useRoute();
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const verifyRequired = computed(() => route.query.verify === "required");

async function signIn() {
  loading.value = true;
  error.value = "";

  const { error: signInError } = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (signInError) {
    error.value = signInError.message || "Sign in failed";
    return;
  }

  await navigateTo("/");
}
</script>
