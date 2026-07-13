import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function usePageBreadcrumbs(items: MaybeRefOrGetter<BreadcrumbItem[]>) {
  const breadcrumbs = computed(() => toValue(items));

  const backTo = computed(() => {
    const trail = breadcrumbs.value;
    if (trail.length < 2) {
      return undefined;
    }
    return trail[trail.length - 2]?.to;
  });

  return { breadcrumbs, backTo };
}
