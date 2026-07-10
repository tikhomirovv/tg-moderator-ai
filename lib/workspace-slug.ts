function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Better Auth organization slugs are globally unique — prefix with owner id. */
export function buildWorkspaceSlug(userId: string, name: string) {
  const base = slugify(name) || "workspace";
  return `${userId}-${base}`.slice(0, 120);
}
