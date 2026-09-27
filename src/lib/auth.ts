export const SESSION_COOKIE = "village_session";
const SESSION_SUBJECT = "company-village-session-v1";

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...view].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toHex(sig);
}

export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const left = enc.encode(a);
  const right = enc.encode(b);
  const len = Math.max(left.length, right.length, 1);
  let diff = left.length ^ right.length;
  for (let i = 0; i < len; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export async function sessionTokenFromPassword(password: string): Promise<string> {
  return hmacHex(password, SESSION_SUBJECT);
}

export async function expectedSessionToken(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  return sessionTokenFromPassword(password);
}

export async function isValidSession(token?: string | null): Promise<boolean> {
  const expected = await expectedSessionToken();
  if (!expected || !token) return false;
  return timingSafeEqual(token, expected);
}

export function sitePasswordConfigured(): boolean {
  return Boolean(process.env.SITE_PASSWORD);
}

export function ingestSecretConfigured(): boolean {
  return Boolean(process.env.INGEST_SECRET);
}

export function readIngestSecret(headers: Headers): string | null {
  const header = headers.get("x-ingest-secret");
  if (header) return header.trim();
  const auth = headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export function isValidIngestSecret(provided: string | null): boolean {
  const expected = process.env.INGEST_SECRET;
  if (!expected || !provided) return false;
  return timingSafeEqual(provided, expected);
}

export function isValidSitePassword(provided: string): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(provided, expected);
}
