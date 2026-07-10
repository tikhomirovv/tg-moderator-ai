<template>
  <div class="relative">
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left"
      @click="open = !open"
    >
      <div class="min-w-0">
        <div class="text-xs text-gray-500">Workspace</div>
        <div class="text-sm font-medium truncate">
          {{ currentWorkspace?.name ?? "Select workspace" }}
        </div>
      </div>
      <span class="text-gray-400 text-xs">{{ open ? "▲" : "▼" }}</span>
    </button>

    <div
      v-if="open"
      class="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 py-1"
    >
      <button
        v-for="workspace in workspaces"
        :key="workspace.id"
        type="button"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
        :class="
          workspace.slug === currentWorkspaceSlug
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700'
        "
        @click="switchWorkspace(workspace.slug)"
      >
        {{ workspace.name }}
      </button>

      <div class="border-t border-gray-100 my-1" />

      <button
        type="button"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        @click="openCreateModal"
      >
        + Create workspace
      </button>

      <NuxtLink
        v-if="currentWorkspaceSlug"
        :to="workspaceRoutes.settings(currentWorkspaceSlug)"
        class="block px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        @click="open = false"
      >
        Workspace settings
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetchUserWorkspaces, type WorkspaceSummary } from "~/lib/fetch-workspaces";
import { findWorkspaceBySlug } from "~/lib/workspace-resolve";
import { replaceWorkspaceInPath, workspaceRoutes } from "~/lib/workspace-routes";
import { syncActiveWorkspaceSlug } from "~/lib/sync-active-workspace";

const props = defineProps<{
  currentWorkspaceSlug?: string;
}>();

const emit = defineEmits<{
  createWorkspace: [];
}>();

const route = useRoute();
const open = ref(false);
const workspaces = ref<WorkspaceSummary[]>([]);

const currentWorkspaceSlug = computed(
  () =>
    props.currentWorkspaceSlug ?? (route.params.slug as string | undefined)
);

const currentWorkspace = computed(() =>
  findWorkspaceBySlug(workspaces.value, currentWorkspaceSlug.value ?? "")
);

async function loadWorkspaces() {
  workspaces.value = await fetchUserWorkspaces();
}

async function switchWorkspace(workspaceSlug: string) {
  if (workspaceSlug === currentWorkspaceSlug.value) {
    open.value = false;
    return;
  }

  await syncActiveWorkspaceSlug(workspaceSlug);
  open.value = false;
  await navigateTo(replaceWorkspaceInPath(route.fullPath, workspaceSlug));
}

function openCreateModal() {
  open.value = false;
  emit("createWorkspace");
}

onMounted(() => {
  void loadWorkspaces();
});

watch(
  () => route.params.slug,
  () => {
    void loadWorkspaces();
  }
);

defineExpose({
  reload: loadWorkspaces,
});
</script>
