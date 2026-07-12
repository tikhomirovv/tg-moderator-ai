import { loadPaginatedReleaseNotes } from "../../core/release-notes";

const MAX_LIMIT = 10;
const DEFAULT_LIMIT = 5;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const requestedLimit =
    Number.parseInt(String(query.limit ?? String(DEFAULT_LIMIT)), 10) ||
    DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit));

  const data = loadPaginatedReleaseNotes({ page, limit });

  return {
    success: true,
    data,
  };
});
