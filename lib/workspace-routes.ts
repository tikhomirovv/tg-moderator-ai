/** Workspace-scoped app paths using organization slug in the URL. */
export function workspacePath(workspaceSlug: string, ...segments: string[]) {
  const base = `/w-${workspaceSlug}`;
  if (segments.length === 0) {
    return base;
  }
  return `${base}/${segments.join("/")}`;
}

export const workspaceRoutes = {
  home: (workspaceSlug: string) => workspacePath(workspaceSlug),
  bots: (workspaceSlug: string) => workspacePath(workspaceSlug, "bots"),
  bot: (workspaceSlug: string, botId: string) =>
    workspacePath(workspaceSlug, "bots", botId),
  rules: (workspaceSlug: string) =>
    workspacePath(workspaceSlug, "config", "rules"),
  settings: (workspaceSlug: string) =>
    workspacePath(workspaceSlug, "settings"),
};

const WORKSPACE_PREFIX_RE = /^\/w-([^/]+)/;

export function parseWorkspaceSlugFromPath(path: string) {
  const match = path.match(WORKSPACE_PREFIX_RE);
  return match?.[1];
}

export function replaceWorkspaceInPath(path: string, workspaceSlug: string) {
  if (WORKSPACE_PREFIX_RE.test(path)) {
    return path.replace(/^\/w-[^/]+/, `/w-${workspaceSlug}`);
  }
  return workspaceRoutes.home(workspaceSlug);
}
