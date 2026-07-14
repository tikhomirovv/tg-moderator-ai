<template>
  <div class="max-w-3xl mx-auto">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.releaseNotes.title')"
      :subtitle="t('page.releaseNotes.subtitle')"
    />

    <div v-if="loading" class="text-gray-500">{{ t("releaseNotes.loading") }}</div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded p-4">
      {{ error }}
    </div>

    <div v-else-if="releases.length === 0" class="text-gray-500 text-center py-12">
      {{ t("releaseNotes.empty") }}
    </div>

    <div v-else class="space-y-10">
      <article
        v-for="release in releases"
        :key="release.tag"
        class="border-b border-gray-200 pb-10 last:border-b-0"
      >
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
          <h3 class="text-xl font-semibold text-gray-900">{{ release.tag }}</h3>
          <time class="text-sm text-gray-500">{{ formatDate(release.date) }}</time>
        </div>

        <p class="mb-5 text-sm">
          <a
            :href="release.githubReleaseUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline"
          >
            {{ t("releaseNotes.githubLink") }}
          </a>
        </p>

        <div
          v-for="section in release.sections"
          :key="`${release.tag}-${section.title}`"
          class="mb-5"
        >
          <h4 class="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-2">
            {{ section.title }}
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(item, index) in section.items"
              :key="`${release.tag}-${section.title}-${index}`"
              class="text-gray-800 text-sm leading-relaxed pl-4 border-l-2 border-gray-200"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </article>
    </div>

    <nav
      v-if="pagination.total_pages > 1"
      class="flex items-center justify-between border-t border-gray-200 pt-6 mt-8"
      :aria-label="t('page.releaseNotes.paginationNav')"
    >
      <button
        type="button"
        class="px-3 py-2 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
        :disabled="pagination.page <= 1"
        @click="goToPage(pagination.page - 1)"
      >
        {{ t("releaseNotes.back") }}
      </button>
      <span class="text-sm text-gray-600">
        {{ t("common.pageOf", { page: pagination.page, totalPages: pagination.total_pages }) }}
      </span>
      <button
        type="button"
        class="px-3 py-2 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
        :disabled="pagination.page >= pagination.total_pages"
        @click="goToPage(pagination.page + 1)"
      >
        {{ t("releaseNotes.forward") }}
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
type ReleaseSection = {
  title: string;
  items: string[];
};

const { t, locale } = useI18n();

usePageTitle(() => t("page.releaseNotes.documentTitle"));

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.releaseNotes.title") },
]);

type ReleaseNote = {
  tag: string;
  version: string;
  date: string;
  sections: ReleaseSection[];
  githubReleaseUrl: string;
};

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const releases = ref<ReleaseNote[]>([]);
const pagination = ref({
  page: 1,
  limit: 5,
  total: 0,
  total_pages: 1,
});

const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? "1"), 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
});

function formatDate(dateString: string) {
  const loc = locale.value === "ru" ? "ru-RU" : "en-US";
  return new Date(dateString).toLocaleDateString(loc, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function loadReleases(targetPage = page.value) {
  loading.value = true;
  error.value = "";

  try {
    const resp = await $fetch<{
      success: boolean;
      data: {
        items: ReleaseNote[];
        pagination: typeof pagination.value;
      };
    }>("/api/releases", {
      query: { page: targetPage, limit: 5 },
    });

    releases.value = resp?.data?.items ?? [];
    pagination.value = resp?.data?.pagination ?? pagination.value;
  } catch (loadError: unknown) {
    console.error(loadError);
    error.value = t("common.errors.loadReleaseNotes");
    releases.value = [];
  } finally {
    loading.value = false;
  }
}

async function goToPage(targetPage: number) {
  await router.push({
    path: "/release-notes",
    query: targetPage > 1 ? { page: targetPage } : {},
  });
}

watch(page, (targetPage) => {
  void loadReleases(targetPage);
});

onMounted(() => {
  void loadReleases(page.value);
});
</script>
