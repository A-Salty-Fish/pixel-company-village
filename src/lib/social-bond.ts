/**
 * Viewer-local bond counts. A wave or kindness steps the count.
 * Sentences stay in the UI; storage is numbers only.
 */

export const BOND_CAP = 6;

export const BOND_LINES = ["", "点过一次头。", "会互相挥手。", "熟识了。"] as const;

export function bondLevel(count: number) {
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

export function bondLine(level: number) {
  const step = Math.max(0, Math.min(3, Math.floor(level)));
  return BOND_LINES[step] ?? "";
}

export function readBonds(value: unknown) {
  const counts: Record<string, number> = {};
  if (!value || typeof value !== "object") return counts;
  for (const [name, n] of Object.entries(value as Record<string, unknown>)) {
    if (name.length < 1 || name.length > 24 || /[\n\r\t]/.test(name)) continue;
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    counts[name] = Math.max(0, Math.min(BOND_CAP, Math.floor(n)));
  }
  return counts;
}

export function bumpBond(bonds: Record<string, number> | undefined, name: string) {
  const next = { ...(bonds ?? {}) };
  if (!name || name.length > 24 || /[\n\r\t]/.test(name)) return next;
  next[name] = Math.min(BOND_CAP, (next[name] ?? 0) + 1);
  return next;
}

export function dropBond(bonds: Record<string, number> | undefined, name: string) {
  const next = { ...(bonds ?? {}) };
  if (!next[name]) return next;
  next[name] -= 1;
  if (next[name] <= 0) delete next[name];
  return next;
}

export function bondNames(bonds: Record<string, number> | undefined) {
  return Object.entries(bonds ?? {})
    .filter(([, count]) => count >= 1)
    .map(([name]) => name);
}
