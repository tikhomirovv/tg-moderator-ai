export type AuthErrorLike = {
  code?: string;
  message?: string;
};

const CODE_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password.",
  INVALID_PASSWORD: "Password does not meet requirements.",
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  USER_NOT_FOUND: "Invalid email or password.",
  EMAIL_NOT_VERIFIED: "Verify your email before signing in.",
  ORGANIZATION_ALREADY_EXISTS: "A workspace with this name already exists.",
  ORGANIZATION_NOT_FOUND: "Workspace not found.",
  MEMBER_ALREADY_EXISTS: "This user is already a member of the workspace.",
  YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION:
    "You cannot create a workspace until your email is verified.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION:
    "You do not have permission to invite members to this workspace.",
  INVITATION_NOT_FOUND: "Invitation not found or already used.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait and try again.",
  INVALID_TOKEN: "This link is invalid or has expired.",
  TOKEN_EXPIRED: "This link has expired. Request a new one.",
};

const MESSAGE_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /organization already exists/i,
    message: CODE_MESSAGES.ORGANIZATION_ALREADY_EXISTS,
  },
  {
    pattern: /invalid email or password/i,
    message: CODE_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
  },
  {
    pattern: /email not verified/i,
    message: CODE_MESSAGES.EMAIL_NOT_VERIFIED,
  },
  {
    pattern: /user already exists/i,
    message: CODE_MESSAGES.USER_ALREADY_EXISTS,
  },
  {
    pattern: /too many requests/i,
    message: CODE_MESSAGES.TOO_MANY_REQUESTS,
  },
];

export function formatAuthError(
  error: AuthErrorLike | null | undefined,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) {
    return fallback;
  }

  if (error.code && CODE_MESSAGES[error.code]) {
    return CODE_MESSAGES[error.code]!;
  }

  const message = error.message?.trim();
  if (message) {
    for (const { pattern, message: friendly } of MESSAGE_PATTERNS) {
      if (pattern.test(message)) {
        return friendly;
      }
    }
  }

  return fallback;
}
