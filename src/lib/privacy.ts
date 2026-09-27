const FORBIDDEN_KEY =
  /^(message|messages|msg|chat|content|text|screenshot|screenshots|group|group_name|groupname|bucket|scan_path|scanpath|raw|transcript|body|snippet|fragment|image|photo)$/i;

const MAX_STRING = 80;
const MAX_SCAN_STRING = 120;
const MAX_PEOPLE = 100;
const MAX_BODY_BYTES = 24_576;

export function payloadByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function rejectPrivateOrHuge(value: unknown, path = "$"): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (value.length > MAX_SCAN_STRING) {
      return `unexpected_text_blob:${path}`;
    }
    return null;
  }
  if (typeof value === "number" || typeof value === "boolean") return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const err = rejectPrivateOrHuge(value[i], `${path}[${i}]`);
      if (err) return err;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEY.test(key)) {
        return `forbidden_field:${key}`;
      }
      const err = rejectPrivateOrHuge(child, `${path}.${key}`);
      if (err) return err;
    }
  }
  return null;
}

export function isSafeName(name: string): boolean {
  return name.length >= 1 && name.length <= 24 && !/[\n\r\t]/.test(name);
}

export { MAX_STRING, MAX_PEOPLE, MAX_BODY_BYTES };
