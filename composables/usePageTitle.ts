import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

/** Sets document title segment; global titleTemplate adds the app brand suffix. */
export function usePageTitle(title: MaybeRefOrGetter<string>) {
  useHead({
    title: () => toValue(title),
  });
}
