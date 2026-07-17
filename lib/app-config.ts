/** Default product display name when APP_NAME is unset. */
export const DEFAULT_APP_NAME = "Telemodai";

/** Resolve branded app name from env (nuxt.config, Nitro, scripts). */
export function resolveAppName(
  env: { APP_NAME?: string } = process.env
): string {
  const trimmed = env.APP_NAME?.trim();
  return trimmed || DEFAULT_APP_NAME;
}

/** External links for footer; app name comes from APP_NAME / runtimeConfig.public.appName. */
export const APP_LINKS = {
  authorSite: "https://tikhomirov.me",
} as const;
