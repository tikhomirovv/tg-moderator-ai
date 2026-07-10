<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold">Workspace invitation</h1>

      <p v-if="loading" class="text-sm text-gray-600">Accepting invitation...</p>

      <p
        v-else-if="done"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3"
      >
        You joined the workspace.
        <NuxtLink to="/" class="block mt-2 font-medium text-green-800 hover:underline">
          Continue to app
        </NuxtLink>
      </p>

      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
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
const loading = ref(true);
const done = ref(false);
const error = ref("");

const invitationId = computed(() => String(route.params.id ?? ""));

onMounted(async () => {
  const redirectTarget = route.fullPath;

  const { data: session } = await authClient.getSession();
  if (!session?.user) {
    await navigateTo(
      `/login?redirect=${encodeURIComponent(redirectTarget)}`
    );
    return;
  }

  if (!session.user.emailVerified) {
    await navigateTo("/login?verify=required");
    return;
  }

  const { error: acceptError } =
    await authClient.organization.acceptInvitation({
      invitationId: invitationId.value,
    });

  loading.value = false;

  if (acceptError) {
    error.value = formatAuthError(acceptError, "Could not accept invitation");
    return;
  }

  await authClient.getSession();
  done.value = true;
});
</script>
