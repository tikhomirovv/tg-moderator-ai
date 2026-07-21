export function readFetchError(error: unknown, fallback: string): string {
  const fetchError = error as {
    data?: { statusMessage?: string; message?: string };
    statusMessage?: string;
    message?: string;
  };
  const fromPayload =
    fetchError.data?.statusMessage ||
    fetchError.statusMessage ||
    fetchError.data?.message;

  if (fromPayload) {
    return fromPayload;
  }

  const message = fetchError.message;
  if (message && !isOfetchTransportMessage(message)) {
    return message;
  }

  return fallback;
}

/** ofetch throws e.g. `[POST] "/api/promo/apply": 400` when statusMessage is not surfaced. */
function isOfetchTransportMessage(message: string): boolean {
  return /^\[(GET|POST|PUT|PATCH|DELETE)\]/.test(message);
}
