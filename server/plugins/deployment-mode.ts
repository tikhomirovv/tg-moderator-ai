import { resolveDeploymentMode } from "../core/deployment-mode";

export default defineNitroPlugin(() => {
  resolveDeploymentMode();
});
