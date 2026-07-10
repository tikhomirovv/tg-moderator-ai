const SLUG_MAX_LENGTH = 120;
const SUFFIX_LENGTH = 6;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildWorkspaceSlugBase(name: string) {
  return slugify(name) || "workspace";
}

export function randomWorkspaceSlugSuffix(length = SUFFIX_LENGTH) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function buildWorkspaceSlugWithSuffix(base: string, suffix: string) {
  const separator = "-";
  const maxBaseLength = SLUG_MAX_LENGTH - separator.length - suffix.length;
  const trimmedBase = base.slice(0, Math.max(1, maxBaseLength));

  return `${trimmedBase}${separator}${suffix}`;
}

export type WorkspaceSlugChecker = (slug: string) => Promise<boolean>;

export async function reserveWorkspaceSlug(
  name: string,
  isSlugAvailable: WorkspaceSlugChecker,
  options?: { maxAttempts?: number }
) {
  const base = buildWorkspaceSlugBase(name);
  const maxAttempts = options?.maxAttempts ?? 12;

  if (await isSlugAvailable(base)) {
    return base;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = buildWorkspaceSlugWithSuffix(
      base,
      randomWorkspaceSlugSuffix()
    );

    if (await isSlugAvailable(slug)) {
      return slug;
    }
  }

  throw new Error("Failed to reserve a unique workspace slug");
}
