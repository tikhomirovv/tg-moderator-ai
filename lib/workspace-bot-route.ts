/** After workspace switch, redirect away from bot detail if bot is missing. */
export function shouldRedirectFromBotDetail(botFound: boolean): boolean {
  return !botFound;
}
