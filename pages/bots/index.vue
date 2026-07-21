<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.bots.title')"
    >
      <template #actions>
        <button
          type="button"
          class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          @click="openAddModal('create')"
        >
          {{ t("bot.addBot") }}
        </button>
      </template>
    </LayoutPageHeader>

    <div
      v-if="isSaas && referralLink"
      class="mb-6 bg-white border rounded p-4 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="min-w-0">
        <div class="text-sm font-medium">{{ t("referral.shareTitle") }}</div>
        <div class="text-xs text-gray-500 truncate">{{ referralLink }}</div>
      </div>
      <button
        type="button"
        class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="copyReferralLink"
      >
        {{ copiedReferral ? t("referral.copied") : t("referral.copyLink") }}
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">{{ t("common.loading") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="bot in bots"
        :key="bot.id"
        :to="`/bots/${bot.id}`"
        class="bg-white border rounded p-4 block hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <div class="flex items-start gap-3 min-w-0">
          <img
            v-if="bot.photo_file_id"
            :src="botPhotoUrl(bot.id)"
            :alt="bot.name"
            class="h-10 w-10 rounded-full object-cover bg-gray-100 shrink-0"
          />
          <div
            v-else
            class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0"
          >
            {{ botInitials(bot.name) }}
          </div>
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
              {{ t("bot.statusLabel") }}
              <span
                :class="bot.is_active ? 'text-green-600' : 'text-red-600'"
                >{{ bot.is_active ? t("bot.active") : t("bot.inactive") }}</span
              >
            </div>
            <div class="text-xs text-gray-500">
              {{ t("bot.chatsCount", { count: bot.chats?.length || 0 }) }}
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div
      v-if="!loading && bots.length === 0"
      class="bg-white border rounded p-8 text-center text-gray-600"
    >
      <p class="mb-4">
        {{ t("bot.emptyState") }}
      </p>
      <button
        type="button"
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        @click="openAddModal('create')"
      >
        {{ t("bot.addBot") }}
      </button>
    </div>

    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">{{ t("bot.modal.title") }}</h3>

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
            {{ t("bot.modal.createTab") }}
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
            {{ t("bot.modal.joinTab") }}
          </button>
        </div>

        <form
          v-if="addModalTab === 'create'"
          class="space-y-4"
          @submit.prevent="createBot"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{
              t("bot.modal.tokenLabel")
            }}</label>
            <input
              v-model="newBotToken"
              type="password"
              class="w-full border rounded px-3 py-2"
              :placeholder="t('bot.modal.tokenPlaceholder')"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              {{ t("bot.modal.tokenHint") }}
            </p>
          </div>

          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>

          <div class="flex gap-2 pt-2">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="creating"
            >
              {{ creating ? t("common.creating") : t("bot.modal.createButton") }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50"
              @click="closeAddModal"
            >
              {{ t("common.cancel") }}
            </button>
          </div>
        </form>

        <form v-else class="space-y-4" @submit.prevent="joinTeam">
          <p class="text-sm text-gray-600">
            {{ t("bot.modal.joinDescription") }}
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{
              t("bot.modal.accessCodeLabel")
            }}</label>
            <input
              v-model="joinCode"
              type="text"
              class="w-full border rounded px-3 py-2"
              :placeholder="t('bot.modal.accessCodePlaceholder')"
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
              {{ joining ? t("common.joining") : t("bot.modal.joinButton") }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50"
              @click="closeAddModal"
            >
              {{ t("common.cancel") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { readFetchError } from "~/lib/fetch-error";
import { ref, computed, onMounted } from "vue";
import type { BotListItem, BotMemberRole } from "~/types/bot";

const { t } = useI18n();
const config = useRuntimeConfig();
const isSaas = computed(() => config.public.deploymentMode === "saas");

usePageTitle(() => t("page.bots.documentTitle"));

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.bots.title") },
]);

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
const newBotToken = ref("");
const referralLink = ref("");
const copiedReferral = ref(false);

async function loadReferralLink() {
  if (!isSaas.value) {
    return;
  }
  try {
    const response = await $fetch<{ data: { link: string } }>("/api/referral/link");
    referralLink.value = response.data.link;
  } catch {
    referralLink.value = "";
  }
}

async function copyReferralLink() {
  if (!referralLink.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(referralLink.value);
    copiedReferral.value = true;
    setTimeout(() => {
      copiedReferral.value = false;
    }, 2000);
  } catch {
    copiedReferral.value = false;
  }
}

function roleLabel(role: BotMemberRole | undefined) {
  if (role === "owner") return t("common.roles.owner");
  return t("common.roles.manager");
}

function roleBadgeClass(role: BotMemberRole | undefined) {
  if (role === "owner") {
    return "bg-green-100 text-green-800";
  }
  return "bg-blue-100 text-blue-800";
}

function botPhotoUrl(id: string) {
  return `/api/bots/${id}/photo`;
}

function botInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "B").toUpperCase();
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
      body: { token: newBotToken.value.trim() },
    });

    newBotToken.value = "";
    closeAddModal();
    await load();
  } catch (error) {
    createError.value = readFetchError(error, t("common.errors.createBot"));
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
    joinError.value = readFetchError(error, t("common.errors.joinTeam"));
    console.error("Error joining team:", error);
  } finally {
    joining.value = false;
  }
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
  await loadReferralLink();
  applyAddModalFromQuery();
});
</script>
