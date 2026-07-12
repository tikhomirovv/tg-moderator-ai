export type DecisionsQuery = {
  page: number;
  limit: number;
};

const MAX_DECISIONS_LIMIT = 100;

export function parseDecisionsQuery(
  query: Record<string, unknown>
): DecisionsQuery {
  const page = Math.max(1, parsePositiveInt(query.page, 1));
  const requestedLimit = parsePositiveInt(query.limit, MAX_DECISIONS_LIMIT);
  const limit = Math.min(MAX_DECISIONS_LIMIT, Math.max(1, requestedLimit));

  return { page, limit };
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildDecisionsPagination(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    total_pages: total > 0 ? Math.ceil(total / limit) : 1,
  };
}
