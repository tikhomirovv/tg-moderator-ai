import type { ComputedRef } from "vue";

export type WorkspaceSwitchHandler = (
  workspaceId: string
) => void | Promise<void>;

export type WorkspaceContext = {
  activeWorkspaceId: ComputedRef<string | undefined>;
  registerOnSwitch: (handler: WorkspaceSwitchHandler) => void;
  completeSwitch: (workspaceId: string) => Promise<void>;
};

export const workspaceContextKey = Symbol("workspace-context");

export function provideWorkspaceContext(context: WorkspaceContext): void {
  provide(workspaceContextKey, context);
}

export function useWorkspaceContext(): WorkspaceContext {
  const context = inject<WorkspaceContext | null>(workspaceContextKey, null);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within default layout");
  }
  return context;
}

/** Subscribe page data reload when active workspace changes. */
export function useOnWorkspaceSwitch(
  handler: WorkspaceSwitchHandler
): void {
  const { registerOnSwitch } = useWorkspaceContext();
  registerOnSwitch(handler);
}
