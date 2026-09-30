import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/api/login", "/api/ingest"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const ok = await isValidSession(token);

  if (pathname.startsWith("/api/")) {
    if (!ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!ok) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    // 303 is not cached. A cached 307 to /login was being reused after the
    // next successful sign-in, so the village shell came back empty until a
    // later client update (opening 「村里的事」).
    const response = NextResponse.redirect(login, 303);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
