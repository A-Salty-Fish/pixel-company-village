import { NextResponse } from "next/server";
import { isValidSitePassword, sessionTokenFromPassword, sitePasswordConfigured } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/cookie";

export const dynamic = "force-dynamic";

function isFormRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

function formRedirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  const form = isFormRequest(request);

  if (!sitePasswordConfigured()) {
    if (form) return formRedirect(request, "/login?error=config");
    return NextResponse.json({ error: "site_password_missing" }, { status: 503 });
  }

  let password = "";
  try {
    if (form) {
      const data = await request.formData();
      const value = data.get("password");
      password = typeof value === "string" ? value : "";
    } else {
      const body = (await request.json()) as { password?: unknown };
      password = typeof body.password === "string" ? body.password : "";
    }
  } catch {
    if (form) return formRedirect(request, "/login?error=invalid");
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!isValidSitePassword(password)) {
    if (form) return formRedirect(request, "/login?error=password");
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  const token = await sessionTokenFromPassword(password);
  // Unique query so a stale client-router / BFCache entry for "/" is not reused
  // after 出村 cleared the cookie. The village page strips `booted` on mount.
  const response = form
    ? formRedirect(request, `/?booted=${Date.now()}`)
    : NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
