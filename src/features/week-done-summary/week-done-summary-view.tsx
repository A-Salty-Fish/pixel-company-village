"use client";

import { WEEK_SETTLED_NOTE, WEEK_SETTLED_TITLE, WEEK_THUMBS } from "@/features/week-done-summary/week-done-summary";
import styles from "@/features/week-done-summary/week-done-summary-view.module.css";

const ART = {
  footprints: styles.footprints,
  kettle: styles.kettle,
  ribbon: styles.ribbon,
} as const;

/** World traces for a finished week. No scores and no order of merit. */
export function WeekDoneSummary() {
  return (
    <section className={styles.panel} data-testid="week-settled" aria-label={WEEK_SETTLED_TITLE}>
      <p className={`pixel-label ${styles.title}`}>{WEEK_SETTLED_TITLE}</p>
      <p className={styles.note}>{WEEK_SETTLED_NOTE}</p>
      <div className={styles.row}>
        {WEEK_THUMBS.map((thumb) => (
          <figure key={thumb.id} className={styles.thumb} data-thumb={thumb.id} data-chore={thumb.label} data-done="1">
            <span className={`${styles.art} ${ART[thumb.id]}`} aria-hidden />
            <figcaption className={styles.caption}>{thumb.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
