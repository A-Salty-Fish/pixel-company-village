"use client";

import { TODAY_CAN_DO_ENABLED, TODAY_LINES, TODAY_TITLE, type TodayHintPhase } from "@/features/today-can-do/today-can-do";

/** Top map-corner note. No backdrop and no dialog role. */
export function TodayHint({ phase }: { phase: TodayHintPhase }) {
  if (!TODAY_CAN_DO_ENABLED || phase === "off") return null;
  return (
    <aside className="today-hint" data-testid="today-can-do" data-today-hint={phase} data-module="today-can-do">
      <p className="today-hint-title">{TODAY_TITLE}</p>
      <ul className="today-hint-list">
        {TODAY_LINES.map((line) => (
          <li key={line} data-today-line={line}>
            {line}
          </li>
        ))}
      </ul>
    </aside>
  );
}
