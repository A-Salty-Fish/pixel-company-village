/**
 * compact-settings-discover — one canned tip beside 体贴设置.
 * Dismissal stores the single character "1" on this browser.
 * Set COMPACT_SETTINGS_DISCOVER_ENABLED to false to hide the tip.
 */

export const COMPACT_SETTINGS_DISCOVER_ENABLED = true;

export const DISCOVER_KEY = "village:settings-discover-v1";

export const DISCOVER_TIP = "减少动作和安静村子在这里。";

export function discoverStoredValue() {
  return "1" as const;
}

export function discoverShouldShow(stored: string | null, enabled = COMPACT_SETTINGS_DISCOVER_ENABLED) {
  return enabled && stored !== discoverStoredValue();
}
