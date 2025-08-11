import { Collection } from "mongodb";
import { getDatabaseConnection } from "../connection";
import { Rule, CreateRuleRequest, UpdateRuleRequest } from "../models/rule";

export class RuleRepository {
  private collection: Collection<Rule>;

  constructor() {
    const db = getDatabaseConnection().getDb();
    this.collection = db.collection<Rule>("rules");
  }

  async findAll(): Promise<Rule[]> {
    return await this.collection.find({}).toArray();
  }

  async findById(id: string): Promise<Rule | null> {
    return await this.collection.findOne({ id });
  }

  async create(ruleData: CreateRuleRequest): Promise<Rule> {
    const now = new Date();
    const rule: Rule = {
      ...ruleData,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    const result = await this.collection.insertOne(rule);
    return { ...rule, _id: result.insertedId };
  }

  async update(
    id: string,
    updateData: UpdateRuleRequest
  ): Promise<Rule | null> {
    const updateDoc = {
      ...updateData,
      updated_at: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async findActive(): Promise<Rule[]> {
    return await this.collection.find({ is_active: true }).toArray();
  }

  async findByIds(ids: string[]): Promise<Rule[]> {
    return await this.collection.find({ id: { $in: ids } }).toArray();
  }
}
