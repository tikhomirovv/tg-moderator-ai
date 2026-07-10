<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
      <h2 class="text-lg font-semibold">Invite member</h2>
      <p class="text-sm text-gray-600">
        Send an email invitation to join the current workspace.
      </p>

      <form class="space-y-4" @submit.prevent="sendInvite">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border rounded px-3 py-2"
            placeholder="colleague@example.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Role</label>
          <select v-model="role" class="w-full border rounded px-3 py-2">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-700">{{ success }}</p>
        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            :disabled="loading"
          >
            {{ loading ? "Sending..." : "Send invitation" }}
          </button>
          <button
            type="button"
            class="px-3 py-2 border rounded hover:bg-gray-50"
            @click="open = false"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { formatAuthError } from "~/lib/auth-errors";

const open = defineModel<boolean>({ required: true });

const email = ref("");
const role = ref("member");
const loading = ref(false);
const error = ref("");
const success = ref("");

watch(open, (isOpen) => {
  if (!isOpen) {
    email.value = "";
    role.value = "member";
    error.value = "";
    success.value = "";
  }
});

async function sendInvite() {
  loading.value = true;
  error.value = "";
  success.value = "";

  const { error: inviteError } = await authClient.organization.inviteMember({
    email: email.value.trim(),
    role: role.value as "member" | "admin",
    resend: true,
  });

  loading.value = false;

  if (inviteError) {
    error.value = formatAuthError(inviteError, "Failed to send invitation");
    return;
  }

  success.value = "Invitation sent.";
  email.value = "";
}
</script>
