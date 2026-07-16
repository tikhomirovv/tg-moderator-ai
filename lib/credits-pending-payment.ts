const STORAGE_PREFIX = "tgmoderator.credits.pendingPayment";

export function pendingPaymentStorageKey(botId: string): string {
  return `${STORAGE_PREFIX}.${botId}`;
}

export function readPendingPaymentId(botId: string): string | null {
  if (!import.meta.client) {
    return null;
  }
  return sessionStorage.getItem(pendingPaymentStorageKey(botId))?.trim() || null;
}

export function writePendingPaymentId(botId: string, paymentId: string): void {
  if (!import.meta.client) {
    return;
  }
  sessionStorage.setItem(pendingPaymentStorageKey(botId), paymentId);
}

export function clearPendingPaymentId(botId: string): void {
  if (!import.meta.client) {
    return;
  }
  sessionStorage.removeItem(pendingPaymentStorageKey(botId));
}
