import type { H3Event } from "h3";
import { getRequestURL, getRequestHeaders, readRawBody } from "h3";

export async function toWebRequest(event: H3Event): Promise<Request> {
  const url = getRequestURL(event);
  const method = event.method;
  const headers = new Headers();

  for (const [key, value] of Object.entries(getRequestHeaders(event))) {
    if (value !== undefined) {
      headers.set(key, value);
    }
  }

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = (await readRawBody(event, false)) ?? undefined;
  }

  return new Request(url, {
    method,
    headers,
    body,
  });
}
