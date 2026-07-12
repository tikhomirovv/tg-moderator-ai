import { cleanupModerationDecisionsRetention } from "../../core/retention-cleanup";

export default defineTask({
  meta: {
    name: "retention:moderation-decisions",
    description: "Delete moderation_decisions older than 90 days",
  },
  async run() {
    const result = await cleanupModerationDecisionsRetention();
    return result;
  },
});
