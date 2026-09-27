import demoRoster from "../../data/demo/roster.json";
import demoSeed from "../../data/demo/seed.json";

if (typeof window !== "undefined") {
  throw new Error("operator-data is server-only");
}

/**
 * Server-side data switch. The repo ships only the fictional demo.
 * Operators may set VILLAGE_ROSTER_B64 and VILLAGE_SEED_B64 (base64 JSON)
 * in the host environment. Those variables are not NEXT_PUBLIC_, so they
 * are not part of the public demo.
 *
 * Do not import this module from client components.
 */
function readEnvJson(key: string): unknown | null {
  const raw = process.env[key];
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function loadRosterDocument(): unknown {
  return readEnvJson("VILLAGE_ROSTER_B64") ?? demoRoster;
}

export function loadSeedDocument(): unknown {
  return readEnvJson("VILLAGE_SEED_B64") ?? demoSeed;
}
