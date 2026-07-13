<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="emit('close')"
    >
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bot-message-html-help-title"
        class="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        tabindex="-1"
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <h3 id="bot-message-html-help-title" class="text-lg font-semibold">
            Формат Telegram HTML
          </h3>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-800 text-xl leading-none"
            aria-label="Закрыть"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <div class="space-y-4 text-sm text-gray-700">
          <section v-for="section in BOT_MESSAGE_HTML_HELP" :key="section.title">
            <h4 class="font-medium text-gray-900 mb-1">{{ section.title }}</h4>
            <p>{{ section.body }}</p>
            <p
              v-if="section.example"
              class="mt-2 font-mono text-xs bg-gray-50 border rounded px-2 py-1 whitespace-pre-wrap"
            >
              {{ section.example }}
            </p>
          </section>

          <p>
            <a
              :href="TELEGRAM_HTML_DOCS_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline"
            >
              Официальная документация Telegram Bot API — HTML
            </a>
          </p>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            @click="emit('close')"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  BOT_MESSAGE_HTML_HELP,
  TELEGRAM_HTML_DOCS_URL,
} from "~/lib/bot-message-template-ui";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const dialogRef = ref<HTMLElement | null>(null);

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    emit("close");
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      requestAnimationFrame(() => dialogRef.value?.focus());
    }
  }
);

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>
