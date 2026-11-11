import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session";
import { sessionKey } from "./session-key";
import { resolveDemoSession } from "./demo-session";
import type { DemoAccount } from "./demo-accounts";

export async function getCurrentAccount(): Promise<DemoAccount | null> {
  const cookieStore = await cookies();
  return resolveDemoSession(cookieStore.get(SESSION_COOKIE)?.value, sessionKey());
}
