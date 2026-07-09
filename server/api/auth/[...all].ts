import { getAuth } from "../../../lib/auth";
import { toWebRequest } from "../../utils/to-web-request";

export default defineEventHandler(async (event) => {
  const request = await toWebRequest(event);
  return getAuth().handler(request);
});
