import { createHash, randomBytes } from "node:crypto";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

const TELEGRAM_OIDC_DISCOVERY =
  "https://oauth.telegram.org/.well-known/openid-configuration";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let issuer: string | null = null;

function getTelegramLoginBotId() {
  const botId = process.env.TELEGRAM_LOGIN_BOT_ID;
  if (!botId) {
    throw new Error("TELEGRAM_LOGIN_BOT_ID is required");
  }
  return botId;
}

function getTelegramLoginClientSecret() {
  const secret = process.env.TELEGRAM_LOGIN_CLIENT_SECRET;
  if (!secret) {
    throw new Error("TELEGRAM_LOGIN_CLIENT_SECRET is required");
  }
  return secret;
}

export function getAppBaseUrl() {
  const baseUrl =
    process.env.BASE_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "http://localhost:3001";
  return baseUrl.replace(/\/$/, "");
}

export function getTelegramCallbackUrl() {
  return `${getAppBaseUrl()}/api/auth/telegram/callback`;
}

export function generatePkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function generateOidcState() {
  return randomBytes(16).toString("hex");
}

async function getOidcConfig() {
  if (!jwks || !issuer) {
    const response = await fetch(TELEGRAM_OIDC_DISCOVERY);
    if (!response.ok) {
      throw new Error("Failed to fetch Telegram OIDC discovery document");
    }
    const config = (await response.json()) as {
      issuer: string;
      jwks_uri: string;
      authorization_endpoint: string;
      token_endpoint: string;
    };
    issuer = config.issuer;
    jwks = createRemoteJWKSet(new URL(config.jwks_uri));
  }

  const response = await fetch(TELEGRAM_OIDC_DISCOVERY);
  const config = (await response.json()) as {
    authorization_endpoint: string;
    token_endpoint: string;
  };

  return {
    issuer: issuer!,
    jwks: jwks!,
    authorizationEndpoint: config.authorization_endpoint,
    tokenEndpoint: config.token_endpoint,
  };
}

export async function buildTelegramAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
}) {
  const { authorizationEndpoint } = await getOidcConfig();
  const clientId = getTelegramLoginBotId();
  const redirectUri = getTelegramCallbackUrl();
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeTelegramCode(params: {
  code: string;
  codeVerifier: string;
}) {
  const { tokenEndpoint } = await getOidcConfig();
  const clientId = getTelegramLoginBotId();
  const clientSecret = getTelegramLoginClientSecret();
  const redirectUri = getTelegramCallbackUrl();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram token exchange failed: ${text}`);
  }

  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) {
    throw new Error("Telegram token response missing id_token");
  }

  return data.id_token;
}

export interface TelegramIdTokenClaims {
  telegramId: number;
  username?: string | null;
  name: string;
  photoUrl?: string | null;
}

export async function verifyTelegramIdToken(
  idToken: string
): Promise<TelegramIdTokenClaims> {
  const { issuer: iss, jwks: remoteJwks } = await getOidcConfig();
  const clientId = getTelegramLoginBotId();

  const { payload } = await jwtVerify(idToken, remoteJwks, {
    issuer: iss,
    audience: clientId,
  });

  return parseTelegramClaims(payload);
}

function parseTelegramClaims(payload: JWTPayload): TelegramIdTokenClaims {
  const telegramId = Number(payload.id ?? payload.sub);
  if (!Number.isFinite(telegramId)) {
    throw new Error("Telegram id_token missing user id");
  }

  const name =
    (typeof payload.name === "string" && payload.name) ||
    [payload.given_name, payload.family_name]
      .filter((part) => typeof part === "string" && part)
      .join(" ") ||
    (typeof payload.preferred_username === "string"
      ? payload.preferred_username
      : `User ${telegramId}`);

  return {
    telegramId,
    username:
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : null,
    name,
    photoUrl: typeof payload.picture === "string" ? payload.picture : null,
  };
}
