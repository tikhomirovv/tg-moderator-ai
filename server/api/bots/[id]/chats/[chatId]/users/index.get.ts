import { listChatUsers } from "../../../../../../utils/chat-user-moderation";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  return listChatUsers(event);
});
