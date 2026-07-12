<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Bots</h2>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          @click="openAddModal('create')"
        >
          Add bot
        </button>
        <button
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          @click="refresh"
        >
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-gray-500">Loading...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="bg-white border rounded p-4"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <div class="text-lg font-medium">{{ bot.name }}</div>
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="roleBadgeClass(bot.my_role)"
              >
                {{ roleLabel(bot.my_role) }}
              </span>
            </div>
            <div class="text-xs text-gray-500">@{{ bot.id }}</div>
            <div class="text-xs text-gray-500">
              Status:
              <span
                :class="bot.is_active ? 'text-green-600' : 'text-red-600'"
                >{{ bot.is_active ? "Active" : "Inactive" }}</span
              >
            </div>
            <div class="text-xs text-gray-500">
              Chats: {{ bot.chats?.length || 0 }}
            </div>
          </div>
          <div class="flex flex-col gap-1 shrink-0">
            <NuxtLink
              :to="`/bots/${bot.id}`"
              class="text-blue-600 text-sm hover:underline"
              >Details</NuxtLink
            >
            <NuxtLink
              :to="`/bots/${bot.id}`"
              class="text-green-600 text-sm hover:underline"
              >Add Chat</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!loading && bots.length === 0"
      class="bg-white border rounded p-8 text-center text-gray-600"
    >
      <p class="mb-4">
        You have no bots yet. Create your own moderation bot or join an existing
        team with an access code from the bot owner.
      </p>
      <button
        type="button"
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        @click="openAddModal('create')"
      >
        Add bot
      </button>
    </div>

    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Add bot</h3>

        <div class="flex gap-2 mb-4 border-b">
          <button
            type="button"
            class="px-3 py-2 text-sm border-b-2 -mb-px"
            :class="
              addModalTab === 'create'
                ? 'border-green-600 text-green-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="addModalTab = 'create'"
          >
            Create bot
          </button>
          <button
            type="button"
            class="px-3 py-2 text-sm border-b-2 -mb-px"
            :class="
              addModalTab === 'join'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="addModalTab = 'join'"
          >
            Join with code
          </button>
        </div>

        <form
          v-if="addModalTab === 'create'"
          class="space-y-4"
          @submit.prevent="createBot"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot ID</label
            >
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">@</span>
              <input
                v-model="newBot.id"
                type="text"
                class="w-full border rounded px-3 py-2 pl-8"
                placeholder="my_bot"
                required
                @input="formatBotId"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">Enter without @ symbol</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot Name</label
            >
            <input
              v-model="newBot.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="My Telegram Bot"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Bot Token</label
            >
            <input
              v-model="newBot.token"
              type="password"
              class="w-full border rounded px-3 py-2"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Get token from @BotFather</p>
          </div>

          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>

          <div class="flex gap-2 pt-2">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="creating"
            >
              {{ creating ? "Creating..." : "Create bot" }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50"
              @click="closeAddModal"
            >
              Cancel
            </button>
          </div>
        </form>

        <form v-else class="space-y-4" @submit.prevent="joinTeam">
          <p class="text-sm text-gray-600">
            Enter the access code from the bot owner. You will join as a team
            member (manager).
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Access code</label
            >
            <input
              v-model="joinCode"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="abc123..."
              required
            />
          </div>
          <p v-if="joinError" class="text-sm text-red-600">{{ joinError }}</p>
          <div class="flex gap-2 pt-2">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              :disabled="joining"
            >
              {{ joining ? "Joining..." : "Join team" }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50"
              @click="closeAddModal"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { BotListItem, BotMemberRole } from "~/types/bot";

usePageTitle("Боты");

type AddModalTab = "create" | "join";

const route = useRoute();
const router = useRouter();

const bots = ref<BotListItem[]>([]);
const loading = ref(false);
const creating = ref(false);
const joining = ref(false);
const showAddModal = ref(false);
const addModalTab = ref<AddModalTab>("create");
const createError = ref("");
const joinError = ref("");
const joinCode = ref("");

const newBot = ref({
  id: "",
  name: "",
  token: "",
  chats: [] as BotListItem["chats"],
});

function roleLabel(role: BotMemberRole | undefined) {
  if (role === "owner") return "Owner";
  if (role === "manager") return "Member";
  return "Member";
}

function roleBadgeClass(role: BotMemberRole | undefined) {
  if (role === "owner") {
    return "bg-green-100 text-green-800";
  }
  return "bg-blue-100 text-blue-800";
}

function formatBotId() {
  if (newBot.value.id.startsWith("@")) {
    newBot.value.id = newBot.value.id.substring(1);
  }
  newBot.value.id = newBot.value.id.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
}

function openAddModal(tab: AddModalTab) {
  addModalTab.value = tab;
  createError.value = "";
  joinError.value = "";
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false;
  createError.value = "";
  joinError.value = "";
}

function readFetchError(error: unknown, fallback: string) {
  const fetchError = error as {
    data?: { statusMessage?: string; message?: string };
    statusMessage?: string;
    message?: string;
  };
  return (
    fetchError.data?.statusMessage ||
    fetchError.statusMessage ||
    fetchError.data?.message ||
    fetchError.message ||
    fallback
  );
}

async function load() {
  loading.value = true;
  try {
    const resp = await $fetch<{ data?: { bots?: BotListItem[] } }>("/api/bots");
    bots.value = resp?.data?.bots || [];
  } catch (error) {
    console.error("Error loading bots:", error);
  } finally {
    loading.value = false;
  }
}

async function createBot() {
  creating.value = true;
  createError.value = "";
  try {
    await $fetch("/api/bots", {
      method: "POST",
      body: newBot.value,
    });

    newBot.value = { id: "", name: "", token: "", chats: [] };
    closeAddModal();
    await load();
  } catch (error) {
    createError.value = readFetchError(error, "Failed to create bot");
    console.error("Error creating bot:", error);
  } finally {
    creating.value = false;
  }
}

async function joinTeam() {
  joining.value = true;
  joinError.value = "";
  try {
    const response = await $fetch<{ data: { bot_id: string } }>("/api/bots/join", {
      method: "POST",
      body: { code: joinCode.value.trim() },
    });
    joinCode.value = "";
    closeAddModal();
    await load();
    await navigateTo(`/bots/${response.data.bot_id}`);
  } catch (error) {
    joinError.value = readFetchError(error, "Failed to join team");
    console.error("Error joining team:", error);
  } finally {
    joining.value = false;
  }
}

function refresh() {
  load();
}

function applyAddModalFromQuery() {
  const add = route.query.add;
  const code = route.query.code;

  if (typeof code === "string" && code.trim()) {
    joinCode.value = code.trim();
    openAddModal("join");
  } else if (add === "join") {
    openAddModal("join");
  } else if (add === "create") {
    openAddModal("create");
  }

  if (add || code) {
    router.replace({ path: "/bots" });
  }
}

onMounted(async () => {
  await load();
  applyAddModalFromQuery();
});
</script>
