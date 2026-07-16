export interface InstanceSettings {
  id: string;
  llm_api_key_encrypted?: string | null;
  llm_base_url?: string | null;
  llm_model?: string | null;
  updated_at: Date;
}

export interface InstanceSettingsPublic {
  has_api_key: boolean;
  base_url?: string | null;
  model?: string | null;
  updated_at?: Date;
}

export interface UpdateInstanceSettingsRequest {
  api_key?: string | null;
  base_url?: string | null;
  model?: string | null;
}
