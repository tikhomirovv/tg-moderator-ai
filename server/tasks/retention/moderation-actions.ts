import { cleanupModerationActionsRetention } from "../../core/retention-cleanup";

export default defineTask({
  meta: {
    name: "retention:moderation-actions",
    description: "Delete moderation_actions older than 90 days",
  },
  async run() {
    const result = await cleanupModerationActionsRetention();
    return result;
  },
});
