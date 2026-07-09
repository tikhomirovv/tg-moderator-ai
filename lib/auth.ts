import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { getDatabaseConnection } from "../server/database/connection";
import * as authSchema from "../server/database/auth-schema";
import { sendAuthEmail } from "../server/utils/mail";
import { seedWorkspaceRules } from "../server/database/workspace-seed";

function getAuthBaseUrl() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "http://localhost:3001"
  );
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
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
          await sendAuthEmail({
            to: user.email,
            subject: "Reset your password",
            html: `<p>Reset password:</p><p><a href="${url}">${url}</a></p>`,
          });
        },
      },
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
          await sendAuthEmail({
            to: user.email,
            subject: "Verify your email",
            html: `<p>Verify your email:</p><p><a href="${url}">${url}</a></p>`,
          });
        },
      },
      plugins: [
        organization({
          allowUserToCreateOrganization: true,
          organizationLimit: 10,
          organizationHooks: {
            afterCreateOrganization: async ({ organization: org }) => {
              await seedWorkspaceRules(org.id);
            },
          },
        }),
      ],
      trustedOrigins: [getAuthBaseUrl()],
    });
  }
  return authInstance;
}

export type Auth = ReturnType<typeof getAuth>;
