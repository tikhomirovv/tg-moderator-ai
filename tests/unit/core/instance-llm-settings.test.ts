import { describe, expect, test } from "bun:test";
import { resolveLlmConfig } from "../../../server/core/instance-llm-settings";
import { encryptSecret } from "../../../server/core/settings-encryption";
import { resetDeploymentModeCacheForTests } from "../../../server/core/deployment-mode";

const ENCRYPTION_ENV = {
  SETTINGS_ENCRYPTION_KEY: "test-secret-key-for-unit-tests-only",
};

describe("instance-llm-settings", () => {
  test("env LLM_API_KEY takes precedence over database", async () => {
    resetDeploymentModeCacheForTests();
    const resolved = await resolveLlmConfig({
      DEPLOYMENT_MODE: "self-hosted",
      LLM_API_KEY: "env-key",
      LLM_BASE_URL: "https://api.openai.com/v1",
      LLM_MODEL: "gpt-env",
    });

    expect(resolved.source).toBe("env");
    expect(resolved.config?.apiKey).toBe("env-key");
    expect(resolved.config?.model).toBe("gpt-env");
  });

  test("saas without env key returns none", async () => {
    resetDeploymentModeCacheForTests();
    const resolved = await resolveLlmConfig({
      DEPLOYMENT_MODE: "saas",
    });
    expect(resolved.source).toBe("none");
    expect(resolved.config).toBeNull();
  });
});

describe("settings encryption integration", () => {
  test("encrypted key round-trip helper", () => {
    const encrypted = encryptSecret("db-key", ENCRYPTION_ENV);
    expect(encrypted.length).toBeGreaterThan(10);
  });
});
