<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Sign in</h1>

      <p
        v-if="verifiedSuccess"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3"
      >
        Your email has been verified.
        <span v-if="signedIn"> You're signed in.</span>
        <span v-else> You can sign in now.</span>
        <NuxtLink
          v-if="signedIn"
          to="/"
          class="block mt-2 font-medium text-green-800 hover:underline"
        >
          Continue to app
        </NuxtLink>
      </p>

      <p
        v-else-if="verifyError"
        class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3"
      >
        {{ verifyError }}
      </p>

      <p
        v-else-if="verifyRequired"
        class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3"
      >
        Verify your email before signing in.
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
        <NuxtLink to="/forgot-password" class="text-blue-600 hover:underline"
          >Forgot password?</NuxtLink
        >
      </p>

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
import { formatAuthError } from "~/lib/auth-errors";

definePageMeta({
  layout: false,
});

const route = useRoute();
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const verifyRequired = computed(() => route.query.verify === "required");
const verifiedSuccess = computed(() => route.query.verified === "1");
const signedIn = ref(false);

const verifyError = computed(() => {
  const code = route.query.error;
  if (!code || typeof code !== "string") {
    return "";
  }
  if (code === "TOKEN_EXPIRED") {
    return "Verification link has expired. Sign in to request a new one.";
  }
  if (code === "INVALID_TOKEN") {
    return "Verification link is invalid or has already been used.";
  }
  return "Email verification failed. Try signing in to request a new link.";
});

onMounted(async () => {
  if (!verifiedSuccess.value) {
    return;
  }

  const { data: session } = await authClient.useSession(useFetch);
  signedIn.value = Boolean(session.value?.user?.emailVerified);
});

async function signIn() {
  loading.value = true;
  error.value = "";

  const redirect =
    typeof route.query.redirect === "string" ? route.query.redirect : undefined;

  const { error: signInError } = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (signInError) {
    error.value = formatAuthError(signInError, "Sign in failed");
    return;
  }

  if (redirect && redirect.startsWith("/")) {
    await navigateTo(redirect);
    return;
  }

  await navigateTo("/");
}
</script>
