import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { findDemoAccount } from "@/lib/auth/demo-accounts";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionCookieValue } from "@/lib/auth/session";
import { sessionKey } from "@/lib/auth/session-key";
import { isDemoAuthEnabled } from "@/lib/auth/demo-session";
import { checkRateLimit, clientIdentifier, tooManyRequests } from "@/lib/security/rate-limit";

const LoginSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // The demo login only exists in builds that opt in for the portfolio exhibition.
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: "The demo login is disabled in this deployment." }, { status: 403 });
  }

  const limit = await checkRateLimit("demo-login", clientIdentifier(request));
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const account = findDemoAccount(parsed.data.accountId);
  if (!account || account.password !== parsed.data.password) {
    return NextResponse.json({ error: "Invalid demo credentials" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionCookieValue(account.id, sessionKey()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ success: true, redirectTo: account.destination });
}
