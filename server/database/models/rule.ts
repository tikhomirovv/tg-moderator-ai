export interface RuleWhitelistEntry {
  id: number;
  telegram_user_id: number | null;
  username: string | null;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  ai_prompt: string;
  is_active: boolean;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number | null;
  whitelist: RuleWhitelistEntry[];
  created_at: Date;
  updated_at: Date;
}

export interface RuleWhitelistInput {
  telegram_user_id?: number | null;
  username?: string | null;
}

export interface CreateRuleRequest {
  id?: string;
  name: string;
  description: string;
  ai_prompt: string;
  delete_on_violation?: boolean;
  ban_on_violation?: boolean;
  warnings_before_ban?: number | null;
  whitelist?: RuleWhitelistInput[];
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  ai_prompt?: string;
  is_active?: boolean;
  delete_on_violation?: boolean;
  ban_on_violation?: boolean;
  warnings_before_ban?: number | null;
  whitelist?: RuleWhitelistInput[];
}
