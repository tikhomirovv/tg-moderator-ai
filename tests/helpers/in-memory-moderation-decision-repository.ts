import type {
  CreateModerationDecisionRequest,
  ModerationDecision,
} from "../../../server/database/models/moderation-decision";
import type {
  ListDecisionsOptions,
  PaginatedDecisions,
} from "../../../server/database/repositories/moderation-decision-repository";

let nextId = 1;

export class InMemoryModerationDecisionRepository {
  private rows: ModerationDecision[] = [];

  async create(
    data: CreateModerationDecisionRequest
  ): Promise<ModerationDecision> {
    const row: ModerationDecision = {
      _id: String(nextId++),
      ...data,
      created_at: data.timestamp,
    };
    this.rows.push(row);
    return row;
  }

  async listByBot(
    botId: string,
    options: ListDecisionsOptions
  ): Promise<PaginatedDecisions> {
    const page = Math.max(1, options.page);
    const limit = Math.min(100, Math.max(1, options.limit));
    const offset = (page - 1) * limit;

    const filtered = this.rows
      .filter((row) => row.bot_id === botId)
      .sort((a, b) => {
        const ts = b.timestamp.getTime() - a.timestamp.getTime();
        if (ts !== 0) {
          return ts;
        }
        return Number(b._id) - Number(a._id);
      });

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.created_at >= cutoff);
    return before - this.rows.length;
  }
}
