/**
 * PV-PM-102 — the spoken 「回家」 stays on the bottom button.
 * The map tool keeps a short mark. Set the flag false to put the word back on the map.
 */

export const ONE_HOME_WORD_ENABLED = true;
export const MAP_HOME_MARK = "屋";
export const MAP_HOME_ARIA = "送到屋顶";
export const DRAWER_HOME_SWITCH = "屋檐";
export const SPOKEN_HOME = "回家";

export function oneHomeWordOn(enabled = ONE_HOME_WORD_ENABLED) {
  return enabled;
}

export function mapHomeFace(enabled = ONE_HOME_WORD_ENABLED) {
  return enabled ? MAP_HOME_MARK : SPOKEN_HOME;
}

export function mapHomeAria(enabled = ONE_HOME_WORD_ENABLED) {
  return enabled ? MAP_HOME_ARIA : SPOKEN_HOME;
}

export function drawerHomeSwitch(enabled = ONE_HOME_WORD_ENABLED) {
  return enabled ? DRAWER_HOME_SWITCH : SPOKEN_HOME;
}

export function countsSpokenHome(label: string) {
  return label === SPOKEN_HOME ? 1 : 0;
}
