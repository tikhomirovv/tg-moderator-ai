import { describe, expect, test, beforeEach } from "bun:test";
import {
  isSaasMode,
  isSelfHostedMode,
  resetDeploymentModeCacheForTests,
  resolveDeploymentMode,
} from "../../../server/core/deployment-mode";

describe("deployment-mode", () => {
  beforeEach(() => {
    resetDeploymentModeCacheForTests();
  });

  test("defaults to self-hosted", () => {
    expect(resolveDeploymentMode({})).toBe("self-hosted");
    expect(isSelfHostedMode({})).toBe(true);
    expect(isSaasMode({})).toBe(false);
  });

  test("parses saas mode", () => {
    expect(resolveDeploymentMode({ DEPLOYMENT_MODE: "saas" })).toBe("saas");
    expect(isSaasMode({ DEPLOYMENT_MODE: "saas" })).toBe(true);
  });

  test("invalid mode fails fast", () => {
    expect(() =>
      resolveDeploymentMode({ DEPLOYMENT_MODE: "enterprise" })
    ).toThrow('Invalid DEPLOYMENT_MODE "enterprise"');
  });
});
