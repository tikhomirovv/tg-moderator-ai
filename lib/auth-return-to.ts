/** Default landing after Telegram OIDC when no return path is stored. */
export const DEFAULT_POST_LOGIN_PATH = "/bots";

/**
 * Validates a post-login redirect path (same-origin relative only).
 * Rejects protocol-relative URLs, backslashes, and embedded schemes.
 */
export function sanitizeReturnToPath(
  input: string | null | undefined
): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("\\") || trimmed.includes("\0")) {
    return null;
  }

  // Reject paths that look like "/http:" or "/javascript:".
  if (/^\/[^/?#]*:/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/** Map legacy invite URLs to the bots page join modal query. */
export function normalizeAuthReturnTo(fullPath: string): string {
  try {
    const url = new URL(fullPath, "http://local");
    if (url.pathname === "/join") {
      const params = new URLSearchParams({ add: "join" });
      const code = url.searchParams.get("code")?.trim();
      if (code) {
        params.set("code", code);
      }
      return `/bots?${params.toString()}`;
    }
  } catch {
    // fall through
  }

  return fullPath;
}

export function resolveReturnToPath(
  input: string | null | undefined
): string {
  const normalized =
    typeof input === "string" ? normalizeAuthReturnTo(input) : null;
  return sanitizeReturnToPath(normalized) ?? DEFAULT_POST_LOGIN_PATH;
}
