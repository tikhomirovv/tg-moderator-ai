<template>
  <div v-if="isSaas && pending.count > 0" class="relative">
    <button
      type="button"
      class="px-3 py-2 rounded text-sm bg-amber-100 text-amber-900 hover:bg-amber-200 whitespace-nowrap"
      @click="open = true"
    >
      {{ t("referral.navPending", { credits: pending.credits.toLocaleString() }) }}
    </button>

    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="open = false"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2 class="text-lg font-semibold mb-2">{{ t("referral.claimTitle") }}</h2>
        <p class="text-sm text-gray-600 mb-4">
          {{
            t("referral.claimSubtitle", {
              credits: pending.credits.toLocaleString(),
              count: pending.count,
            })
          }}
        </p>

        <div v-if="ownedBots.length === 0" class="text-sm text-amber-700 mb-4">
          {{ t("referral.noOwnedBots") }}
        </div>

        <div v-else class="space-y-2 mb-4 max-h-60 overflow-y-auto">
          <button
            v-for="bot in ownedBots"
            :key="bot.id"
            type="button"
            class="w-full text-left border rounded px-3 py-2 hover:border-blue-400 disabled:opacity-50"
            :disabled="claiming"
            @click="claimToBot(bot.id)"
          >
            <div class="font-medium">{{ bot.name }}</div>
            <div class="text-xs text-gray-500">@{{ bot.id }}</div>
          </button>
        </div>

        <p v-if="error" class="text-sm text-red-600 mb-3">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-700 mb-3">{{ success }}</p>

        <button
          type="button"
          class="text-sm text-gray-600 hover:underline"
          @click="open = false"
        >
          {{ t("common.close") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type BotListItem = {
  id: string;
  name: string;
  my_role?: string | null;
};

const { t } = useI18n();
const config = useRuntimeConfig();
const isSaas = computed(() => config.public.deploymentMode === "saas");

const open = ref(false);
const claiming = ref(false);
const error = ref("");
const success = ref("");
const pending = ref({ credits: 0, count: 0 });
const ownedBots = ref<BotListItem[]>([]);

async function refreshPending() {
  if (!isSaas.value) {
    return;
  }
  try {
    const response = await $fetch<{
      data: { credits: number; count: number };
    }>("/api/referral/pending");
    pending.value = response.data;
  } catch {
    pending.value = { credits: 0, count: 0 };
  }
}

async function loadOwnedBots() {
  try {
    const response = await $fetch<{ data: BotListItem[] }>("/api/bots");
    ownedBots.value = response.data.filter((bot) => bot.my_role === "owner");
  } catch {
    ownedBots.value = [];
  }
}

async function claimToBot(botId: string) {
  claiming.value = true;
  error.value = "";
  success.value = "";
  try {
    const response = await $fetch<{
      data: { credits: number };
    }>("/api/referral/claim", {
      method: "POST",
      body: { bot_id: botId },
    });
    success.value = t("referral.claimSuccess", {
      credits: response.data.credits.toLocaleString(),
    });
    await refreshPending();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    claiming.value = false;
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await loadOwnedBots();
  }
});

onMounted(async () => {
  await refreshPending();
});
</script>
