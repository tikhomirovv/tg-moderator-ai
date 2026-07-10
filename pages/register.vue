<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Create account</h1>

      <p
        v-if="done"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3"
      >
        Account created. Check your email for a verification link, then sign in.
      </p>

      <form v-else class="space-y-4" @submit.prevent="signUp">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full border rounded px-3 py-2"
          />
        </div>
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
            minlength="8"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-green-600 text-white rounded py-2 hover:bg-green-700"
          :disabled="loading"
        >
          {{ loading ? "Creating..." : "Register" }}
        </button>
      </form>

      <p class="text-sm text-gray-600">
        Already have an account?
        <NuxtLink to="/login" class="text-blue-600 hover:underline"
          >Sign in</NuxtLink
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

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const done = ref(false);

async function signUp() {
  loading.value = true;
  error.value = "";

  const { error: signUpError } = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
    callbackURL: `${window.location.origin}/login?verified=1`,
  });

  loading.value = false;

  if (signUpError) {
    error.value = formatAuthError(signUpError, "Registration failed");
    return;
  }

  done.value = true;
}
</script>
