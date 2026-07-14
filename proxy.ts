import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionCookieValue } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const accountId = await verifySessionCookieValue(request.cookies.get(SESSION_COOKIE)?.value);

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/pipeline") ||
    request.nextUrl.pathname.startsWith("/leads") ||
    request.nextUrl.pathname.startsWith("/follow-up") ||
    request.nextUrl.pathname.startsWith("/alerts") ||
    request.nextUrl.pathname.startsWith("/stalled") ||
    request.nextUrl.pathname.startsWith("/intake") ||
    request.nextUrl.pathname.startsWith("/knowledge");

  if (!accountId && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (accountId && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
