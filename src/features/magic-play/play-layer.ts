/**
 * PV-MAGIC-PLAY-001 — the hand-drawn half of wizard play: link beams, staff trails, the charge ring,
 * summoned critters and plants, chorus notes and the little game pips over landmarks.
 * All of it is a few dozen rects a frame, under the same budget as the spells.
 * PV-MAGIC-STYLE-001: colours come from the shared ramps, sizes are whole world pixels, every mark eases in and out.
 */
import { RUNE_GOAL, SUMMON_CAP, SUMMON_LIFE, TRAIL_LIFE, WISH_GOAL, chargeLevel, chargeTier, trailPush, type ChainKind, type Summon, type TrailPoint } from "./magic-play";
import { beat, easeOutCubic, envelope, ramp, smoothstep } from "@/features/magic-style/magic-style";

export type PlayView = { camX: number; camY: number; spanW: number; spanH: number; viewW: number; viewH: number };
export type LoopDraw = (id: string, x: number, y: number, scale: number, alpha: number, time: number) => boolean;

type Beam = { ax: number; ay: number; bx: number; by: number; born: number; kind: ChainKind | "chorus" };
type Live = Summon & { x: number; y: number; born: number; seed: number };
type Note = { x: number; y: number; born: number; color: string; drift: number };
type Pips = { kind: "wish" | "rune"; n: number; x: number; y: number; until: number; flash: number };

const BEAM_LIFE = 1.1;
const NOTE_LIFE = 1.7;
const BEAM_COLORS: Record<Beam["kind"], [string, string]> = {
  link: [ramp("gold", 4), ramp("cyan", 2)],
  swap: [ramp("violet", 4), ramp("violet", 2)],
  fuse: [ramp("gold", 4), ramp("gold", 2)],
  chorus: [ramp("violet", 4), ramp("cyan", 2)],
};
const TRAIL_COLORS = [ramp("gold", 4), ramp("gold", 3), ramp("cyan", 3), ramp("gold", 3), ramp("violet", 3)];
const CHARGE_COLORS = { 1: ramp("cyan", 3), 2: ramp("gold", 3), 3: ramp("violet", 3) } as const;
const SPARK = ramp("gold", 4);
const NOTE_COLORS = [ramp("violet", 3), ramp("gold", 3), ramp("cyan", 3)];
const PETALS = [ramp("violet", 3), ramp("gold", 3), ramp("cyan", 3), ramp("violet", 2)];
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
  private stroke = 0;
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
    const colors = NOTE_COLORS;
    for (let i = 0; i < 3; i += 1) {
      this.notes.push({ x: ax + (i - 1) * 6, y: ay - 40, born: this.now + i * 0.22, color: colors[i], drift: -1 });
      this.notes.push({ x: bx + (i - 1) * 6, y: by - 40, born: this.now + i * 0.22 + 0.11, color: colors[(i + 1) % 3], drift: 1 });
    }
    if (this.notes.length > 18) this.notes.splice(0, this.notes.length - 18);
  }

  chargeStart(x: number, y: number) {
    this.charge = { x, y, born: this.now };
    this.trail = [];
    this.stroke = 0;
  }

  chargeMove(x: number, y: number) {
    if (!this.charge) return;
    this.stroke += Math.hypot(x - this.charge.x, y - this.charge.y);
    this.charge.x = x;
    this.charge.y = y;
    this.trail = trailPush(this.trail, { x, y, at: this.now });
  }

  /** The level the ring shows right now; the scene uses its own clock for the cast. */
  chargeNow() {
    return this.charge ? chargeLevel((this.now - this.charge.born) * 1000 + 420) : 0;
  }

  /** Whole stroke drawn while charging (world px); the visible trail only keeps the fading tail. */
  chargeStroke() {
    return this.stroke;
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
    // one scale for both axes; whole world pixels map to whole device pixels from zoom 2
    const k = view.viewW / view.spanW;
    const unit = Math.max(1, Math.round(k));
    const at = (wx: number, wy: number) => ({ x: Math.round((wx - view.camX) * k), y: Math.round((wy - view.camY) * k) });
    const dot = (x: number, y: number, size: number, color: string) => {
      ctx.fillStyle = color;
      const s = Math.max(1, Math.round(size));
      ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    };

    // summons: critters loop in place, plants grow from the ground
    this.summons = this.summons.filter((live) => now - live.born < SUMMON_LIFE);
    for (const live of this.summons) {
      const age = now - live.born;
      const fade = envelope(age, SUMMON_LIFE, 0.4, 0.8);
      if (live.kind === "critter") {
        const hopX = live.x + Math.round(Math.sin(age * 0.9 + live.seed) * 6);
        loop(live.id, hopX, live.y, live.scale, fade, age + live.seed * 0.1);
      } else {
        const grow = easeOutCubic(age / 0.7);
        const p = at(live.x, live.y);
        const stem = Math.round(9 * grow);
        const sway = Math.round(Math.sin(beat(age) * 2 + live.seed) * 0.6) * unit;
        ctx.globalAlpha = fade;
        ctx.fillStyle = "#3e8a3a";
        ctx.fillRect(p.x, p.y - stem * unit, unit, stem * unit);
        if (grow > 0.5) {
          ctx.fillStyle = "#5ac05a";
          ctx.fillRect(p.x - 2 * unit, p.y - 4 * unit, 2 * unit, unit);
          ctx.fillRect(p.x + unit, p.y - 6 * unit, 2 * unit, unit);
        }
        if (grow >= 0.98) {
          const petal = PETALS[live.seed % PETALS.length];
          const cx = p.x + sway;
          const cy = p.y - (stem + 2) * unit;
          dot(cx - 2 * unit, cy, 2 * unit, petal);
          dot(cx + 2 * unit, cy, 2 * unit, petal);
          dot(cx, cy - 2 * unit, 2 * unit, petal);
          dot(cx, cy + 2 * unit, 2 * unit, petal);
          dot(cx, cy, 2 * unit, ramp("gold", 4));
        }
        ctx.globalAlpha = 1;
      }
    }

    // landmark game pips: wishes as coins over the fountain, runes around the plaza circle
    this.pips = this.pips.filter((pip) => pip.until > now);
    for (const pip of this.pips) {
      const shown = Math.min(easeOutCubic((now - pip.flash) / 0.25 + 0.2), smoothstep((pip.until - now) / 0.4));
      const fresh = 1 - smoothstep((now - pip.flash) / 0.5);
      ctx.globalAlpha = shown;
      if (pip.kind === "wish") {
        for (let i = 0; i < WISH_GOAL; i += 1) {
          const bob = i < pip.n ? Math.round(Math.abs(Math.sin(beat(now) * 3 + i)) * 2) : 0;
          const p = at(pip.x + (i - 1) * 8, pip.y - 34 - bob);
          if (i < pip.n) {
            dot(p.x, p.y, 3 * unit, ramp("gold", 2));
            dot(p.x - unit, p.y - unit, unit, ramp("gold", 4));
          } else {
            ctx.globalAlpha = shown * 0.5;
            dot(p.x, p.y, 3 * unit, ramp("mist", 0));
            ctx.globalAlpha = shown;
          }
        }
      } else {
        for (let i = 0; i < RUNE_GOAL; i += 1) {
          const angle = -Math.PI / 2 + (i / RUNE_GOAL) * Math.PI * 2;
          const p = at(pip.x + Math.cos(angle) * 30, pip.y + Math.sin(angle) * 16);
          const lit = i < pip.n;
          if (lit) {
            // a soft stepped halo that breathes on the shared beat
            ctx.globalAlpha = shown * (Math.floor(beat(now) * 2 + i) % 2 ? 0.25 : 0.4);
            dot(p.x, p.y, 5 * unit, ramp("violet", 2));
            ctx.globalAlpha = shown;
            dot(p.x, p.y, 3 * unit, ramp("gold", 3));
          } else {
            ctx.globalAlpha = shown * 0.5;
            dot(p.x, p.y, 3 * unit, ramp("violet", 0));
            ctx.globalAlpha = shown;
          }
          if (lit && i === pip.n - 1 && fresh > 0) {
            ctx.globalAlpha = shown * fresh;
            dot(p.x, p.y - 5 * unit, unit * 2, SPARK);
            ctx.globalAlpha = shown;
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // link beams: the head races from a to b with an ease, holds, then fades out softly
    this.beams = this.beams.filter((beam) => now - beam.born < BEAM_LIFE);
    const beamCap = lite ? 2 : 3;
    for (const beam of this.beams.slice(-beamCap)) {
      const age = now - beam.born;
      if (age < 0) continue;
      const head = easeOutCubic(age / 0.32);
      const fade = smoothstep((BEAM_LIFE - age) / 0.5);
      const [core, glow] = BEAM_COLORS[beam.kind];
      const dx = beam.bx - beam.ax;
      const dy = beam.by - beam.ay;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const steps = Math.min(lite ? 24 : 40, Math.max(6, Math.round(length / 4)));
      const crackle = beat(age);
      for (let i = 0; i <= steps; i += 1) {
        const f = i / steps;
        const reach = beam.kind === "fuse" ? Math.min(f, 1 - f) * 2 <= head || head >= 1 : f <= head;
        if (!reach) continue;
        const arc = beam.kind === "swap" || beam.kind === "chorus" ? Math.sin(f * Math.PI) * -14 : 0;
        const jitter = beam.kind === "link" ? Math.round(Math.sin(i * 1.7 + crackle * 40) * 1.5) : beam.kind === "fuse" ? Math.round(Math.sin(i * 0.9 + crackle * 18)) : 0;
        const wx = beam.ax + dx * f + nx * jitter;
        const wy = beam.ay + dy * f + ny * jitter + arc;
        const p = at(wx, wy);
        ctx.globalAlpha = fade * 0.55;
        dot(p.x, p.y, 3 * unit, glow);
        ctx.globalAlpha = fade;
        dot(p.x, p.y, unit, core);
      }
      ctx.globalAlpha = 1;
    }

    // chorus notes float up and sway
    this.notes = this.notes.filter((note) => now - note.born < NOTE_LIFE);
    for (const note of this.notes) {
      const age = now - note.born;
      if (age < 0) continue;
      const p = at(note.x + Math.sin(age * 4) * 3 + note.drift * age * 6, note.y - easeOutCubic(age / NOTE_LIFE) * 24);
      ctx.globalAlpha = envelope(age, NOTE_LIFE, 0.2, 0.6);
      ctx.fillStyle = note.color;
      for (let r = 0; r < NOTE.length; r += 1)
        for (let c = 0; c < NOTE[r].length; c += 1) if (NOTE[r][c]) ctx.fillRect(p.x + c * unit, p.y + r * unit, unit, unit);
      ctx.globalAlpha = 1;
    }

    // staff trail: a fading ribbon of sparks
    if (this.trail.length) {
      this.trail = this.trail.filter((point) => now - point.at <= TRAIL_LIFE);
      const stride = lite ? 2 : 1;
      for (let i = 0; i < this.trail.length; i += stride) {
        const point = this.trail[i];
        const life = smoothstep(1 - (now - point.at) / TRAIL_LIFE);
        const p = at(point.x, point.y);
        ctx.globalAlpha = life;
        const color = TRAIL_COLORS[i % TRAIL_COLORS.length];
        dot(p.x, p.y, (life > 0.6 ? 2 : 1) * unit, color);
        if (i % 6 === 0 && !lite && life > 0.5) dot(p.x, p.y - 3 * unit, unit, SPARK);
      }
      ctx.globalAlpha = 1;
    }

    // charge ring: a pixel ring that grows with an ease, spins and changes colour by tier
    if (this.charge) {
      const level = this.chargeNow();
      const tier = chargeTier(level);
      const color = CHARGE_COLORS[tier];
      const held = now - this.charge.born;
      const rise = easeOutCubic(held / 0.25);
      const radius = 8 + easeOutCubic(level) * 22;
      const spin = beat(held) * (2 + tier);
      const ringDots = Math.max(16, Math.round((radius * 2 * Math.PI) / 3));
      ctx.globalAlpha = rise * (0.3 + level * 0.25);
      for (let i = 0; i < ringDots; i += 1) {
        const a = (i / ringDots) * Math.PI * 2;
        const p = at(this.charge.x + Math.cos(a) * radius, this.charge.y + Math.sin(a) * radius * 0.55);
        dot(p.x, p.y, unit, color);
      }
      ctx.globalAlpha = rise;
      const count = lite ? 6 : 8;
      for (let i = 0; i < count; i += 1) {
        const a = spin + (i / count) * Math.PI * 2;
        const p = at(this.charge.x + Math.cos(a) * radius, this.charge.y + Math.sin(a) * radius * 0.55);
        dot(p.x, p.y, (i % 4 === 0 ? 2 : 1) * unit, i % 4 === 0 ? SPARK : color);
      }
      // motes spiral in
      for (let i = 0; i < (lite ? 2 : 4); i += 1) {
        const f = (now * 1.2 + i / 4) % 1;
        const a = -spin * 0.7 + i * 1.57;
        const r = radius * (1.4 - f);
        const p = at(this.charge.x + Math.cos(a) * r, this.charge.y - 10 * f + Math.sin(a) * r * 0.55);
        ctx.globalAlpha = rise * smoothstep(Math.min(f, 1 - f) * 4);
        dot(p.x, p.y, unit, color);
      }
      if (level >= 1) {
        ctx.globalAlpha = rise * (0.6 + 0.4 * Math.sin(beat(now) * 8));
        const p = at(this.charge.x, this.charge.y - 28);
        dot(p.x, p.y, 2 * unit, SPARK);
      }
      ctx.globalAlpha = 1;
    }
  }
}
