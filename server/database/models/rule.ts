export interface Rule {
  id: string;
  name: string;
  description: string;
  ai_prompt: string;
  is_active: boolean;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number | null;
  whitelist: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateRuleRequest {
  id?: string;
  name: string;
  description: string;
  ai_prompt: string;
  delete_on_violation?: boolean;
  ban_on_violation?: boolean;
  warnings_before_ban?: number | null;
  whitelist?: string[];
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  ai_prompt?: string;
  is_active?: boolean;
  delete_on_violation?: boolean;
  ban_on_violation?: boolean;
  warnings_before_ban?: number | null;
  whitelist?: string[];
}
