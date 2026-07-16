<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.botCredits.title')"
      :subtitle="t('page.botCredits.subtitle')"
    />

    <div
      v-if="paymentNotice"
      class="mb-4 rounded border p-3 text-sm"
      :class="paymentNoticeClass"
    >
      {{ paymentNotice }}
    </div>

    <div class="bg-white border rounded p-6 mb-6">
      <div class="text-sm text-gray-600">{{ t("billing.balance") }}</div>
      <div class="text-3xl font-bold text-blue-700 mt-1">{{ balance.toLocaleString() }}</div>
      <button
        type="button"
        class="mt-3 text-sm text-blue-700 hover:underline"
        :disabled="refreshing"
        @click="refreshBalance"
      >
        {{ refreshing ? t("common.loading") : t("common.refresh") }}
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

type PaymentSyncStatus =
  | "applied"
  | "duplicate"
  | "pending"
  | "not_found"
  | "forbidden";

const balance = ref(0);
const error = ref("");
const refreshing = ref(false);
const checkoutPackageId = ref<CreditPackageId | null>(null);
const paymentNotice = ref("");
const paymentNoticeTone = ref<"info" | "success" | "warning">("info");

const paymentNoticeClass = computed(() => {
  if (paymentNoticeTone.value === "success") {
    return "border-green-200 bg-green-50 text-green-900";
  }
  if (paymentNoticeTone.value === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-blue-200 bg-blue-50 text-blue-900";
});

function setPaymentNotice(message: string, tone: "info" | "success" | "warning") {
  paymentNotice.value = message;
  paymentNoticeTone.value = tone;
}

function noticeForSyncStatus(status: PaymentSyncStatus | null | undefined) {
  if (!status) {
    return;
  }
  if (status === "applied") {
    setPaymentNotice(t("billing.paymentApplied"), "success");
    return;
  }
  if (status === "duplicate") {
    setPaymentNotice(t("billing.paymentAlreadyApplied"), "success");
    return;
  }
  if (status === "pending") {
    setPaymentNotice(t("billing.paymentReturnPending"), "info");
    return;
  }
  if (status === "not_found" || status === "forbidden") {
    setPaymentNotice(t("billing.paymentSyncFailed"), "warning");
  }
}

async function syncOpenPayments(
  paymentId?: string
): Promise<PaymentSyncStatus | undefined> {
  const response = await $fetch<{
    data: { sync_status?: PaymentSyncStatus; balance: number };
  }>(`/api/bots/${botId}/credits/sync`, {
    method: "POST",
    body: paymentId ? { payment_id: paymentId } : {},
  });

  balance.value = response.data.balance;
  return response.data.sync_status;
}

async function refreshBalance() {
  refreshing.value = true;
  error.value = "";
  try {
    const syncStatus = await syncOpenPayments();
    noticeForSyncStatus(syncStatus);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    refreshing.value = false;
  }
}

async function startCheckout(packageId: CreditPackageId) {
  checkoutPackageId.value = packageId;
  error.value = "";
  try {
    const response = await $fetch<{
      data: { checkout_url: string; provider_payment_id: string };
    }>(`/api/bots/${botId}/credits/checkout`, {
      method: "POST",
      body: { package_id: packageId },
    });
    window.location.href = response.data.checkout_url;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
    checkoutPackageId.value = null;
  }
}

let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  const queryPaymentId = route.query.payment_id;
  const recoveryPaymentId =
    typeof queryPaymentId === "string" ? queryPaymentId.trim() : "";

  try {
    const syncStatus = recoveryPaymentId
      ? await syncOpenPayments(recoveryPaymentId)
      : await syncOpenPayments();
    noticeForSyncStatus(syncStatus);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  }

  const shouldPoll = route.query.payment === "return";
  if (!shouldPoll) {
    return;
  }

  if (!paymentNotice.value) {
    setPaymentNotice(t("billing.paymentReturnPending"), "info");
  }

  pollTimer = setInterval(async () => {
    try {
      const syncStatus = await syncOpenPayments();
      if (syncStatus === "applied" || syncStatus === "duplicate") {
        noticeForSyncStatus(syncStatus);
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = undefined;
        }
        return;
      }
      if (syncStatus === "pending") {
        setPaymentNotice(t("billing.paymentReturnPending"), "info");
      }
    } catch {
      // Keep polling; user can hit Refresh for explicit error.
    }
  }, 3000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
</script>
