import type { H3Event } from "h3";

export function resolveBotIdFromEvent(
  event: H3Event,
  suffix: string
): string | undefined {
  const fromParam = getRouterParam(event, "id");
  if (fromParam) {
    return fromParam;
  }

  const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = getRequestURL(event).pathname.match(
    new RegExp(`^/api/bots/([^/]+)/${escaped}/?$`)
  );
  return match?.[1];
}
