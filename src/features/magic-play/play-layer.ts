/**
 * PV-MAGIC-PLAY-001 — the hand-drawn half of wizard play: link beams, staff trails, the charge ring,
 * summoned critters and plants, chorus notes and the little game pips over landmarks.
 * All of it is a few dozen rects a frame, in screen space, under the same budget as the spells.
 */
import { RUNE_GOAL, SUMMON_CAP, SUMMON_LIFE, TRAIL_LIFE, WISH_GOAL, chargeLevel, chargeTier, trailPush, type ChainKind, type Summon, type TrailPoint } from "./magic-play";

export type PlayView = { camX: number; camY: number; spanW: number; spanH: number; viewW: number; viewH: number };
export type LoopDraw = (id: string, x: number, y: number, scale: number, alpha: number, time: number) => boolean;

type Beam = { ax: number; ay: number; bx: number; by: number; born: number; kind: ChainKind | "chorus" };
type Live = Summon & { x: number; y: number; born: number; seed: number };
type Note = { x: number; y: number; born: number; color: string; drift: number };
type Pips = { kind: "wish" | "rune"; n: number; x: number; y: number; until: number; flash: number };

const BEAM_LIFE = 1.1;
const NOTE_LIFE = 1.7;
const BEAM_COLORS: Record<Beam["kind"], [string, string]> = {
  link: ["#fffbe0", "#7ae8ff"],
  swap: ["#fff0ff", "#c49aff"],
  fuse: ["#fff6c0", "#ff8a4a"],
  chorus: ["#fff0f6", "#ff7ad2"],
};
const TRAIL_COLORS = ["#fff6c0", "#ffd84a", "#ff9ad8", "#7ae8ff", "#c49aff"];
const CHARGE_COLORS = { 1: "#7ae8ff", 2: "#ffd84a", 3: "#ff7ad2" } as const;
const NOTE = [
  [0, 0, 1, 1, 1],
  [0, 0, 1, 0, 1],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 0],
];

export class PlayLayer {
  private beams: Beam[] = [];
  private trail: TrailPoint[] = [];
  private charge: { x: number; y: number; born: number } | null = null;
  private summons: Live[] = [];
  private notes: Note[] = [];
  private pips: Pips[] = [];
  private now = 0;

  /** Called by the layer before anything else each paint, so new marks share its clock. */
  tick(now: number) {
    this.now = now;
  }

  beam(ax: number, ay: number, bx: number, by: number, kind: Beam["kind"]) {
    this.beams.push({ ax, ay, bx, by, born: this.now, kind });
    if (this.beams.length > 4) this.beams.shift();
  }

  chorus(ax: number, ay: number, bx: number, by: number) {
    this.beam(ax, ay - 20, bx, by - 20, "chorus");
    const colors = ["#ff7ad2", "#ffd84a", "#7ae8ff"];
    for (let i = 0; i < 3; i += 1) {
      this.notes.push({ x: ax + (i - 1) * 6, y: ay - 40, born: this.now + i * 0.22, color: colors[i], drift: -1 });
      this.notes.push({ x: bx + (i - 1) * 6, y: by - 40, born: this.now + i * 0.22 + 0.11, color: colors[(i + 1) % 3], drift: 1 });
    }
    if (this.notes.length > 18) this.notes.splice(0, this.notes.length - 18);
  }

  chargeStart(x: number, y: number) {
    this.charge = { x, y, born: this.now };
    this.trail = [];
  }

  chargeMove(x: number, y: number) {
    if (!this.charge) return;
    this.charge.x = x;
    this.charge.y = y;
    this.trail = trailPush(this.trail, { x, y, at: this.now });
  }

  /** The level the ring shows right now; the scene uses its own clock for the cast. */
  chargeNow() {
    return this.charge ? chargeLevel((this.now - this.charge.born) * 1000 + 420) : 0;
  }

  chargeEnd() {
    const trail = this.trail.slice();
    this.charge = null;
    return trail;
  }

  get charging() {
    return Boolean(this.charge);
  }

  summon(summon: Summon, x: number, y: number) {
    this.summons.push({ ...summon, x, y, born: this.now, seed: Math.floor(x * 7 + y * 3) % 97 });
    while (this.summons.length > SUMMON_CAP) this.summons.shift();
  }

  showPips(kind: Pips["kind"], n: number, x: number, y: number, seconds = 25) {
    this.pips = this.pips.filter((pip) => pip.kind !== kind);
    this.pips.push({ kind, n, x, y, until: this.now + seconds, flash: this.now });
  }

  clear() {
    this.beams = [];
    this.trail = [];
    this.charge = null;
    this.summons = [];
    this.notes = [];
    this.pips = [];
  }

  get counts() {
    return { beams: this.beams.length, trail: this.trail.length, summons: this.summons.length, charging: Boolean(this.charge), notes: this.notes.length, pips: this.pips.length };
  }

  paint(ctx: CanvasRenderingContext2D, view: PlayView, lite: boolean, loop: LoopDraw) {
    const now = this.now;
    const sx = view.viewW / view.spanW;
    const sy = view.viewH / view.spanH;
    const unit = Math.max(1, Math.round(sx));
    const at = (wx: number, wy: number) => ({ x: (wx - view.camX) * sx, y: (wy - view.camY) * sy });
    const dot = (x: number, y: number, size: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    };

    // summons: critters loop in place, plants grow from the ground
    this.summons = this.summons.filter((live) => now - live.born < SUMMON_LIFE);
    for (const live of this.summons) {
      const age = now - live.born;
      const fade = Math.min(1, age / 0.4, (SUMMON_LIFE - age) / 0.6);
      if (live.kind === "critter") {
        const hopX = live.x + Math.sin(age * 0.9 + live.seed) * 6;
        loop(live.id, hopX, live.y, live.scale, Math.max(0, fade), age + live.seed * 0.1);
      } else {
        const grow = Math.min(1, age / 0.7);
        const p = at(live.x, live.y);
        const stem = Math.round(9 * grow);
        const sway = Math.round(Math.sin(age * 2 + live.seed) * unit * 0.6);
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = "#3e8a3a";
        ctx.fillRect(Math.round(p.x), Math.round(p.y - stem * unit), unit, stem * unit);
        if (grow > 0.5) {
          ctx.fillStyle = "#5ac05a";
          ctx.fillRect(Math.round(p.x - 2 * unit), Math.round(p.y - 4 * unit), 2 * unit, unit);
          ctx.fillRect(Math.round(p.x + unit), Math.round(p.y - 6 * unit), 2 * unit, unit);
        }
        if (grow >= 1) {
          const petal = ["#ff9ad8", "#ffd84a", "#c49aff", "#7ae8ff"][live.seed % 4];
          const cx = p.x + sway;
          const cy = p.y - (stem + 2) * unit;
          dot(cx - 2 * unit, cy, 2 * unit, petal);
          dot(cx + 2 * unit, cy, 2 * unit, petal);
          dot(cx, cy - 2 * unit, 2 * unit, petal);
          dot(cx, cy + 2 * unit, 2 * unit, petal);
          dot(cx, cy, 2 * unit, "#fff6c0");
        }
        ctx.globalAlpha = 1;
      }
    }

    // landmark game pips: wishes as coins over the fountain, runes around the plaza circle
    this.pips = this.pips.filter((pip) => pip.until > now);
    for (const pip of this.pips) {
      const fresh = Math.max(0, 1 - (now - pip.flash) / 0.5);
      if (pip.kind === "wish") {
        for (let i = 0; i < WISH_GOAL; i += 1) {
          const p = at(pip.x + (i - 1) * 8, pip.y - 34 - (i < pip.n ? Math.abs(Math.sin(now * 3 + i)) * 2 : 0));
          dot(p.x, p.y, 3 * unit, i < pip.n ? "#f2d15c" : "rgba(40, 30, 10, 0.45)");
          if (i < pip.n) dot(p.x - unit, p.y - unit, unit, "#fffbe0");
        }
      } else {
        for (let i = 0; i < RUNE_GOAL; i += 1) {
          const angle = -Math.PI / 2 + (i / RUNE_GOAL) * Math.PI * 2;
          const p = at(pip.x + Math.cos(angle) * 30, pip.y + Math.sin(angle) * 16);
          const lit = i < pip.n;
          if (lit) {
            ctx.globalAlpha = 0.35 + 0.25 * Math.sin(now * 5 + i);
            dot(p.x, p.y, 7 * unit, "#c49aff");
            ctx.globalAlpha = 1;
          }
          dot(p.x, p.y, 3 * unit, lit ? "#fff0a8" : "rgba(60, 30, 90, 0.55)");
          if (lit && i === pip.n - 1 && fresh > 0) dot(p.x, p.y - 5 * unit, unit * 2, "#ffffff");
        }
      }
    }

    // link beams: the head races from a to b, then the line crackles and fades
    this.beams = this.beams.filter((beam) => now - beam.born < BEAM_LIFE);
    const beamCap = lite ? 2 : 4;
    for (const beam of this.beams.slice(-beamCap)) {
      const age = now - beam.born;
      if (age < 0) continue;
      const head = Math.min(1, age / 0.32);
      const fade = age < 0.6 ? 1 : Math.max(0, 1 - (age - 0.6) / (BEAM_LIFE - 0.6));
      const [core, glow] = BEAM_COLORS[beam.kind];
      const dx = beam.bx - beam.ax;
      const dy = beam.by - beam.ay;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const steps = Math.min(lite ? 24 : 48, Math.max(6, Math.round(length / 4)));
      ctx.globalAlpha = fade;
      for (let i = 0; i <= steps; i += 1) {
        const f = i / steps;
        const reach = beam.kind === "fuse" ? Math.min(f, 1 - f) * 2 <= head || head >= 1 : f <= head;
        if (!reach) continue;
        const arc = beam.kind === "swap" || beam.kind === "chorus" ? Math.sin(f * Math.PI) * -14 : 0;
        const jitter = beam.kind === "link" ? Math.sin(i * 1.7 + age * 40) * 2.2 : beam.kind === "fuse" ? Math.sin(i * 0.9 + age * 18) * 1.4 : 0;
        const wx = beam.ax + dx * f + nx * jitter;
        const wy = beam.ay + dy * f + ny * jitter + arc;
        const p = at(wx, wy);
        dot(p.x, p.y, 3 * unit, glow);
        dot(p.x, p.y, unit + (i % 3 === 0 ? unit : 0), core);
      }
      ctx.globalAlpha = 1;
    }

    // chorus notes float up and sway
    this.notes = this.notes.filter((note) => now - note.born < NOTE_LIFE);
    for (const note of this.notes) {
      const age = now - note.born;
      if (age < 0) continue;
      const p = at(note.x + Math.sin(age * 4) * 3 + note.drift * age * 6, note.y - age * 16);
      ctx.globalAlpha = Math.max(0, 1 - age / NOTE_LIFE);
      ctx.fillStyle = note.color;
      for (let r = 0; r < NOTE.length; r += 1)
        for (let c = 0; c < NOTE[r].length; c += 1) if (NOTE[r][c]) ctx.fillRect(Math.round(p.x + c * unit), Math.round(p.y + r * unit), unit, unit);
      ctx.globalAlpha = 1;
    }

    // staff trail: a fading ribbon of sparks
    if (this.trail.length) {
      this.trail = this.trail.filter((point) => now - point.at <= TRAIL_LIFE);
      const stride = lite ? 2 : 1;
      for (let i = 0; i < this.trail.length; i += stride) {
        const point = this.trail[i];
        const life = 1 - (now - point.at) / TRAIL_LIFE;
        const p = at(point.x, point.y);
        ctx.globalAlpha = Math.max(0, life);
        const color = TRAIL_COLORS[i % TRAIL_COLORS.length];
        dot(p.x, p.y, Math.max(unit, Math.round(3 * unit * life)), color);
        if (i % 4 === 0 && !lite) {
          dot(p.x, p.y - 3 * unit, unit, "#ffffff");
          dot(p.x + 3 * unit, p.y, unit, "#ffffff");
        }
      }
      ctx.globalAlpha = 1;
    }

    // charge ring: grows, spins and changes colour by tier
    if (this.charge) {
      const level = this.chargeNow();
      const tier = chargeTier(level);
      const color = CHARGE_COLORS[tier];
      const radius = 8 + level * 22;
      const spin = (now - this.charge.born) * (2 + tier);
      const count = lite ? 10 : 16;
      ctx.globalAlpha = 0.18 + level * 0.2;
      const c = at(this.charge.x, this.charge.y);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, radius * sx, radius * 0.55 * sy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let i = 0; i < count; i += 1) {
        const a = spin + (i / count) * Math.PI * 2;
        const p = at(this.charge.x + Math.cos(a) * radius, this.charge.y + Math.sin(a) * radius * 0.55);
        dot(p.x, p.y, (i % 4 === 0 ? 3 : 2) * unit, i % 4 === 0 ? "#ffffff" : color);
      }
      // motes spiral in
      for (let i = 0; i < (lite ? 3 : 6); i += 1) {
        const f = ((now * 1.5 + i / 6) % 1) as number;
        const a = -spin * 0.7 + i * 1.05;
        const r = radius * (1.4 - f);
        const p = at(this.charge.x + Math.cos(a) * r, this.charge.y - 10 * f + Math.sin(a) * r * 0.55);
        dot(p.x, p.y, 2 * unit, color);
      }
      if (level >= 1 && Math.floor(now * 8) % 2 === 0) {
        const p = at(this.charge.x, this.charge.y - 28);
        dot(p.x, p.y, 3 * unit, "#ffffff");
      }
    }
  }
}
