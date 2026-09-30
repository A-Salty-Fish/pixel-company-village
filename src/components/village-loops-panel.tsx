"use client";

import {
  LOOP_IDS,
  LOOP_IDLE,
  LOOP_INTRO,
  LOCKED_LINE,
  loopSpot,
  loopTally,
  tallyLine,
  type LoopBlob,
  type LoopId,
} from "@/lib/village-loops";
import { toyDockLocksScroll } from "@/features/toy-dock/toy-dock";

type Props = {
  selfName: string | null;
  blob: LoopBlob;
  pebbles: number;
  ymd: string;
  reduced: boolean;
  line: string | null;
  onAct: (id: LoopId) => void;
};

export function VillageLoopsPanel(props: Props) {
  const tally = loopTally(props.blob, props.pebbles, props.ymd);
  return (
    <details
      className="hud-panel"
      data-testid="village-loops"
      data-loop-count={LOOP_IDS.length}
      data-viewer={props.selfName ?? ""}
      data-motion={props.reduced ? "reduced" : "full"}
    >
      <summary className="hud-title cursor-pointer">
        村里小玩
        <span className="ml-2 text-xs font-normal" data-testid="loop-summary-tally">
          {tally.done}/{tally.total}
        </span>
      </summary>
      <div className="space-y-3 px-3 py-3 text-sm text-[#2a1a10]">
        <p className="text-xs leading-5 text-[#6a3d18]">{LOOP_INTRO}</p>
        {props.selfName ? null : (
          <p className="text-xs text-[#6a3d18]" data-testid="loop-locked">
            {LOCKED_LINE}
          </p>
        )}
        <p className="pixel-label" data-testid="loop-tally">
          {tallyLine(tally.done, tally.total)}
        </p>
        <div
          className="loop-yard"
          role="group"
          aria-label="院子里的十处小玩"
          data-testid="loop-yard"
          data-motion={props.reduced ? "reduced" : "full"}
        >
          {LOOP_IDS.map((id) => {
            const spot = loopSpot(id, props.blob, props.pebbles, props.ymd, props.reduced);
            return (
              <button
                key={id}
                type="button"
                className="loop-spot"
                data-testid={`loop-${id}`}
                data-loop={id}
                data-pressed={spot.pressed ? "1" : "0"}
                data-glow={spot.glow}
                data-lean={spot.lean}
                data-open={spot.open ? "1" : "0"}
                data-count={spot.count}
                data-scope={spot.scope}
                disabled={!props.selfName}
                aria-pressed={spot.pressed}
                aria-label={`${spot.label}，${spot.status}`}
                onPointerDown={(event) => {
                  if (toyDockLocksScroll(id)) event.preventDefault();
                }}
                onClick={() => props.onAct(id)}
              >
                <span className="loop-spot-art" aria-hidden data-kind={id} />
                <span className="loop-spot-label">{spot.label}</span>
                <span className="loop-spot-status">{spot.status}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#6a3d18]" data-testid="loop-line">
          {props.line ?? LOOP_IDLE}
        </p>
      </div>
    </details>
  );
}
