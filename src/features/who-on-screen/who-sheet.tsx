"use client";

import { useState } from "react";
import {
  WHO_ENTRY_EMPTY,
  WHO_ENTRY_SEARCH,
  filterWhoNames,
  whoEntryOn,
} from "@/features/who-entry/who-entry";

type Props = {
  names: string[];
  selfName: string | null;
  onSelf: (name: string | null) => void;
  onClose: () => void;
};

/** Name picker for the current screen. No settings essay. */
export function WhoSheet(props: Props) {
  const entry = whoEntryOn();
  const [query, setQuery] = useState("");
  const shown = entry ? filterWhoNames(props.names, query) : [];
  return (
    <div
      className={`who-sheet${entry ? " who-sheet-entry" : ""}`}
      data-testid="who-sheet"
      data-who-entry={entry ? "1" : "0"}
      role="dialog"
      aria-label="我是谁"
    >
      {entry ? (
        <>
          <p className="who-sheet-title">我是谁？找到自己的名字，点一下。</p>
          <input
            type="search"
            className="hud-select who-search"
            data-testid="who-search"
            placeholder={WHO_ENTRY_SEARCH}
            aria-label={WHO_ENTRY_SEARCH}
            value={query}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className="who-name-list" data-testid="who-name-list" aria-label="名字">
            {shown.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="who-name-option"
                  data-testid="who-name-option"
                  data-who-name={name}
                  aria-pressed={props.selfName === name}
                  onClick={() => props.onSelf(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
          {shown.length === 0 ? <p className="who-name-empty">{WHO_ENTRY_EMPTY}</p> : null}
        </>
      ) : null}
      <label className="block space-y-1 text-sm text-[#2a1a10]">
        <span className="pixel-label">{entry ? "也可以从下拉里选" : "选择自己的名字"}</span>
        <select
          className="hud-select"
          data-testid="self-picker"
          value={props.selfName ?? ""}
          onChange={(event) => props.onSelf(event.target.value || null)}
        >
          <option value="">还没选定</option>
          {props.names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="hud-btn hud-btn-ghost" onClick={props.onClose}>
        收起
      </button>
    </div>
  );
}
