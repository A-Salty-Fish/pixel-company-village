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
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
