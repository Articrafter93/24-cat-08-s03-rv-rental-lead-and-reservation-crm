import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { findDemoAccount } from "@/lib/auth/demo-accounts";
import { SESSION_COOKIE, createSessionCookieValue } from "@/lib/auth/session";

const LoginSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
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
  cookieStore.set(SESSION_COOKIE, await createSessionCookieValue(account.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ success: true, redirectTo: account.destination });
}
