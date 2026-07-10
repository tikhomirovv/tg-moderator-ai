<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
      <h2 class="text-lg font-semibold">Create workspace</h2>
      <p class="text-sm text-gray-600">
        Give your workspace a name. Bots and rules live inside it.
      </p>

      <form class="space-y-4" @submit.prevent="createWorkspace">
        <div>
          <label class="block text-sm font-medium mb-1">Workspace name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full border rounded px-3 py-2"
            placeholder="My team"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
          :disabled="loading || !name.trim()"
        >
          {{ loading ? "Creating..." : "Create workspace" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { formatAuthError } from "~/lib/auth-errors";
import { reserveWorkspaceSlugForCreate } from "~/lib/workspace-slug-client";

const open = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  created: [];
}>();

const name = ref("");
const loading = ref(false);
const error = ref("");

async function createWorkspace() {
  loading.value = true;
  error.value = "";

  const { data: session } = await authClient.getSession();
  if (!session?.user) {
    loading.value = false;
    error.value = "Not signed in";
    return;
  }

  let slug: string;
  try {
    slug = await reserveWorkspaceSlugForCreate(name.value);
  } catch {
    loading.value = false;
    error.value = "Failed to reserve workspace slug";
    return;
  }

  const { data, error: createError } = await authClient.organization.create({
    name: name.value.trim(),
    slug,
  });

  if (createError || !data?.id) {
    loading.value = false;
    error.value = formatAuthError(createError, "Failed to create workspace");
    return;
  }

  await authClient.getSession();

  loading.value = false;
  open.value = false;
  name.value = "";
  emit("created");
}
</script>
