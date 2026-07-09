import { getAuth } from "../../../lib/auth";
import { h3EventToWebRequest } from "../../utils/to-web-request";

export default defineEventHandler(async (event) => {
  const request = await h3EventToWebRequest(event);
  return getAuth().handler(request);
});
