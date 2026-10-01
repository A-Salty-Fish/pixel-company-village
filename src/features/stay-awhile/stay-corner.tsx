"use client";

import type { StayCandidate } from "@/features/stay-awhile/stay-awhile";

type Props = {
  note: string;
  slots: StayCandidate[];
  onPick: (slot: StayCandidate) => void;
};

/** Map-corner steps. Not inside an accordion. */
export function StayCorner(props: Props) {
  if (props.slots.length < 2) return null;
  return (
    <div className="stay-slots map-more-item" data-testid="stay-slots" data-stay-count={props.slots.length}>
      <p className="stay-note">{props.note}</p>
      {props.slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          className="hud-btn hud-btn-ghost stay-slot"
          data-testid="stay-slot"
          data-stay-id={slot.id}
          data-stay-kind={slot.kind}
          onClick={() => props.onPick(slot)}
        >
          {slot.label}
        </button>
      ))}
    </div>
  );
}
