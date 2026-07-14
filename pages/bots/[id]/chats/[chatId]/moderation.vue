<template>
  <div class="space-y-6">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.moderation.title')"
      :subtitle="chatName || t('page.moderation.chatSubtitle', { chatId: telegramChatId })"
    >
      <template #actions>
        <button
          type="button"
          class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
          @click="openTemplateLibrary"
        >
          {{ t("moderation.addFromTemplate") }}
        </button>
        <button
          type="button"
          class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          @click="openCreateModal"
        >
          {{ t("moderation.addRule") }}
        </button>
      </template>
    </LayoutPageHeader>

    <div
      v-if="templateError"
      class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm"
    >
      {{ templateError }}
    </div>

    <div
      v-if="ruleActionError"
      class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm"
    >
      {{ ruleActionError }}
    </div>

    <div
      v-if="userActionError"
      class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm"
    >
      {{ userActionError }}
    </div>

    <div v-if="loading" class="text-gray-500">{{ t("moderation.loadingRules") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="rule in rules"
        :key="rule.id"
        class="bg-white border rounded p-4"
      >
        <div class="flex items-start justify-between mb-2 gap-2">
          <div>
            <h3 class="font-medium">{{ rule.name }}</h3>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              class="text-blue-600 text-sm hover:underline"
              @click="openEditModal(rule)"
            >
              {{ t("common.edit") }}
            </button>
            <button
              type="button"
              class="text-red-600 text-sm hover:underline"
              @click="deleteRule(rule)"
            >
              {{ t("common.delete") }}
            </button>
          </div>
        </div>

        <p class="text-sm text-gray-600 mb-2">{{ rule.description }}</p>

        <div class="text-xs text-gray-500 space-y-1">
          <div>
            {{ t("moderation.deleteOnViolation") }}
            <span class="font-medium">{{
              rule.delete_on_violation ? t("common.yes") : t("common.no")
            }}</span>
          </div>
          <div>
            {{ t("moderation.banOnViolation") }}
            <span class="font-medium">{{
              rule.ban_on_violation ? t("common.yes") : t("common.no")
            }}</span>
            <span v-if="rule.ban_on_violation">
              {{ t("moderation.afterWarnings", { count: rule.warnings_before_ban ?? 3 }) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && rules.length === 0" class="text-gray-500">
      {{ t("moderation.emptyRules") }}
    </div>

    <div class="bg-white border rounded p-4">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="font-medium">{{ t("moderation.chatUsers.title") }}</h3>
        <button
          type="button"
          class="text-sm text-blue-600 hover:underline"
          :disabled="usersLoading"
          @click="loadUsers()"
        >
          {{ usersLoading ? t("common.loading") : t("common.refresh") }}
        </button>
      </div>

      <p class="text-sm text-gray-500 mb-3">
        {{ t("moderation.chatUsers.description") }}
      </p>

      <div v-if="usersLoading && !chatUsers.length" class="text-gray-500 text-sm">
        {{ t("moderation.chatUsers.loading") }}
      </div>
      <div v-else-if="!chatUsers.length" class="text-gray-500 text-sm">
        {{ t("moderation.chatUsers.empty") }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-gray-500 border-b">
            <tr>
              <th class="py-2 pr-4 font-medium">{{ t("moderation.chatUsers.user") }}</th>
              <th class="py-2 pr-4 font-medium">{{ t("moderation.chatUsers.warnings") }}</th>
              <th class="py-2 pr-4 font-medium">{{ t("moderation.chatUsers.ban") }}</th>
              <th class="py-2 font-medium">{{ t("moderation.chatUsers.actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="row in chatUsers" :key="row.user_id">
              <td class="py-2 pr-4 align-top">
                <div class="font-medium">
                  {{
                    row.username
                      ? `@${row.username}`
                      : row.first_name || t("moderation.chatUsers.userFallback", { userId: row.user_id })
                  }}
                </div>
                <div class="text-xs text-gray-500">{{ row.user_id }}</div>
              </td>
              <td class="py-2 pr-4 align-top">{{ row.warnings_count }}</td>
              <td class="py-2 pr-4 align-top">
                <span
                  v-if="row.is_banned"
                  class="inline-flex px-2 py-0.5 rounded text-xs bg-red-100 text-red-800"
                >
                  {{ t("moderation.chatUsers.banned") }}
                </span>
                <span v-else class="text-gray-500">{{ t("common.dash") }}</span>
              </td>
              <td class="py-2 align-top">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    :disabled="userActionBusy === row.user_id || row.warnings_count === 0"
                    @click="runUserAction(row.user_id, 'reset-warnings')"
                  >
                    {{ t("moderation.chatUsers.resetWarn") }}
                  </button>
                  <button
                    type="button"
                    class="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    :disabled="userActionBusy === row.user_id || !row.is_banned"
                    @click="runUserAction(row.user_id, 'unban')"
                  >
                    {{ t("moderation.chatUsers.unban") }}
                  </button>
                  <button
                    type="button"
                    class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    :disabled="
                      userActionBusy === row.user_id ||
                      (row.warnings_count === 0 && !row.is_banned)
                    "
                    @click="runUserAction(row.user_id, 'pardon')"
                  >
                    {{ t("moderation.chatUsers.pardon") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="usersPagination.total_pages > 1"
          class="flex items-center justify-between gap-3 mt-4 pt-3 border-t text-sm"
        >
          <span class="text-gray-500">
            {{
              t("common.pageOfWithTotal", {
                page: usersPagination.page,
                totalPages: usersPagination.total_pages,
                total: usersPagination.total,
              })
            }}
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              :disabled="usersLoading || usersPagination.page <= 1"
              @click="goToUsersPage(usersPagination.page - 1)"
            >
              {{ t("common.previous") }}
            </button>
            <button
              type="button"
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              :disabled="
                usersLoading || usersPagination.page >= usersPagination.total_pages
              "
              @click="goToUsersPage(usersPagination.page + 1)"
            >
              {{ t("common.next") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showTemplateLibrary"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 class="text-lg font-semibold">{{ t("moderation.templateLibrary.title") }}</h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ t("moderation.templateLibrary.description") }}
            </p>
          </div>
          <button
            type="button"
            class="text-sm text-gray-500 hover:text-gray-800"
            @click="closeTemplateLibrary"
          >
            {{ t("common.close") }}
          </button>
        </div>

        <div v-if="templatesLoading" class="text-gray-500 text-sm">
          {{ t("moderation.templateLibrary.loading") }}
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="template in templateCatalog"
            :key="template.id"
            class="border rounded p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="font-medium">{{ template.name }}</h4>
                <p class="text-sm text-gray-600 mt-1">
                  {{ template.description }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 px-3 py-2 rounded text-sm"
                :class="
                  template.added
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                "
                :disabled="template.added || addingTemplateId === template.id"
                @click="addTemplate(template.id)"
              >
                {{
                  template.added
                    ? t("common.added")
                    : addingTemplateId === template.id
                      ? t("common.adding")
                      : t("common.add")
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ editingRule ? t("moderation.ruleModal.editTitle") : t("moderation.ruleModal.addTitle") }}
        </h3>

        <form class="space-y-4" @submit.prevent="saveRule">
          <div
            v-if="saveError"
            class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm"
          >
            {{ saveError }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{
              t("moderation.ruleModal.nameLabel")
            }}</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{
              t("moderation.ruleModal.descriptionLabel")
            }}</label>
            <input
              v-model="form.description"
              type="text"
              class="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{
              t("moderation.ruleModal.criteriaLabel")
            }}</label>
            <textarea
              v-model="form.ai_prompt"
              class="w-full border rounded px-3 py-2"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="border-t pt-4 space-y-3">
            <h4 class="font-medium text-gray-700">{{ t("moderation.ruleModal.actionsTitle") }}</h4>

            <label class="flex items-center">
              <input
                v-model="form.delete_on_violation"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">{{ t("moderation.ruleModal.deleteOnViolation") }}</span>
            </label>

            <label class="flex items-center">
              <input
                v-model="form.ban_on_violation"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">{{ t("moderation.ruleModal.banAfterWarnings") }}</span>
            </label>

            <div v-if="form.ban_on_violation">
              <label class="block text-sm font-medium text-gray-700 mb-1">{{
                t("moderation.ruleModal.warningsBeforeBanLabel")
              }}</label>
              <input
                v-model.number="form.warnings_before_ban"
                type="number"
                min="1"
                max="20"
                class="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="saving"
            >
              {{
                saving
                  ? t("common.saving")
                  : editingRule
                    ? t("common.update")
                    : t("common.create")
              }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50"
              @click="closeModal"
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
import { ref, onMounted } from "vue";

const { t } = useI18n();

const route = useRoute();
const botId = route.params.id as string;
const telegramChatId = route.params.chatId as string;

interface RuleForm {
  name: string;
  description: string;
  ai_prompt: string;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number;
}

interface TemplateCatalogItem {
  id: string;
  name: string;
  description: string;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number | null;
  added: boolean;
}

const rulesApiBase = `/api/bots/${botId}/chats/${telegramChatId}/rules`;
const templatesApiBase = `/api/bots/${botId}/chats/${telegramChatId}`;
const usersApiBase = `/api/bots/${botId}/chats/${telegramChatId}/users`;

interface ChatUserRow {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  warnings_count: number;
  is_banned: boolean;
  banned_at: string | null;
  last_activity: string;
}

const rules = ref<any[]>([]);
const chatUsers = ref<ChatUserRow[]>([]);
const chatName = ref("");
const loading = ref(false);
const usersLoading = ref(false);
const userActionError = ref<string | null>(null);
const userActionBusy = ref<number | null>(null);
const usersPagination = ref({
  page: 1,
  limit: 25,
  total: 0,
  total_pages: 1,
});

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: `@${botId}`, to: `/bots/${botId}` },
  { label: chatName.value || t("page.moderation.chatSubtitle", { chatId: telegramChatId }) },
  { label: t("page.moderation.title") },
]);

usePageTitle(() =>
  chatName.value
    ? t("page.moderation.documentTitleWithChat", { chatName: chatName.value })
    : t("page.moderation.documentTitle")
);

const saving = ref(false);
const templateError = ref<string | null>(null);
const ruleActionError = ref<string | null>(null);
const saveError = ref<string | null>(null);
const showModal = ref(false);
const showTemplateLibrary = ref(false);
const templatesLoading = ref(false);
const addingTemplateId = ref<string | null>(null);
const templateCatalog = ref<TemplateCatalogItem[]>([]);
const editingRule = ref<any | null>(null);

const emptyForm = (): RuleForm => ({
  name: "",
  description: "",
  ai_prompt: "",
  delete_on_violation: false,
  ban_on_violation: false,
  warnings_before_ban: 3,
});

const form = ref<RuleForm>(emptyForm());

async function loadChatName() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`);
    const chat = resp?.data?.chats?.find(
      (item: { chat_id: number }) => String(item.chat_id) === telegramChatId
    );
    chatName.value = chat?.name ?? "";
  } catch {
    chatName.value = "";
  }
}

async function loadUsers(page = usersPagination.value.page) {
  usersLoading.value = true;
  userActionError.value = null;
  try {
    const resp = await $fetch<{
      data?: {
        users?: ChatUserRow[];
        pagination?: typeof usersPagination.value;
      };
    }>(usersApiBase, {
      query: { page, limit: usersPagination.value.limit },
    });
    chatUsers.value = resp?.data?.users ?? [];
    if (resp?.data?.pagination) {
      usersPagination.value = resp.data.pagination;
    }
  } catch (error) {
    userActionError.value = readFetchError(error, t("common.errors.loadChatUsers"));
    console.error("Error loading chat users:", error);
  } finally {
    usersLoading.value = false;
  }
}

async function goToUsersPage(page: number) {
  if (page < 1 || page > usersPagination.value.total_pages) {
    return;
  }
  await loadUsers(page);
}

type UserModerationAction = "pardon" | "reset-warnings" | "unban";

async function runUserAction(userId: number, action: UserModerationAction) {
  userActionBusy.value = userId;
  userActionError.value = null;
  try {
    await $fetch(`${usersApiBase}/${userId}/${action}`, {
      method: "POST",
      body: {},
    });
    await loadUsers();
  } catch (error) {
    userActionError.value = readFetchError(error, t("common.errors.updateUser"));
    console.error("Error updating chat user:", error);
  } finally {
    userActionBusy.value = null;
  }
}

async function load() {
  loading.value = true;
  try {
    const resp = await $fetch<any>(rulesApiBase);
    rules.value = resp?.data?.rules || [];
  } catch (error) {
    console.error("Error loading rules:", error);
  } finally {
    loading.value = false;
  }
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

async function loadTemplateCatalog() {
  templatesLoading.value = true;
  try {
    const resp = await $fetch<{
      data?: { templates?: TemplateCatalogItem[] };
    }>(`${templatesApiBase}/rule-templates`);
    templateCatalog.value = resp?.data?.templates ?? [];
  } catch (error) {
    templateError.value = readFetchError(error, t("common.errors.loadRuleTemplates"));
    console.error("Error loading rule templates:", error);
  } finally {
    templatesLoading.value = false;
  }
}

async function openTemplateLibrary() {
  templateError.value = null;
  showTemplateLibrary.value = true;
  await loadTemplateCatalog();
}

function closeTemplateLibrary() {
  showTemplateLibrary.value = false;
}

async function addTemplate(templateId: string) {
  addingTemplateId.value = templateId;
  templateError.value = null;
  try {
    await $fetch(`${templatesApiBase}/rule-templates`, {
      method: "POST",
      body: { template_id: templateId },
    });
    await load();
    await loadTemplateCatalog();
  } catch (error) {
    templateError.value = readFetchError(error, t("common.errors.addRuleTemplate"));
    console.error("Error adding template:", error);
  } finally {
    addingTemplateId.value = null;
  }
}

function openCreateModal() {
  editingRule.value = null;
  form.value = emptyForm();
  saveError.value = null;
  showModal.value = true;
}

function openEditModal(rule: any) {
  saveError.value = null;
  editingRule.value = rule;
  form.value = {
    name: rule.name,
    description: rule.description,
    ai_prompt: rule.ai_prompt,
    delete_on_violation: Boolean(rule.delete_on_violation),
    ban_on_violation: Boolean(rule.ban_on_violation),
    warnings_before_ban: rule.warnings_before_ban ?? 3,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingRule.value = null;
  form.value = emptyForm();
  saveError.value = null;
}

async function saveRule() {
  saving.value = true;
  saveError.value = null;
  ruleActionError.value = null;
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      ai_prompt: form.value.ai_prompt,
      delete_on_violation: form.value.delete_on_violation,
      ban_on_violation: form.value.ban_on_violation,
      warnings_before_ban: form.value.ban_on_violation
        ? form.value.warnings_before_ban
        : null,
    };

    if (editingRule.value) {
      await $fetch(`${rulesApiBase}/${editingRule.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $fetch(rulesApiBase, {
        method: "POST",
        body: payload,
      });
    }

    closeModal();
    await load();
  } catch (error) {
    saveError.value = readFetchError(error, t("common.errors.saveRule"));
    console.error("Error saving rule:", error);
  } finally {
    saving.value = false;
  }
}

async function deleteRule(rule: any) {
  if (!confirm(t("common.confirm.deleteRule", { name: rule.name }))) {
    return;
  }

  ruleActionError.value = null;
  try {
    await $fetch(`${rulesApiBase}/${rule.id}`, { method: "DELETE" });
    await load();
  } catch (error) {
    ruleActionError.value = readFetchError(error, t("common.errors.deleteRule"));
    console.error("Error deleting rule:", error);
  }
}

onMounted(async () => {
  await Promise.all([loadChatName(), load(), loadUsers()]);
});
</script>
