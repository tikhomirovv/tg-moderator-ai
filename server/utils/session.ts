import type { H3Event } from "h3";
import { getCookie, setCookie, deleteCookie } from "h3";
import { randomUUID } from "node:crypto";
import { SessionRepository } from "../database/repositories/session-repository";
import {
  UserRepository,
  toSessionUser,
} from "../database/repositories/user-repository";
import type { SessionUser } from "../database/models/user";
import { logger } from "../core/logger";

export const SESSION_COOKIE_NAME = "tg_moderator_session";
const OIDC_STATE_COOKIE = "tg_oidc_state";
const OIDC_VERIFIER_COOKIE = "tg_oidc_verifier";
const OIDC_RETURN_TO_COOKIE = "tg_oidc_return_to";

const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function setOidcCookies(
  event: H3Event,
  state: string,
  codeVerifier: string,
  returnTo?: string | null
) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  setCookie(event, OIDC_STATE_COOKIE, state, cookieOptions);
  setCookie(event, OIDC_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  if (returnTo) {
    setCookie(event, OIDC_RETURN_TO_COOKIE, returnTo, cookieOptions);
  }
}

export function readOidcCookies(event: H3Event) {
  return {
    state: getCookie(event, OIDC_STATE_COOKIE),
    codeVerifier: getCookie(event, OIDC_VERIFIER_COOKIE),
    returnTo: getCookie(event, OIDC_RETURN_TO_COOKIE),
  };
}

export function clearOidcCookies(event: H3Event) {
  deleteCookie(event, OIDC_STATE_COOKIE, { path: "/" });
  deleteCookie(event, OIDC_VERIFIER_COOKIE, { path: "/" });
  deleteCookie(event, OIDC_RETURN_TO_COOKIE, { path: "/" });
}

export async function createUserSession(
  event: H3Event,
  userId: string
): Promise<string> {
  const token = randomUUID();
  const sessionRepo = new SessionRepository();
  await sessionRepo.create({
    id: randomUUID(),
    userId,
    token,
    ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null,
    userAgent: getHeader(event, "user-agent") ?? null,
  });

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  logger.info({ userId }, "Auth session created");
  return token;
}

export async function clearUserSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE_NAME);
  if (token) {
    const sessionRepo = new SessionRepository();
    await sessionRepo.deleteByToken(token);
  }
  deleteCookie(event, SESSION_COOKIE_NAME, { path: "/" });
}

export async function getSessionUser(
  event: H3Event
): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE_NAME);
  if (!token) {
    return null;
  }

  const sessionRepo = new SessionRepository();
  const session = await sessionRepo.findValidByToken(token);
  if (!session) {
    return null;
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findById(session.userId);
  return user ? toSessionUser(user) : null;
}

export async function requireSession(event: H3Event) {
  const user = await getSessionUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  return { user };
}
