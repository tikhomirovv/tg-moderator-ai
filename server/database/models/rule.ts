export interface Rule {
  id: string;
  name: string;
  description: string;
  ai_prompt: string;
  severity: "low" | "medium" | "high";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRuleRequest {
  id: string;
  name: string;
  description: string;
  ai_prompt: string;
  severity: "low" | "medium" | "high";
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  ai_prompt?: string;
  severity?: "low" | "medium" | "high";
  is_active?: boolean;
}
