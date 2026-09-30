"use client";

import {
  NOOK_IDS,
  NOOK_IDLE,
  NOOK_INTRO,
  NOOK_LOCKED,
  nookSpot,
  nookTally,
  nookTallyLine,
  type NookBlob,
  type NookId,
  type NookSession,
} from "@/lib/yard-nook";

type Props = {
  selfName: string | null;
  blob: NookBlob;
  session: NookSession;
  ymd: string;
  reduced: boolean;
  line: string | null;
  onAct: (id: NookId) => void;
};

export function YardNookPanel(props: Props) {
  const tally = nookTally(props.blob, props.session, props.ymd);
  return (
    <details
      className="hud-panel"
      data-testid="yard-nook"
      data-nook-count={NOOK_IDS.length}
      data-viewer={props.selfName ?? ""}
      data-motion={props.reduced ? "reduced" : "full"}
    >
      <summary className="hud-title cursor-pointer">
        屋边角落
        <span className="ml-2 text-xs font-normal" data-testid="nook-summary-tally">
          {tally.done}/{tally.total}
        </span>
      </summary>
      <div className="space-y-3 px-3 py-3 text-sm text-[#2a1a10]">
        <p className="text-xs leading-5 text-[#6a3d18]">{NOOK_INTRO}</p>
        {props.selfName ? null : (
          <p className="text-xs text-[#6a3d18]" data-testid="nook-locked">
            {NOOK_LOCKED}
          </p>
        )}
        <p className="pixel-label" data-testid="nook-tally">
          {nookTallyLine(tally.done, tally.total)}
        </p>
        <div
          className="loop-yard"
          role="group"
          aria-label="屋边的十处小玩"
          data-testid="nook-yard"
          data-motion={props.reduced ? "reduced" : "full"}
        >
          {NOOK_IDS.map((id) => {
            const spot = nookSpot(id, props.blob, props.session, props.ymd, props.reduced);
            return (
              <button
                key={id}
                type="button"
                className="loop-spot"
                data-testid={`nook-${id}`}
                data-nook={id}
                data-pressed={spot.pressed ? "1" : "0"}
                data-sway={spot.sway}
                data-swing={spot.swing}
                data-count={spot.count}
                data-scope={spot.scope}
                disabled={!props.selfName}
                aria-pressed={spot.pressed}
                aria-label={`${spot.label}，${spot.status}`}
                onClick={() => props.onAct(id)}
              >
                <span className="loop-spot-art" aria-hidden data-kind={id} />
                <span className="loop-spot-label">{spot.label}</span>
                <span className="loop-spot-status">{spot.status}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#6a3d18]" data-testid="nook-line">
          {props.line ?? NOOK_IDLE}
        </p>
      </div>
    </details>
  );
}
