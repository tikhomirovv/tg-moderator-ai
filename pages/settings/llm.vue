<template>
  <div class="max-w-xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.settingsLlm.title')"
      :subtitle="t('page.settingsLlm.subtitle')"
    />

    <p class="text-sm text-gray-600 mb-4">{{ t("billing.envOverrideHint") }}</p>

    <div v-if="loading" class="text-gray-500">{{ t("common.loading") }}</div>

    <form v-else class="bg-white border rounded p-6 space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ t("billing.settings.apiKey") }}
        </label>
        <input
          v-model="apiKey"
          type="password"
          class="w-full border rounded px-3 py-2"
          :placeholder="settings?.has_api_key ? t('billing.settings.apiKeyPlaceholder') : ''"
          autocomplete="off"
        />
        <p v-if="settings?.has_api_key && !apiKey" class="text-xs text-green-700 mt-1">
          {{ t("billing.settings.apiKeyConfigured") }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ t("billing.settings.baseUrl") }}
        </label>
        <input
          v-model="baseUrl"
          type="url"
          class="w-full border rounded px-3 py-2"
          :placeholder="t('billing.settings.baseUrlPlaceholder')"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ t("billing.settings.model") }}
        </label>
        <input
          v-model="model"
          type="text"
          class="w-full border rounded px-3 py-2"
          :placeholder="t('billing.settings.modelPlaceholder')"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="text-sm text-green-700">{{ t("billing.settings.saved") }}</p>

      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        :disabled="saving"
      >
        {{ saving ? t("common.saving") : t("common.save") }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const config = useRuntimeConfig();

if (config.public.deploymentMode !== "self-hosted") {
  await navigateTo("/");
}

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.settingsLlm.breadcrumb") },
]);

usePageTitle(() => t("page.settingsLlm.documentTitle"));

type SettingsResponse = {
  has_api_key: boolean;
  base_url?: string | null;
  model?: string | null;
};

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref(false);
const settings = ref<SettingsResponse | null>(null);
const apiKey = ref("");
const baseUrl = ref("");
const model = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const response = await $fetch<{ data: SettingsResponse }>("/api/settings/llm");
    settings.value = response.data;
    baseUrl.value = response.data.base_url ?? "";
    model.value = response.data.model ?? "";
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  success.value = false;
  try {
    const response = await $fetch<{ data: SettingsResponse }>("/api/settings/llm", {
      method: "PUT",
      body: {
        api_key: apiKey.value || undefined,
        base_url: baseUrl.value || null,
        model: model.value || null,
      },
    });
    settings.value = response.data;
    apiKey.value = "";
    success.value = true;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
