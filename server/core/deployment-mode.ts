import { logger } from "./logger";

export type DeploymentMode = "self-hosted" | "saas";

const VALID_MODES: DeploymentMode[] = ["self-hosted", "saas"];

let cachedMode: DeploymentMode | null = null;

/** Parse DEPLOYMENT_MODE once; invalid value throws at startup. */
export function resolveDeploymentMode(
  env: NodeJS.ProcessEnv = process.env
): DeploymentMode {
  if (cachedMode) {
    return cachedMode;
  }

  const raw = (env.DEPLOYMENT_MODE ?? "self-hosted").trim().toLowerCase();

  if (!VALID_MODES.includes(raw as DeploymentMode)) {
    const message = `Invalid DEPLOYMENT_MODE "${raw}". Expected: ${VALID_MODES.join(" | ")}`;
    logger.error({ deploymentMode: raw }, message);
    throw new Error(message);
  }

  cachedMode = raw as DeploymentMode;
  logger.info({ deploymentMode: cachedMode }, "Deployment mode resolved");
  return cachedMode;
}

export function isSaasMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return resolveDeploymentMode(env) === "saas";
}

export function isSelfHostedMode(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return resolveDeploymentMode(env) === "self-hosted";
}

/** Test helper — reset cached mode between cases. */
export function resetDeploymentModeCacheForTests(): void {
  cachedMode = null;
}
