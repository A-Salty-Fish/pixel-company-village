"use client";

import type { VillageFeedback } from "@/features/village-feedback/village-feedback";

export function FeedbackStrip(props: { beat: VillageFeedback | null }) {
  if (!props.beat) return null;
  return (
    <p
      className="map-feedback"
      data-testid="village-feedback"
      data-feedback-target={props.beat.targetId}
      data-feedback-state={props.beat.state}
    >
      {props.beat.toast}
    </p>
  );
}
