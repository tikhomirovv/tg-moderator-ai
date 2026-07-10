import { workspaceRoutes } from "~/lib/workspace-routes";

export function useWorkspaceSlug() {
  const route = useRoute();
  return computed(() => route.params.slug as string | undefined);
}

export function useWorkspaceRoutes() {
  const workspaceSlug = useWorkspaceSlug();

  return computed(() => {
    const slug = workspaceSlug.value;
    if (!slug) {
      return null;
    }
    return {
      slug,
      home: workspaceRoutes.home(slug),
      bots: workspaceRoutes.bots(slug),
      rules: workspaceRoutes.rules(slug),
      settings: workspaceRoutes.settings(slug),
      bot: (botId: string) => workspaceRoutes.bot(slug, botId),
    };
  });
}
