/**
 * PV-PM-110 — before a name is chosen, the map keeps one invitation.
 * Door light, share, week, and welcome do not speak together.
 * Set the flag false to let every cue show again.
 */

export const ONE_FIELD_INVITE_ENABLED = true;

export const LOUD_PHRASES = ["今日还空着", "村口", "门灯", "分享"] as const;

const NOT_A_SENTENCE = /^(−|-|＋|\+|全|拉远|全景|拉近|静音|有声|氛围|×|⋯)$/;

export function oneFieldInviteOn(enabled = ONE_FIELD_INVITE_ENABLED) {
  return enabled;
}

export function oneFieldInviteMark(enabled = ONE_FIELD_INVITE_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** True while the loud map cues should wait. */
export function guestInvitesQuiet(hasSelf: boolean, enabled = ONE_FIELD_INVITE_ENABLED) {
  return enabled && !hasSelf;
}

export function loudPhraseHits(texts: string[]) {
  const hits = new Set<string>();
  for (const text of texts) {
    for (const phrase of LOUD_PHRASES) {
      if (text.includes(phrase)) hits.add(phrase);
    }
  }
  return [...hits];
}

export function atMostOneLoudInvite(texts: string[]) {
  return loudPhraseHits(texts).length <= 1;
}

/** Zoom and mute are tools. Other clickable sentences inside the map should stay few. */
export function sentenceBlockCount(labels: string[]) {
  return labels.filter((label) => {
    const text = label.trim();
    return text.length > 0 && !NOT_A_SENTENCE.test(text);
  }).length;
}
