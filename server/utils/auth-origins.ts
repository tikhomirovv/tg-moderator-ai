/** Pair localhost and 127.0.0.1 — browsers treat them as different origins. */
export function getTrustedAuthOrigins(baseUrl: string): string[] {
  const origins = new Set<string>([baseUrl]);

  try {
    const url = new URL(baseUrl);
    const port = url.port || (url.protocol === "https:" ? "443" : "80");

    if (url.hostname === "localhost") {
      origins.add(`${url.protocol}//127.0.0.1:${port}`);
    }
    if (url.hostname === "127.0.0.1") {
      origins.add(`${url.protocol}//localhost:${port}`);
    }
  } catch {
    // Invalid base URL — keep only the raw value above.
  }

  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (extra) {
    for (const item of extra.split(",")) {
      const trimmed = item.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  return [...origins];
}
