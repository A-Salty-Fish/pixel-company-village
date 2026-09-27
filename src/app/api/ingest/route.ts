import { NextResponse } from "next/server";
import { ingestSecretConfigured, isValidIngestSecret, readIngestSecret } from "@/lib/auth";
import { MAX_BODY_BYTES } from "@/lib/privacy";
import { sanitizePayload } from "@/lib/scores";
import { saveScores, storageBackend } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!ingestSecretConfigured()) {
    return NextResponse.json({ error: "ingest_secret_missing" }, { status: 503 });
  }
  if (!isValidIngestSecret(readIngestSecret(request.headers))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawText = await request.text();
  if (rawText.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = sanitizePayload(parsed);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await saveScores(result.payload);
  return NextResponse.json({
    ok: true,
    date: result.payload.date,
    people: result.payload.people.length,
    store: storageBackend(),
  });
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
