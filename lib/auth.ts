import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { getDatabaseConnection } from "../server/database/connection";
import * as authSchema from "../server/database/auth-schema";
import { queueAuthEmail } from "../server/utils/mail";
import { seedWorkspaceRules } from "../server/database/workspace-seed";
import { getTrustedAuthOrigins } from "../server/utils/auth-origins";
import { logger } from "../server/core/logger";

export function getAuthBaseUrl() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "http://localhost:3001"
  );
}

export function getEmailVerificationCallbackUrl() {
  return `${getAuthBaseUrl().replace(/\/$/, "")}/login?verified=1`;
}

export function buildVerificationUrl(token: string) {
  const callbackURL = encodeURIComponent(getEmailVerificationCallbackUrl());
  return `${getAuthBaseUrl().replace(/\/$/, "")}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`;
}

function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }
  return secret;
}

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!authInstance) {
    const db = getDatabaseConnection().getDb();
    authInstance = betterAuth({
      baseURL: getAuthBaseUrl(),
      secret: getAuthSecret(),
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
      }),
      advanced: {
        backgroundTasks: {
          handler: (promise) => {
            void promise;
          },
        },
      },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        sendResetPassword: async ({ user, url }) => {
          queueAuthEmail({
            to: user.email,
            subject: "Reset your password",
            html: `<p>Reset password:</p><p><a href="${url}">${url}</a></p>`,
          });
        },
      },
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, token }) => {
          const verificationUrl = buildVerificationUrl(token);
          queueAuthEmail({
            to: user.email,
            subject: "Verify your email",
            html: `<p>Verify your email:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
          });
        },
      },
      plugins: [
        organization({
          allowUserToCreateOrganization: async (user) =>
            user.emailVerified === true,
          organizationLimit: 10,
          organizationHooks: {
            afterCreateOrganization: async ({ organization: org }) => {
              void seedWorkspaceRules(org.id).catch((error) => {
                logger.error(
                  { error: error as Error, workspaceId: org.id },
                  "Failed to seed workspace rules after organization create"
                );
              });
            },
          },
        }),
      ],
      trustedOrigins: getTrustedAuthOrigins(getAuthBaseUrl()),
    });
  }
  return authInstance;
}

export type Auth = ReturnType<typeof getAuth>;
