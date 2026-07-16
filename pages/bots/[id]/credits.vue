<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.botCredits.title')"
      :subtitle="t('page.botCredits.subtitle')"
    />

    <div v-if="paymentNotice" class="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      {{ paymentNotice }}
    </div>

    <div class="bg-white border rounded p-6 mb-6">
      <div class="text-sm text-gray-600">{{ t("billing.balance") }}</div>
      <div class="text-3xl font-bold text-blue-700 mt-1">{{ balance.toLocaleString() }}</div>
      <button
        type="button"
        class="mt-3 text-sm text-blue-700 hover:underline"
        @click="refreshBalance"
      >
        {{ t("common.refresh") }}
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="bg-white border rounded p-4 flex items-center justify-between gap-4"
      >
        <div>
          <div class="font-medium">{{ t(pkg.labelKey) }}</div>
          <div class="text-sm text-gray-600">
            {{ pkg.amountRub.toLocaleString() }} ₽
          </div>
        </div>
        <button
          type="button"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          :disabled="checkoutPackageId === pkg.id"
          @click="startCheckout(pkg.id)"
        >
          {{
            checkoutPackageId === pkg.id
              ? t("billing.purchasing")
              : t("billing.purchase")
          }}
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { CREDIT_PACKAGES, type CreditPackageId } from "~/lib/credit-packages";

const { t } = useI18n();
const config = useRuntimeConfig();
const route = useRoute();
const botId = route.params.id as string;

if (config.public.deploymentMode !== "saas") {
  await navigateTo(`/bots/${botId}`);
}

const packages = Object.values(CREDIT_PACKAGES);

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: `@${botId}`, to: `/bots/${botId}` },
  { label: t("page.botCredits.breadcrumb") },
]);

usePageTitle(() => t("page.botCredits.documentTitle"));

const balance = ref(0);
const error = ref("");
const checkoutPackageId = ref<CreditPackageId | null>(null);
const paymentNotice = ref("");

async function refreshBalance() {
  try {
    const response = await $fetch<{ data: { balance: number } }>(
      `/api/bots/${botId}/credits/balance`
    );
    balance.value = response.data.balance;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  }
}

async function startCheckout(packageId: CreditPackageId) {
  checkoutPackageId.value = packageId;
  error.value = "";
  try {
    const response = await $fetch<{ data: { checkout_url: string } }>(
      `/api/bots/${botId}/credits/checkout`,
      {
        method: "POST",
        body: { package_id: packageId },
      }
    );
    window.location.href = response.data.checkout_url;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
    checkoutPackageId.value = null;
  }
}

let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  await refreshBalance();

  if (route.query.payment === "return") {
    paymentNotice.value = t("billing.paymentReturnPending");
    pollTimer = setInterval(refreshBalance, 3000);
    setTimeout(() => {
      if (pollTimer) clearInterval(pollTimer);
      paymentNotice.value = t("billing.paymentReturnSuccess");
    }, 30_000);
  }
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>
