/** Product display name from runtimeConfig (sourced from APP_NAME). */
export function useAppName() {
  const config = useRuntimeConfig();
  return computed(() => String(config.public.appName));
}
