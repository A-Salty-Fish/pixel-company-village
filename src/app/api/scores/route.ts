import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { getScores } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const ok = await isValidSession(jar.get(SESSION_COOKIE)?.value);
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await getScores();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
