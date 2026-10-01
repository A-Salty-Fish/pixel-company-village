"use client";

import {
  TODAY_CAN_DO_ENABLED,
  TODAY_LINES,
  TODAY_LOOP_ENABLED,
  TODAY_TITLE,
  todayLoopView,
  type TodayHintPhase,
} from "@/features/today-can-do/today-can-do";

/** Top map-corner note. No backdrop and no dialog role. */
export function TodayHint({ phase, done = [] }: { phase: TodayHintPhase; done?: readonly string[] }) {
  if (!TODAY_CAN_DO_ENABLED || phase === "off") return null;
  const loop = TODAY_LOOP_ENABLED ? todayLoopView(done) : [];
  return (
    <aside className="today-hint" data-testid="today-can-do" data-today-hint={phase} data-module="today-can-do">
      <p className="today-hint-title">{TODAY_TITLE}</p>
      <ul className="today-hint-list">
        {TODAY_LINES.map((line) => (
          <li key={line} data-today-line={line}>
            {line}
          </li>
        ))}
        {loop.map((step) => (
          <li key={step.id} data-today-step={step.id} data-done={step.done ? "1" : "0"} data-current={step.current ? "1" : "0"}>
            {step.done ? "✓ " : ""}
            {step.line}
          </li>
        ))}
      </ul>
    </aside>
  );
}
