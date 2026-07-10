import { getHealthPayload } from "../utils/health";

export default defineEventHandler(() => {
  return getHealthPayload();
});
