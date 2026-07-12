import {
  buildTelegramAuthorizeUrl,
  generateOidcState,
  generatePkcePair,
} from "../../utils/telegram-oidc";
import { resolveReturnToPath } from "../../../lib/auth-return-to";
import { setOidcCookies } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const returnTo = resolveReturnToPath(
    typeof query.returnTo === "string" ? query.returnTo : null
  );
  const state = generateOidcState();
  const { verifier, challenge } = generatePkcePair();
  setOidcCookies(event, state, verifier, returnTo);

  const authorizeUrl = await buildTelegramAuthorizeUrl({
    state,
    codeChallenge: challenge,
  });

  return sendRedirect(event, authorizeUrl);
});
