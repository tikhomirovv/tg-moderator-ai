import type {
  CreateProviderPaymentInput,
  ProviderPayment,
  ProviderPaymentStatus,
} from "../../server/database/models/provider-payment";

export class InMemoryProviderPaymentStore {
  private rows = new Map<string, ProviderPayment>();
  private nextId = 1;

  async createPending(
    input: CreateProviderPaymentInput
  ): Promise<ProviderPayment> {
    const now = new Date();
    const row: ProviderPayment = {
      id: this.nextId++,
      provider_payment_id: input.provider_payment_id,
      bot_id: input.bot_id,
      package_id: input.package_id,
      amount_rub: input.amount_rub,
      credits: input.credits,
      status: "pending",
      purchaser_user_id: input.purchaser_user_id,
      credited_at: null,
      created_at: now,
      updated_at: now,
    };
    this.rows.set(row.provider_payment_id, row);
    return row;
  }

  async findByProviderPaymentId(
    providerPaymentId: string
  ): Promise<ProviderPayment | null> {
    return this.rows.get(providerPaymentId) ?? null;
  }

  async findOpenByBotId(botId: string): Promise<ProviderPayment[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.bot_id === botId &&
          (row.status === "pending" || row.status === "succeeded")
      )
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  async findStalePending(olderThan: Date): Promise<ProviderPayment[]> {
    return [...this.rows.values()]
      .filter(
        (row) => row.status === "pending" && row.created_at < olderThan
      )
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  async updateStatus(
    providerPaymentId: string,
    status: ProviderPaymentStatus
  ): Promise<ProviderPayment | null> {
    const row = this.rows.get(providerPaymentId);
    if (!row) {
      return null;
    }
    const updated: ProviderPayment = {
      ...row,
      status,
      updated_at: new Date(),
    };
    this.rows.set(providerPaymentId, updated);
    return updated;
  }

  async markCredited(
    providerPaymentId: string
  ): Promise<ProviderPayment | null> {
    const row = this.rows.get(providerPaymentId);
    if (!row) {
      return null;
    }
    const now = new Date();
    const updated: ProviderPayment = {
      ...row,
      status: "credited",
      credited_at: now,
      updated_at: now,
    };
    this.rows.set(providerPaymentId, updated);
    return updated;
  }
}
