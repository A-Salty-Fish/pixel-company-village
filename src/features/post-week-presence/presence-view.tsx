"use client";

import { GLANCE_ACT, GLANCE_DONE, GLANCE_NOTE, GLANCE_READY } from "@/features/post-week-presence/presence";
import styles from "@/features/post-week-presence/presence-view.module.css";

/** One canned glance after the week board. No chat text. */
export function PostWeekPresence({ phase, onGlance }: { phase: "ready" | "done"; onGlance: () => void }) {
  if (phase === "done") {
    return (
      <section className={styles.panel} data-testid="post-week-presence" data-post-week="done" aria-label={GLANCE_DONE}>
        <p className={styles.done}>{GLANCE_DONE}</p>
        <p className={styles.note}>{GLANCE_NOTE}</p>
      </section>
    );
  }
  return (
    <section className={styles.panel} data-testid="post-week-presence" data-post-week="ready" aria-label={GLANCE_ACT}>
      <p className={styles.note}>{GLANCE_READY}</p>
      <button type="button" className={`hud-btn ${styles.act}`} data-testid="post-week-glance" onClick={onGlance}>
        {GLANCE_ACT}
      </button>
    </section>
  );
}
