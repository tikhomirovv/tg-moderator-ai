<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Rules</h2>
      <div class="flex gap-2">
        <button
          @click="showAddModal = true"
          class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Add Rule
        </button>
        <button
          @click="save"
          class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Save
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="(rule, key) in rules"
        :key="key"
        class="bg-white border rounded p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium">{{ rule.name }}</h3>
          <span class="text-xs px-2 py-0.5 rounded bg-gray-100">{{
            rule.severity
          }}</span>
        </div>
        <p class="text-sm text-gray-600 mb-2">{{ rule.description }}</p>
        <textarea
          v-model="rule.ai_prompt"
          class="w-full border rounded p-2 text-sm"
          rows="4"
        ></textarea>
      </div>
    </div>

    <!-- Modal для добавления правила -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Add New Rule</h3>

        <form @submit.prevent="createRule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Rule ID</label
            >
            <input
              v-model="newRule.id"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="custom_rule"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Rule Name</label
            >
            <input
              v-model="newRule.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="Custom Rule"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Description</label
            >
            <input
              v-model="newRule.description"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="Description of the rule"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Severity</label
            >
            <select
              v-model="newRule.severity"
              class="w-full border rounded px-3 py-2"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >AI Prompt</label
            >
            <textarea
              v-model="newRule.ai_prompt"
              class="w-full border rounded px-3 py-2"
              rows="4"
              placeholder="Instructions for AI analysis..."
              required
            ></textarea>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="creating"
            >
              {{ creating ? "Creating..." : "Create Rule" }}
            </button>
            <button
              type="button"
              @click="showAddModal = false"
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

const rules = ref<Record<string, any>>({});
const creating = ref(false);
const showAddModal = ref(false);

const newRule = ref({
  id: "",
  name: "",
  description: "",
  severity: "medium",
  ai_prompt: "",
});

async function load() {
  try {
    const resp = await $fetch<any>("/api/config/rules");
    const rulesArray = resp?.data?.rules || [];

    // Преобразуем массив в объект с ключами по id
    const rulesObject: Record<string, any> = {};
    rulesArray.forEach((rule: any) => {
      rulesObject[rule.id] = rule;
    });

    rules.value = rulesObject;
  } catch (error) {
    console.error("Error loading rules:", error);
  }
}

async function save() {
  try {
    // Преобразуем обратно в массив для сохранения
    const rulesArray = Object.values(rules.value);

    await $fetch("/api/config/rules", {
      method: "PUT",
      body: { rules: rulesArray },
    });
  } catch (error) {
    console.error("Error saving rules:", error);
  }
}

async function createRule() {
  creating.value = true;
  try {
    // Добавляем новое правило в локальное состояние
    rules.value[newRule.value.id] = { ...newRule.value };

    // Сохраняем все правила
    await save();

    // Очищаем форму и закрываем модальное окно
    newRule.value = {
      id: "",
      name: "",
      description: "",
      severity: "medium",
      ai_prompt: "",
    };
    showAddModal.value = false;
  } catch (error) {
    console.error("Error creating rule:", error);
  } finally {
    creating.value = false;
  }
}

onMounted(load);
</script>
