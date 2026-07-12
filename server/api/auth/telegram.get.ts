import {
  buildTelegramAuthorizeUrl,
  generateOidcState,
  generatePkcePair,
} from "../../utils/telegram-oidc";
import { setOidcCookies } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const state = generateOidcState();
  const { verifier, challenge } = generatePkcePair();
  setOidcCookies(event, state, verifier);

  const authorizeUrl = await buildTelegramAuthorizeUrl({
    state,
    codeChallenge: challenge,
  });

  return sendRedirect(event, authorizeUrl);
});
