<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Rules</h2>
      <button
        @click="openCreateModal"
        class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
      >
        Add Rule
      </button>
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
              @click="openEditModal(rule)"
              class="text-blue-600 text-sm hover:underline"
            >
              Edit
            </button>
            <button
              @click="deleteRule(rule)"
              class="text-red-600 text-sm hover:underline"
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
          <div>
            Whitelist entries: {{ rule.whitelist?.length || 0 }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && rules.length === 0" class="text-gray-500">
      No rules yet. Create your first moderation rule.
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ editingRule ? "Edit Rule" : "Add Rule" }}
        </h3>

        <form @submit.prevent="saveRule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Rule Name</label
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
              >Rule criteria</label
            >
            <p class="text-xs text-gray-500 mb-1">
              Describe what counts as a violation. Moderation instructions for
              the AI are applied automatically on the server.
            </p>
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

          <div class="border-t pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-700">Whitelist</h4>
              <button
                type="button"
                @click="addWhitelistEntry"
                class="text-sm text-blue-600 hover:underline"
              >
                Add entry
              </button>
            </div>
            <p class="text-xs text-gray-500">
              Whitelisted users skip this rule entirely. Enter a Telegram user ID
              (digits only) or @username (with or without @).
            </p>

            <div
              v-if="form.whitelist.length === 0"
              class="text-sm text-gray-500"
            >
              No whitelist entries.
            </div>

            <div
              v-for="(_entry, index) in form.whitelist"
              :key="index"
              class="flex gap-2 items-end"
            >
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">Entry</label>
                <input
                  v-model="form.whitelist[index]"
                  type="text"
                  class="w-full border rounded px-2 py-1 text-sm"
                  placeholder="123456789 or @username"
                />
              </div>
              <button
                type="button"
                @click="removeWhitelistEntry(index)"
                class="text-red-600 text-sm px-2 py-1"
              >
                Remove
              </button>
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
              @click="closeModal"
              class="px-3 py-2 border rounded hover:bg-gray-50"
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

interface RuleForm {
  name: string;
  description: string;
  ai_prompt: string;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number;
  whitelist: string[];
}

const rules = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const editingRule = ref<any | null>(null);

const emptyForm = (): RuleForm => ({
  name: "",
  description: "",
  ai_prompt: "",
  delete_on_violation: false,
  ban_on_violation: false,
  warnings_before_ban: 3,
  whitelist: [],
});

const form = ref<RuleForm>(emptyForm());

async function load() {
  loading.value = true;
  try {
    const resp = await $fetch<any>("/api/config/rules");
    rules.value = resp?.data?.rules || [];
  } catch (error) {
    console.error("Error loading rules:", error);
  } finally {
    loading.value = false;
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
    whitelist: [...(rule.whitelist || [])],
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingRule.value = null;
  form.value = emptyForm();
}

function addWhitelistEntry() {
  form.value.whitelist.push("");
}

function removeWhitelistEntry(index: number) {
  form.value.whitelist.splice(index, 1);
}

function buildWhitelistPayload() {
  return form.value.whitelist
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
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
      whitelist: buildWhitelistPayload(),
    };

    if (editingRule.value) {
      await $fetch(`/api/config/rules/${editingRule.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $fetch("/api/config/rules", {
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
    await $fetch(`/api/config/rules/${rule.id}`, { method: "DELETE" });
    await load();
  } catch (error) {
    console.error("Error deleting rule:", error);
  }
}

onMounted(load);
useOnWorkspaceSwitch(() => load());
</script>
