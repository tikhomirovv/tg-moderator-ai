<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">Chat moderation</h2>
        <p class="text-sm text-gray-500">
          Bot @{{ botId }} · {{ chatName || `Chat ${telegramChatId}` }}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
          @click="openTemplateLibrary"
        >
          Add from template
        </button>
        <NuxtLink
          :to="`/bots/${botId}`"
          class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
        >
          Back to bot
        </NuxtLink>
        <button
          type="button"
          class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          @click="openCreateModal"
        >
          Add rule
        </button>
      </div>
    </div>

    <div
      v-if="templateError"
      class="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm"
    >
      {{ templateError }}
    </div>

    <div v-if="loading" class="text-gray-500">Loading...</div>

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
              Edit
            </button>
            <button
              type="button"
              class="text-red-600 text-sm hover:underline"
              @click="deleteRule(rule)"
            >
              Delete
            </button>
          </div>
        </div>

        <p class="text-sm text-gray-600 mb-2">{{ rule.description }}</p>

        <div class="text-xs text-gray-500 space-y-1">
          <div>
            Delete on violation:
            <span class="font-medium">{{
              rule.delete_on_violation ? "Yes" : "No"
            }}</span>
          </div>
          <div>
            Ban on violation:
            <span class="font-medium">{{
              rule.ban_on_violation ? "Yes" : "No"
            }}</span>
            <span v-if="rule.ban_on_violation">
              (after {{ rule.warnings_before_ban ?? 3 }} warnings)
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && rules.length === 0" class="text-gray-500">
      No rules yet. Add a custom rule or pick a preset template.
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
            <h3 class="text-lg font-semibold">Rule templates</h3>
            <p class="text-sm text-gray-600 mt-1">
              Preset moderation rules. Each copy is independent for this chat.
            </p>
          </div>
          <button
            type="button"
            class="text-sm text-gray-500 hover:text-gray-800"
            @click="closeTemplateLibrary"
          >
            Close
          </button>
        </div>

        <div v-if="templatesLoading" class="text-gray-500 text-sm">
          Loading templates...
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
                    ? "Added"
                    : addingTemplateId === template.id
                      ? "Adding..."
                      : "Add"
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
          {{ editingRule ? "Edit rule" : "Add rule" }}
        </h3>

        <form class="space-y-4" @submit.prevent="saveRule">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Rule name</label
            >
            <input
              v-model="form.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Description</label
            >
            <input
              v-model="form.description"
              type="text"
              class="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Criteria</label
            >
            <textarea
              v-model="form.ai_prompt"
              class="w-full border rounded px-3 py-2"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="border-t pt-4 space-y-3">
            <h4 class="font-medium text-gray-700">Actions on violation</h4>

            <label class="flex items-center">
              <input
                v-model="form.delete_on_violation"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">Delete message on violation</span>
            </label>

            <label class="flex items-center">
              <input
                v-model="form.ban_on_violation"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">Ban user after warnings threshold</span>
            </label>

            <div v-if="form.ban_on_violation">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Warnings before ban</label
              >
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
              {{ saving ? "Saving..." : editingRule ? "Update" : "Create" }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50"
              @click="closeModal"
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

const rules = ref<any[]>([]);
const chatName = ref("");
const loading = ref(false);

usePageTitle(() =>
  chatName.value ? `Правила · ${chatName.value}` : "Правила"
);
const saving = ref(false);
const templateError = ref<string | null>(null);
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
    templateError.value = readFetchError(error, "Failed to load rule templates");
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
    templateError.value = readFetchError(error, "Failed to add rule template");
    console.error("Error adding template:", error);
  } finally {
    addingTemplateId.value = null;
  }
}

function openCreateModal() {
  editingRule.value = null;
  form.value = emptyForm();
  showModal.value = true;
}

function openEditModal(rule: any) {
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
}

async function saveRule() {
  saving.value = true;
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
    console.error("Error saving rule:", error);
  } finally {
    saving.value = false;
  }
}

async function deleteRule(rule: any) {
  if (!confirm(`Delete rule "${rule.name}"?`)) {
    return;
  }

  try {
    await $fetch(`${rulesApiBase}/${rule.id}`, { method: "DELETE" });
    await load();
  } catch (error) {
    console.error("Error deleting rule:", error);
  }
}

onMounted(async () => {
  await Promise.all([loadChatName(), load()]);
});
</script>
