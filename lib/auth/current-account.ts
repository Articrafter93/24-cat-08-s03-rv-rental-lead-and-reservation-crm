import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionCookieValue } from "./session";
import { findDemoAccount, type DemoAccount } from "./demo-accounts";

export async function getCurrentAccount(): Promise<DemoAccount | null> {
  const cookieStore = await cookies();
  const accountId = await verifySessionCookieValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!accountId) return null;
  return findDemoAccount(accountId) ?? null;
}
