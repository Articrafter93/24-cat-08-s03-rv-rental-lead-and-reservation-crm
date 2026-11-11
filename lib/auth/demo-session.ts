import { findDemoAccount, type DemoAccount } from "./demo-accounts";
import { isDemoAuthEnabled } from "./demo-flag";
import { verifySessionCookieValue } from "./session";

export { isDemoAuthEnabled };

// The one session rule shared by the proxy, the server pages and the API routes: the demo login is
// enabled, the cookie carries a valid signature for this build's key, and it names a demo account.
export async function resolveDemoSession(cookieValue: string | undefined, key: string | undefined): Promise<DemoAccount | null> {
  if (!isDemoAuthEnabled()) return null;
  const accountId = await verifySessionCookieValue(cookieValue, key);
  return accountId ? (findDemoAccount(accountId) ?? null) : null;
}
