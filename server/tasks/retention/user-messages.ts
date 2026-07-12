import { cleanupUserMessagesRetention } from "../../core/retention-cleanup";

export default defineTask({
  meta: {
    name: "retention:user-messages",
    description: "Delete user_messages beyond 100 newest per scope",
  },
  async run() {
    const result = await cleanupUserMessagesRetention();
    return result;
  },
});
