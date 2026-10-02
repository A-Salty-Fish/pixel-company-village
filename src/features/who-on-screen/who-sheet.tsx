"use client";

type Props = {
  names: string[];
  selfName: string | null;
  onSelf: (name: string | null) => void;
  onClose: () => void;
};

/** Name picker for the current screen. No settings essay. */
export function WhoSheet(props: Props) {
  return (
    <div className="who-sheet" data-testid="who-sheet" role="dialog" aria-label="我是谁">
      <label className="block space-y-1 text-sm text-[#2a1a10]">
        <span className="pixel-label">选择自己的名字</span>
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
