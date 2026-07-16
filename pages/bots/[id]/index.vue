<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="bot?.name ?? t('page.botDetail.titleFallback')"
      :subtitle="bot ? `@${bot.id}` : undefined"
    >
      <template #actions>
        <button
          @click="toggleBotStatus"
          :class="
            bot?.is_active
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          "
          class="px-3 py-2 text-white rounded text-sm"
        >
          {{ bot?.is_active ? t("common.disable") : t("common.enable") }}
        </button>
      </template>
    </LayoutPageHeader>

    <div v-if="loading" class="text-gray-500">{{ t("common.loading") }}</div>

    <template v-else>
      <div
        v-if="chatActivation.status.value !== 'idle'"
        class="mb-4 rounded border p-4 text-sm"
        :class="activationBannerClass"
      >
        <p>{{ chatActivation.message.value }}</p>
        <button
          v-if="chatActivation.status.value === 'failed' || chatActivation.status.value === 'expired'"
          type="button"
          class="mt-2 text-blue-700 hover:underline"
          @click="retryChatActivation"
        >
          {{ t("chat.activation.retry") }}
        </button>
      </div>

      <div v-if="bot" class="space-y-6">
      <div class="flex gap-1 border-b">
        <button
          v-for="tab in botTabs"
          :key="tab.id"
          type="button"
          class="px-4 py-2 text-sm border-b-2 -mb-px"
          :class="
            activeTab === tab.id
              ? 'border-blue-600 text-blue-700 font-medium'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <template v-if="activeTab === 'overview'">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
          :class="overviewStatusBadgeClass"
        >
          {{ aggregatedStatusText }}
        </span>
        <span
          v-if="bot.my_role"
          class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
        >
          {{ roleLabel(bot.my_role) }}
        </span>
        <span class="inline-flex px-2.5 py-1 rounded-full text-xs text-gray-600 bg-gray-50">
          {{ t("bot.created", { date: formatDate(bot.created_at) }) }}
        </span>
        <template v-if="isSaas">
          <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
            {{ t("billing.balance") }}: {{ (bot.credit_balance ?? 0).toLocaleString() }}
          </span>
          <NuxtLink
            :to="`/bots/${botId}/credits`"
            class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-800 hover:bg-green-100"
          >
            {{ t("billing.manageCredits") }}
          </NuxtLink>
        </template>
        <p
          v-if="deliveryProblemMessage"
          class="w-full text-sm text-red-600"
        >
          {{ deliveryProblemMessage }}
        </p>
      </div>

      <!-- Чаты -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">
            {{ t("bot.chats.title", { count: bot.chats?.length || 0 }) }}
          </h3>
          <button
            v-if="canManageBot"
            type="button"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            :disabled="chatActivation.status.value === 'waiting'"
            @click="openAddChatActivationModal"
          >
            {{ t("bot.chats.addChat") }}
          </button>
        </div>
        <div v-if="bot.chats && bot.chats.length > 0" class="space-y-3">
          <div
            v-for="chat in bot.chats"
            :key="chat.chat_id"
            class="border rounded p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <img
                  v-if="chat.id && chat.photo_file_id"
                  :src="chatPhotoUrl(chat.id)"
                  :alt="chat.name"
                  class="h-10 w-10 rounded-full object-cover bg-gray-100"
                />
                <div
                  v-else
                  class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                >
                  {{ t("bot.chats.placeholderInitials") }}
                </div>
                <div class="min-w-0">
                  <div class="font-medium truncate">{{ chat.name }}</div>
                  <div class="text-sm text-gray-600">{{ t("bot.chats.id", { id: chat.chat_id }) }}</div>
                  <div class="text-sm text-gray-600">
                    {{ t("bot.chats.rules", { count: chat.rules_count || 0 }) }}
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ t("bot.chats.silentMode") }}
                    <span :class="getSilentModeClass(chat)">
                      {{ getSilentModeText(chat) }}
                    </span>
                  </div>
                  <div class="mt-1">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                      :class="chatHealthBadgeClass(chat)"
                    >
                      {{ chatHealthLabel(chat) }}
                    </span>
                    <p
                      v-if="chat.health_message && chat.health_status !== 'ok'"
                      class="text-xs text-red-600 mt-1"
                    >
                      {{ chat.health_message }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <NuxtLink
                  :to="`/bots/${botId}/chats/${chat.chat_id}/moderation`"
                  class="text-green-700 text-sm hover:underline"
                >
                  {{ t("bot.chats.moderation") }}
                </NuxtLink>
                <button
                  @click="editChat(chat)"
                  class="text-blue-600 text-sm hover:underline"
                >
                  {{ t("common.edit") }}
                </button>
                <button
                  @click="removeChat(chat.chat_id)"
                  class="text-red-600 text-sm hover:underline"
                >
                  {{ t("common.remove") }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500">{{ t("bot.chats.noChats") }}</div>
      </div>

      <!-- Статистика -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">{{ t("bot.statistics.title") }}</h3>
          <button
            @click="loadStatistics"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {{ t("common.refresh") }}
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ statistics?.today?.messages_processed || 0 }}
            </div>
            <div class="text-sm text-gray-600">{{ t("bot.statistics.messagesToday") }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-600">
              {{ statistics?.today?.warnings_issued || 0 }}
            </div>
            <div class="text-sm text-gray-600">{{ t("bot.statistics.warningsToday") }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">
              {{ statistics?.users?.banned_count || 0 }}
            </div>
            <div class="text-sm text-gray-600">{{ t("bot.statistics.bannedTotal") }}</div>
          </div>
          <div
            v-if="isSaas && (statistics?.today?.not_moderated || 0) > 0"
            class="text-center md:col-span-3"
          >
            <div class="rounded border border-amber-200 bg-amber-50 p-4">
              <div class="text-2xl font-bold text-amber-700">
                {{ statistics?.today?.not_moderated || 0 }}
              </div>
              <div class="text-sm text-amber-900 font-medium">
                {{ t("bot.statistics.notModeratedToday") }}
              </div>
              <p class="text-xs text-amber-800 mt-1">
                {{ t("bot.statistics.notModeratedHint") }}
              </p>
            </div>
          </div>
        </div>

        <!-- Дополнительная статистика -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 rounded p-4">
            <h4 class="font-medium text-gray-700 mb-2">{{ t("bot.statistics.thisWeek") }}</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>{{ t("bot.statistics.totalMessages") }}</span>
                <span class="font-medium">{{
                  statistics?.week?.total_messages_processed || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>{{ t("bot.statistics.totalWarnings") }}</span>
                <span class="font-medium">{{
                  statistics?.week?.total_warnings_issued || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>{{ t("bot.statistics.messagesDeleted") }}</span>
                <span class="font-medium">{{
                  statistics?.week?.total_messages_deleted || 0
                }}</span>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 rounded p-4">
            <h4 class="font-medium text-gray-700 mb-2">{{ t("bot.statistics.usersSection") }}</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>{{ t("bot.statistics.active24h") }}</span>
                <span class="font-medium text-green-600">{{
                  statistics?.users?.active_count || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>{{ t("bot.statistics.banned") }}</span>
                <span class="font-medium text-red-600">{{
                  statistics?.users?.banned_count || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>{{ t("bot.statistics.maxUnique") }}</span>
                <span class="font-medium">{{
                  statistics?.week?.max_unique_users || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="bg-white border rounded p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">{{ t("bot.recentActivity.title") }}</h3>
          <div class="flex gap-2">
            <NuxtLink
              :to="`/bots/${botId}/audit`"
              class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
            >
              {{ t("bot.recentActivity.audit") }}
            </NuxtLink>
            <button
              @click="loadLogs"
              class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {{ t("common.refresh") }}
            </button>
          </div>
        </div>
        <div v-if="logs.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="log in logs"
            :key="log.id"
            class="border rounded p-2 text-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium">{{ log.action }}</span>
                <span class="text-gray-600"> - {{ log.message }}</span>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(log.timestamp) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-4">
          {{ t("bot.recentActivity.empty") }}
        </div>
      </div>

      <div v-if="isOwner" class="bg-white border border-red-200 rounded p-6">
        <h3 class="text-lg font-medium text-red-700 mb-2">{{ t("bot.dangerZone.title") }}</h3>
        <p class="text-sm text-gray-600 mb-4">
          {{ t("bot.dangerZone.description") }}
        </p>

        <div v-if="!showDeleteConfirm" class="flex">
          <button
            type="button"
            class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            @click="openDeleteConfirm"
          >
            {{ t("bot.dangerZone.deleteButton") }}
          </button>
        </div>

        <div v-else class="space-y-3 max-w-md">
          <p class="text-sm text-gray-700">
            {{ t("bot.dangerZone.confirmHint", { botId: bot.id }) }}
          </p>
          <input
            v-model="deleteConfirmText"
            type="text"
            class="w-full border rounded px-3 py-2 text-sm"
            :placeholder="t('bot.dangerZone.confirmPlaceholder', { botId: bot.id })"
          />
          <p v-if="deleteError" class="text-sm text-red-600">{{ deleteError }}</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
              :disabled="!canConfirmDelete || deletingBot"
              @click="deleteBot"
            >
              {{ deletingBot ? t("bot.dangerZone.deleting") : t("bot.dangerZone.confirmButton") }}
            </button>
            <button
              type="button"
              class="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
              :disabled="deletingBot"
              @click="cancelDeleteConfirm"
            >
              {{ t("common.cancel") }}
            </button>
          </div>
        </div>
      </div>
      </template>

      <div
        v-if="activeTab === 'moderation'"
        class="bg-white border rounded p-6"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          <h3 class="text-lg font-medium">{{ t("bot.messageTemplates.title") }}</h3>
          <button
            type="button"
            class="text-sm text-blue-600 hover:underline"
            @click="showHtmlHelpModal = true"
          >
            {{ t("bot.messageTemplates.helpLink") }}
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          {{ t("bot.messageTemplates.description") }}
        </p>

        <div class="flex gap-2 mb-4 border-b">
          <button
            type="button"
            class="px-3 py-2 text-sm border-b-2 -mb-px"
            :class="
              messageTemplateTab === 'warning'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="messageTemplateTab = 'warning'"
          >
            {{ t("bot.messageTemplates.warningTab") }}
          </button>
          <button
            type="button"
            class="px-3 py-2 text-sm border-b-2 -mb-px"
            :class="
              messageTemplateTab === 'ban'
                ? 'border-blue-600 text-blue-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="messageTemplateTab = 'ban'"
          >
            {{ t("bot.messageTemplates.banTab") }}
          </button>
        </div>

        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="chip in activeTemplateChips"
            :key="chip.key"
            type="button"
            class="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
            :title="t(chip.hintKey)"
            @click="insertTemplatePlaceholder(chip.key)"
          >
            {{ t(chip.labelKey) }}
          </button>
        </div>

        <textarea
          ref="templateTextareaRef"
          v-model="activeTemplateDraft"
          rows="8"
          class="w-full border rounded px-3 py-2 font-mono text-sm"
        />

        <p v-if="templateSaveError" class="text-sm text-red-600 mt-2">
          {{ templateSaveError }}
        </p>
        <p v-if="templateSaveSuccess" class="text-sm text-green-600 mt-2">
          {{ t("bot.messageTemplates.saved") }}
        </p>

        <div class="flex gap-2 mt-4">
          <button
            type="button"
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            :disabled="savingTemplates"
            @click="saveMessageTemplates"
          >
            {{ savingTemplates ? t("common.saving") : t("common.save") }}
          </button>
          <button
            type="button"
            class="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            :disabled="savingTemplates"
            @click="resetAndSaveMessageTemplates"
          >
            {{ t("bot.messageTemplates.resetToDefault") }}
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'team'" class="bg-white border rounded p-6">
        <h3 class="text-lg font-medium mb-4">{{ t("bot.team.title") }}</h3>
        <div v-if="teamLoading" class="text-gray-500 text-sm">{{ t("bot.team.loading") }}</div>
        <div v-else class="space-y-4">
          <div v-if="isOwner && accessCode" class="flex flex-wrap items-center gap-3">
            <div class="text-sm">
              {{ t("bot.team.accessCode") }}
              <code class="bg-gray-100 px-2 py-1 rounded">{{ accessCode }}</code>
            </div>
            <button
              type="button"
              class="text-sm text-blue-600 hover:underline"
              @click="copyAccessCode"
            >
              {{ t("common.copy") }}
            </button>
            <button
              type="button"
              class="text-sm text-red-600 hover:underline"
              @click="revokeAccessCode"
            >
              {{ t("common.revoke") }}
            </button>
          </div>
          <p v-else-if="isOwner" class="text-sm text-gray-500">
            {{ t("bot.team.accessCodeForOperators") }}
          </p>
          <p v-else class="text-sm text-gray-500">
            {{ t("bot.team.ownerManagesTeam") }}
          </p>

          <div v-if="teamMembers.length" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700">{{ t("bot.team.members") }}</h4>
            <div
              v-for="member in teamMembers"
              :key="member.user_id"
              class="flex items-center justify-between text-sm border rounded px-3 py-2"
            >
              <div>
                <span class="font-medium">
                  {{ member.username ? `@${member.username}` : member.name }}
                </span>
                <span class="text-gray-500 ml-2">{{ roleLabel(member.role) }}</span>
              </div>
              <button
                v-if="isOwner && member.role === 'manager' && member.user_id !== bot?.my_user_id"
                type="button"
                class="text-red-600 hover:underline"
                @click="removeMember(member.user_id)"
              >
                {{ t("common.remove") }}
              </button>
              <button
                v-else-if="isOwner && member.role === 'manager' && member.user_id === bot?.my_user_id"
                type="button"
                class="text-red-600 hover:underline"
                @click="removeMember(member.user_id)"
              >
                {{ t("common.leaveTeam") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      <div v-else class="text-gray-500">{{ t("page.botDetail.notFound") }}</div>
    </template>

    <!-- Add Chat activation -->
    <div
      v-if="showAddChatActivationModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeAddChatActivationModal"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-chat-activation-title"
      >
        <h3 id="add-chat-activation-title" class="text-lg font-semibold mb-2">
          {{ t("chatActivation.modal.title") }}
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          {{ t("chatActivation.modal.intro") }}
        </p>

        <ul class="text-sm text-gray-600 list-disc pl-5 mb-4 space-y-1">
          <li v-for="(item, index) in activationPrerequisites" :key="index">
            {{ item }}
          </li>
        </ul>

        <div class="space-y-3">
          <button
            type="button"
            class="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm text-left"
            @click="startChatActivation('new_group')"
          >
            <span class="font-medium">{{ t("chatActivation.modal.newGroupTitle") }}</span>
            <span class="block text-blue-100 text-xs mt-1">
              {{ t("chatActivation.modal.newGroupHint") }}
            </span>
          </button>
          <button
            type="button"
            class="w-full px-3 py-2 border rounded hover:bg-gray-50 text-sm text-left"
            @click="startChatActivation('existing_group')"
          >
            <span class="font-medium">{{ t("chatActivation.modal.existingGroupTitle") }}</span>
            <span class="block text-gray-500 text-xs mt-1">
              {{ t("chatActivation.modal.existingGroupHint") }}
            </span>
          </button>
        </div>

        <button
          type="button"
          class="mt-4 w-full px-3 py-2 border rounded hover:bg-gray-50 text-sm"
          @click="closeAddChatActivationModal"
        >
          {{ t("common.cancel") }}
        </button>
      </div>
    </div>

    <!-- Modal for chat silent mode -->
    <div
      v-if="showAddChatModal && editingChat"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">{{ t("bot.chats.editModal.title") }}</h3>

        <form @submit.prevent="saveChat" class="space-y-4">
          <div class="text-sm text-gray-600">
            <div class="font-medium">{{ editingChat?.name }}</div>
            <div>{{ t("bot.chats.id", { id: editingChat?.chat_id }) }}</div>
          </div>

          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-700 mb-3">{{ t("bot.chats.editModal.silentModeTitle") }}</h4>

            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  v-model="newChat.silent_mode"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm font-medium text-gray-700">{{
                  t("bot.chats.editModal.enableSilentMode")
                }}</span>
              </label>
            </div>

            <div class="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p class="font-medium mb-1">{{ t("bot.chats.editModal.silentModeHelpTitle") }}</p>
              <p>• {{ t("bot.chats.editModal.silentModeEnabled") }}</p>
              <p>• {{ t("bot.chats.editModal.silentModeDisabled") }}</p>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="submit"
              class="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              :disabled="saving"
            >
              {{ saving ? t("common.saving") : t("bot.chats.editModal.updateButton") }}
            </button>
            <button
              type="button"
              @click="closeChatModal"
              class="px-3 py-2 border rounded hover:bg-gray-50"
            >
              {{ t("common.cancel") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <BotsBotMessageHtmlHelpModal
    :open="showHtmlHelpModal"
    @close="showHtmlHelpModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  BAN_TEMPLATE_PLACEHOLDERS,
  DEFAULT_BAN_TEMPLATE_PREVIEW,
  DEFAULT_WARNING_TEMPLATE_PREVIEW,
  WARNING_TEMPLATE_PLACEHOLDERS,
} from "~/lib/bot-message-template-ui";
import type { ChatActivationStartMode } from "~/composables/useChatActivationWait";
import type { BotMemberRole } from "~/types/bot";

const { t, tm, locale } = useI18n();
const config = useRuntimeConfig();
const isSaas = computed(() => config.public.deploymentMode === "saas");

const route = useRoute();
const router = useRouter();
const botId = route.params.id as string;

const bot = ref<any>(null);

type BotDetailTab = "overview" | "moderation" | "team";
const activeTab = ref<BotDetailTab>("overview");
const botTabs = computed(() => [
  { id: "overview" as const, label: t("bot.tabs.overview") },
  { id: "moderation" as const, label: t("bot.tabs.moderation") },
  { id: "team" as const, label: t("bot.tabs.team") },
]);

const activationPrerequisites = computed(
  () => tm("chatActivation.prerequisites") as string[]
);

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: bot.value ? `@${bot.value.id}` : `@${botId}` },
]);

usePageTitle(() => bot.value?.name ?? t("page.botDetail.documentTitleFallback"));

const chatActivation = useChatActivationWait({
  botId,
  botUsername: botId,
  onCompleted: async () => {
    await loadBot();
    chatActivation.reset();
  },
});
const loading = ref(false);
const showAddChatModal = ref(false);
const showAddChatActivationModal = ref(false);
const lastChatActivationMode = ref<ChatActivationStartMode>("new_group");
const editingChat = ref<any>(null);
const saving = ref(false);
const accessCode = ref<string | null>(null);
const teamMembers = ref<any[]>([]);
const teamLoading = ref(false);
const statusError = ref("");
const messageTemplateTab = ref<"warning" | "ban">("warning");
const warningTemplateDraft = ref("");
const banTemplateDraft = ref("");
const templateTextareaRef = ref<HTMLTextAreaElement | null>(null);
const savingTemplates = ref(false);
const templateSaveError = ref("");
const templateSaveSuccess = ref(false);
const showHtmlHelpModal = ref(false);
const showDeleteConfirm = ref(false);
const deleteConfirmText = ref("");
const deleteError = ref("");
const deletingBot = ref(false);
const logs = ref<any[]>([]);
const statistics = ref<any>({
  today: {
    messages_processed: 0,
    warnings_issued: 0,
    messages_deleted: 0,
    users_banned: 0,
    unique_users: 0,
    not_moderated: 0,
  },
  week: {
    total_messages_processed: 0,
    total_warnings_issued: 0,
    total_messages_deleted: 0,
    total_users_banned: 0,
    max_unique_users: 0,
    days_count: 0,
  },
  users: {
    banned_count: 0,
    active_count: 0,
  },
});

const newChat = ref({
  chat_id: "",
  name: "",
  silent_mode: false,
});

const aggregatedStatusText = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") return t("bot.deliveryStatus.healthy");
  if (status === "disabled") return t("bot.deliveryStatus.disabled");
  if (status === "degraded" || status === "unavailable") return t("bot.deliveryStatus.problem");
  return t("bot.deliveryStatus.unknown");
});

const overviewStatusBadgeClass = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") {
    return "bg-green-100 text-green-800";
  }
  if (status === "disabled") {
    return "bg-gray-100 text-gray-700";
  }
  return "bg-red-100 text-red-800";
});

const canManageBot = computed(
  () => bot.value?.my_role === "owner" || bot.value?.my_role === "manager"
);

const isOwner = computed(() => bot.value?.my_role === "owner");

const canConfirmDelete = computed(() => {
  const value = deleteConfirmText.value.trim();
  if (!bot.value) return false;
  return value === "DELETE" || value === `@${bot.value.id}` || value === bot.value.id;
});

const activationBannerClass = computed(() => {
  const value = chatActivation.status.value;
  if (value === "waiting") return "border-blue-200 bg-blue-50 text-blue-900";
  if (value === "completed") return "border-green-200 bg-green-50 text-green-900";
  return "border-red-200 bg-red-50 text-red-900";
});

const activeTemplateChips = computed(() =>
  messageTemplateTab.value === "warning"
    ? WARNING_TEMPLATE_PLACEHOLDERS
    : BAN_TEMPLATE_PLACEHOLDERS
);

const activeTemplateDraft = computed({
  get() {
    return messageTemplateTab.value === "warning"
      ? warningTemplateDraft.value
      : banTemplateDraft.value;
  },
  set(value: string) {
    if (messageTemplateTab.value === "warning") {
      warningTemplateDraft.value = value;
    } else {
      banTemplateDraft.value = value;
    }
  },
});

const { insertAtCursor: insertTemplatePlaceholder } = useTemplateInsert(
  templateTextareaRef,
  activeTemplateDraft
);

const deliveryProblemMessage = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "degraded" || status === "unavailable") {
    return bot.value?.delivery_message;
  }
  return "";
});

function formatDate(dateString: string) {
  const loc = locale.value === "ru" ? "ru-RU" : "en-US";
  return new Date(dateString).toLocaleDateString(loc, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: BotMemberRole | string | undefined) {
  if (role === "owner") return t("common.roles.owner");
  if (role === "manager") return t("common.roles.manager");
  return t("common.roles.manager");
}

async function loadBot() {
  loading.value = true;
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`);
    bot.value = resp?.data;
    syncMessageTemplateDrafts();
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    if (status !== 404) {
      console.error("Error loading bot:", error);
    }
  } finally {
    loading.value = false;
  }
}

function syncMessageTemplateDrafts() {
  warningTemplateDraft.value =
    bot.value?.warning_message_template ?? DEFAULT_WARNING_TEMPLATE_PREVIEW;
  banTemplateDraft.value =
    bot.value?.ban_message_template ?? DEFAULT_BAN_TEMPLATE_PREVIEW;
}

async function saveMessageTemplates() {
  savingTemplates.value = true;
  templateSaveError.value = "";
  templateSaveSuccess.value = false;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: {
        warning_message_template: warningTemplateDraft.value.trim() || null,
        ban_message_template: banTemplateDraft.value.trim() || null,
      },
    });

    if (resp?.data) {
      bot.value = resp.data;
      syncMessageTemplateDrafts();
    }
    templateSaveSuccess.value = true;
  } catch (error: any) {
    templateSaveError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.saveMessageTemplates");
  } finally {
    savingTemplates.value = false;
  }
}

function resetMessageTemplates() {
  warningTemplateDraft.value = DEFAULT_WARNING_TEMPLATE_PREVIEW;
  banTemplateDraft.value = DEFAULT_BAN_TEMPLATE_PREVIEW;
}

async function resetAndSaveMessageTemplates() {
  resetMessageTemplates();
  savingTemplates.value = true;
  templateSaveError.value = "";
  templateSaveSuccess.value = false;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: {
        warning_message_template: null,
        ban_message_template: null,
      },
    });

    if (resp?.data) {
      bot.value = resp.data;
      syncMessageTemplateDrafts();
    }
    templateSaveSuccess.value = true;
  } catch (error: any) {
    templateSaveError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.resetMessageTemplates");
  } finally {
    savingTemplates.value = false;
  }
}

async function startChatActivation(mode: ChatActivationStartMode) {
  lastChatActivationMode.value = mode;
  showAddChatActivationModal.value = false;
  try {
    await chatActivation.start(mode);
  } catch (error: any) {
    chatActivation.status.value = "failed";
    chatActivation.message.value =
      error?.data?.statusMessage || error?.message || t("common.errors.startChatActivation");
  }
}

function openAddChatActivationModal() {
  showAddChatActivationModal.value = true;
}

function closeAddChatActivationModal() {
  showAddChatActivationModal.value = false;
}

function retryChatActivation() {
  chatActivation.reset();
  void startChatActivation(lastChatActivationMode.value);
}

function chatPhotoUrl(chatRowId: number) {
  return `/api/bots/${botId}/chats/row/${chatRowId}/photo`;
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

function chatHealthLabel(chat: any) {
  if (chat.health_status === "ok") return t("bot.chats.health.ok");
  if (chat.health_status === "degraded") return t("bot.chats.health.degraded");
  if (chat.health_status === "unhealthy") return t("bot.chats.health.unhealthy");
  return t("bot.chats.health.unknown");
}

function chatHealthBadgeClass(chat: any) {
  if (chat.health_status === "ok") return "bg-green-100 text-green-800";
  if (chat.health_status === "degraded") return "bg-yellow-100 text-yellow-800";
  if (chat.health_status === "unhealthy") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

async function toggleBotStatus() {
  if (!bot.value) return;

  statusError.value = "";

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { is_active: !bot.value.is_active },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error: any) {
    statusError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.updateBotStatus");
    console.error("Error updating bot status:", error);
  }
}

async function loadStatistics() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/statistics`);
    if (resp?.data?.statistics) {
      statistics.value = resp.data.statistics;
    }
  } catch (error) {
    console.error("Error loading statistics:", error);
    // При ошибке оставляем дефолтные значения
  }
}

function editChat(chat: any) {
  editingChat.value = chat;
  newChat.value = {
    chat_id: chat.chat_id,
    name: chat.name,
    silent_mode: chat.silent_mode,
  };
  showAddChatModal.value = true;
}

function closeChatModal() {
  showAddChatModal.value = false;
  editingChat.value = null;
  newChat.value = {
    chat_id: "",
    name: "",
    silent_mode: false,
  };
}

async function saveChat() {
  if (!editingChat.value) return;

  saving.value = true;
  try {
    const updatedChats = [...(bot.value.chats || [])];
    const index = updatedChats.findIndex(
      (c) => c.chat_id === editingChat.value.chat_id
    );
    if (index !== -1) {
      updatedChats[index] = {
        ...updatedChats[index],
        silent_mode: newChat.value.silent_mode,
      };
    }

    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { chats: updatedChats },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }

    closeChatModal();
  } catch (error) {
    console.error("Error saving chat:", error);
  } finally {
    saving.value = false;
  }
}

async function removeChat(chatId: number) {
  if (!confirm(t("common.confirm.removeChat"))) return;

  try {
    const updatedChats = bot.value.chats.filter(
      (c: any) => c.chat_id !== chatId
    );

    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { chats: updatedChats },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error) {
    console.error("Error removing chat:", error);
  }
}

async function loadLogs() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/logs`);
    logs.value = resp?.data?.logs || [];
  } catch (error) {
    console.error("Error loading logs:", error);
  }
}

function getSilentModeClass(chat: any) {
  if (chat.silent_mode) {
    return "text-gray-600"; // Monitor only
  } else {
    return "text-green-600"; // Full moderation
  }
}

function getSilentModeText(chat: any) {
  if (chat.silent_mode) {
    return t("bot.chats.silentModeValues.monitorOnly");
  }
  return t("bot.chats.silentModeValues.fullModeration");
}

async function loadTeam() {
  teamLoading.value = true;
  try {
    const membersResp = await $fetch<any>(`/api/bots/${botId}/team/members`);
    teamMembers.value = membersResp?.data?.members ?? [];

    if (isOwner.value) {
      const codeResp = await $fetch<any>(`/api/bots/${botId}/team/access-code`).catch(
        () => null
      );
      accessCode.value = codeResp?.data?.code ?? null;
    } else {
      accessCode.value = null;
    }
  } catch (error) {
    console.error("Error loading team:", error);
  } finally {
    teamLoading.value = false;
  }
}

async function copyAccessCode() {
  if (!accessCode.value) return;
  await navigator.clipboard.writeText(accessCode.value);
}

async function revokeAccessCode() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/team/access-code/revoke`, {
      method: "POST",
      body: {},
    });
    accessCode.value = resp?.data?.code ?? null;
  } catch (error) {
    console.error("Error revoking access code:", error);
  }
}

async function removeMember(userId: string) {
  try {
    await $fetch(`/api/bots/${botId}/team/members/${userId}`, {
      method: "DELETE",
    });
    await loadTeam();
  } catch (error) {
    console.error("Error removing member:", error);
  }
}

function openDeleteConfirm() {
  deleteError.value = "";
  deleteConfirmText.value = "";
  showDeleteConfirm.value = true;
}

function cancelDeleteConfirm() {
  showDeleteConfirm.value = false;
  deleteConfirmText.value = "";
  deleteError.value = "";
}

async function deleteBot() {
  if (!canConfirmDelete.value) return;

  deletingBot.value = true;
  deleteError.value = "";

  try {
    await $fetch(`/api/bots/${botId}`, { method: "DELETE" });
    await router.push("/bots");
  } catch (error: any) {
    deleteError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.deleteBot");
  } finally {
    deletingBot.value = false;
  }
}

onMounted(async () => {
  await loadBot();
  await Promise.all([loadLogs(), loadStatistics(), loadTeam()]);
});
</script>
