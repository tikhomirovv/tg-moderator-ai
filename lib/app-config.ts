/** Default product display name when APP_NAME is unset. */
export const DEFAULT_APP_NAME = "Telemodai";

/** Resolve branded app name from env (nuxt.config, Nitro, scripts). */
export function resolveAppName(
  env: { APP_NAME?: string } = process.env
): string {
  const trimmed = env.APP_NAME?.trim();
  return trimmed || DEFAULT_APP_NAME;
}

/** External links for footer and release notes; app name from APP_NAME / runtimeConfig.public.appName. */
export const APP_LINKS = {
  authorSite: "https://tikhomirov.me",
  githubRepo: "https://github.com/telemodai/app",
  productSite: "https://telemodai.ru",
} as const;

export function githubReleaseUrl(tag: string): string {
  return `${APP_LINKS.githubRepo}/releases/tag/${tag}`;
}
