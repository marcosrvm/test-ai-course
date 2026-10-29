import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/agent/session";

// Agent view protection (Next.js 16 "proxy", formerly middleware).
// Optimistic check on the signed cookie; every agent page and API checks it again.
// Public: the login page and the login API (otherwise login would redirect to itself).
const PUBLIC_PATHS = ["/v2/agent/login", "/api/agent/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/v2/agent/login", request.url));
}

export const config = {
  matcher: ["/v2/agent/:path*", "/api/agent/:path*"],
};
