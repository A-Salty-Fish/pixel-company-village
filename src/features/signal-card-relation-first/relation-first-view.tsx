"use client";

import type { ReactNode } from "react";
import { RELATION_LEAD, SCORE_LABEL } from "@/features/signal-card-relation-first/relation-first";
import styles from "@/features/signal-card-relation-first/relation-first-view.module.css";

type LeadProps = {
  availabilityLabel: string;
  availabilityTone: "green" | "yellow" | "red";
  kindnessNote: string;
  bondNote?: string;
  sundayNote?: string | null;
  line: string | null;
  socialReply?: "wave" | "kind" | null;
};

/** Local status and the bond sit above any score. */
export function RelationFirstLead(props: LeadProps) {
  return (
    <section className={styles.lead} data-testid="relation-status">
      <p className={styles.leadLine}>{RELATION_LEAD}</p>
      <p className={styles.status} data-availability={props.availabilityLabel}>
        <span className={`avail-dot avail-${props.availabilityTone}`} aria-hidden />
        <span>{props.availabilityLabel}</span>
      </p>
      <p className={styles.note} data-kindness-quota>
        {props.kindnessNote}
      </p>
      {props.bondNote ? (
        <p className={styles.note} data-testid="bond-note">
          {props.bondNote}
        </p>
      ) : null}
      {props.sundayNote ? (
        <p className="hud-stat pixel-label text-[#2a1a10]" data-testid="sunday-bonus">
          {props.sundayNote}
        </p>
      ) : null}
      {props.line ? (
        <p className="hud-stat pixel-label text-[#2a1a10]" data-event-line data-social-reply={props.socialReply ?? ""}>
          {props.line}
        </p>
      ) : (
        <p className={styles.note}>再点一次这个人：点头，坐下，再吓一跳。不消耗关照。</p>
      )}
    </section>
  );
}

/** Closed until the reader asks for 分数. Wave and kindness stay outside this block. */
export function ScoreRingsDisclosure(props: { enabled: boolean; children: ReactNode }) {
  if (!props.enabled) return props.children;
  return (
    <details className={styles.score} data-testid="score-disclosure">
      <summary className={styles.summary}>{SCORE_LABEL}</summary>
      <div className={styles.scoreBody}>{props.children}</div>
    </details>
  );
}
