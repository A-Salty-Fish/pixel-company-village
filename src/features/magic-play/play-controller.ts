/**
 * PV-MAGIC-PLAY-001 — turns taps, presses and drags into wizard play. The scene hands every gesture here
 * first; this decides what to cast, what to count and what small toast and sound to give back.
 * Only display names (kept in memory for the chain) and counts are used. Nothing is stored but counts and badge ids.
 */
import {
  BADGES,
  CHAIN_ENABLED,
  CHAIN_SPELLS,
  CHARGE_ENABLED,
  CHORUS_ENABLED,
  LANDMARK_GAMES_ENABLED,
  MAGIC_PLAY_ENABLED,
  QUEST_ENABLED,
  RUNE_GOAL,
  SUMMON_ENABLED,
  TRAIL_ENABLED,
  ULTIMATES,
  WISH_GOAL,
  bumpProgress,
  chainKind,
  chainStep,
  chargeLevel,
  chargeTier,
  countStep,
  isDoubleTap,
  portalOther,
  readBadges,
  readProgress,
  streakStep,
  summonFor,
  trailLength,
  unlockBadge,
  writeBadges,
  writeProgress,
  type BadgeId,
  type ChainMark,
  type Counter,
  type PlayProgress,
  type PortalEnd,
  type QuestKind,
  type TrailPoint,
} from "./magic-play";
import type { PlayLayer } from "./play-layer";

export type MagicSfx = "chain" | "ultimate" | "wish" | "rune" | "summon" | "portal" | "badge" | "chorus" | "charge";
export type PlayEvent = { toast?: string; sfx?: MagicSfx };
export type PlaySpot = { x: number; y: number };
export type PlayHost = {
  cast(id: string, x: number, y: number): void;
  castOn(id: string, name: string, seconds: number): void;
  transition(id?: string): void;
  readonly play: Pick<PlayLayer, "beam" | "chorus" | "chargeStart" | "chargeMove" | "chargeEnd" | "summon" | "showPips">;
};
type Store = Pick<Storage, "getItem" | "setItem">;

/** A long stroke while charging (world px) counts as drawing a trail. */
export const TRAIL_QUEST_PX = 60;
export const STREAK_BADGE = 10;
export const PORTAL_TRIP_MS = 60_000;
export const PORTAL_SPOTS: Record<PortalEnd, PlaySpot> = { "gate-portal": { x: 66, y: 196 }, "warp-pad": { x: 34, y: 656 } };
export const FOUNTAIN_SPOT: PlaySpot = { x: 300, y: 196 };
export const CIRCLE_SPOT: PlaySpot = { x: 608, y: 664 };

export class PlayController {
  private chain: ChainMark | null = null;
  private chains = 0;
  private lastTap: { x: number; y: number; at: number } | null = null;
  private groundTaps = 0;
  private wish: Counter | null = null;
  private rune: Counter | null = null;
  private streak: Counter | null = null;
  private portal: { from: PortalEnd; at: number } | null = null;
  private press: { x: number; y: number; at: number } | null = null;
  private progress: PlayProgress;
  private badges: BadgeId[];
  readonly events: PlayEvent[] = [];

  constructor(
    private store: Store | null,
    private ymd: string,
  ) {
    this.progress = readProgress(store, ymd);
    this.badges = readBadges(store);
  }

  get enabled() {
    return MAGIC_PLAY_ENABLED;
  }

  /** Counts for the settings line and the test hook. */
  get snapshot() {
    return { progress: this.progress, badges: [...this.badges], chain: Boolean(this.chain), streak: this.streak?.n ?? 0, wish: this.wish?.n ?? 0, rune: this.rune?.n ?? 0, groundTaps: this.groundTaps };
  }

  drain() {
    return this.events.splice(0, this.events.length);
  }

  setDay(ymd: string) {
    if (ymd === this.ymd) return;
    this.ymd = ymd;
    this.progress = readProgress(this.store, ymd);
  }

  private badge(id: BadgeId) {
    const next = unlockBadge(this.badges, id);
    if (!next.fresh) return;
    this.badges = next.have as BadgeId[];
    writeBadges(this.store, this.badges);
    this.events.push({ toast: `✦ 小成就：${BADGES[id]}`, sfx: "badge" });
  }

  private quest(kind: QuestKind, by = 1) {
    if (!QUEST_ENABLED) return;
    const next = bumpProgress(this.progress, this.ymd, kind, by);
    this.progress = next.progress;
    writeProgress(this.store, this.progress);
    if (next.finished) {
      this.events.push({ toast: "✦ 今日魔法任务完成！", sfx: "badge" });
      this.badge("quest-done");
    }
  }

  /** Every magic tap, anywhere: quick taps build a streak. Returns the streak when it is worth showing. */
  streakTap(at: number) {
    this.streak = streakStep(this.streak, at);
    const n = this.streak.n;
    if (n >= 5 && n % 5 === 0) this.events.push({ toast: `连击 ×${n}` });
    if (n >= STREAK_BADGE) this.badge("streak-10");
    // the streak count keeps today's best run
    const best = this.progress.ymd === this.ymd ? (this.progress.counts.streak ?? 0) : 0;
    if (n > best) this.quest("streak", n - best);
    return n;
  }

  /** Tap on a person. True when the tap became a chain link (the usual single spell is skipped). */
  tapPerson(host: PlayHost, person: { name: string; x: number; y: number }, at: number) {
    if (!MAGIC_PLAY_ENABLED || !CHAIN_ENABLED) return false;
    const step = chainStep(this.chain, { name: person.name, x: person.x, y: person.y, at });
    this.chain = step.mark;
    if (!step.from) return false;
    const kind = chainKind(this.chains);
    this.chains += 1;
    const spells = CHAIN_SPELLS[kind];
    const a = step.from;
    host.play.beam(a.x, a.y - 14, person.x, person.y - 14, kind);
    host.cast(spells.a, a.x, a.y);
    host.cast(spells.b, person.x, person.y);
    if (spells.m) host.cast(spells.m, (a.x + person.x) / 2, (a.y + person.y) / 2 - 14);
    this.events.push({ toast: kind === "link" ? "连锁 · 闪电相连" : kind === "swap" ? "连锁 · 瞬移互换" : "连锁 · 魔力融合", sfx: "chain" });
    this.badge("first-chain");
    this.quest("chain");
    return true;
  }

  /** Tap on a landmark with a mini-game. Returns where the camera should travel, if anywhere; null when unhandled. */
  tapLandmark(host: PlayHost, id: string, at: number): { handled: boolean; travel?: PlaySpot } {
    if (!MAGIC_PLAY_ENABLED || !LANDMARK_GAMES_ENABLED) return { handled: false };
    this.chain = null;
    if (id === "fountain") {
      const step = countStep(this.wish, at, WISH_GOAL);
      this.wish = step.done ? null : step.counter;
      host.cast("spawn/coin-drop", FOUNTAIN_SPOT.x, FOUNTAIN_SPOT.y - 6);
      host.play.showPips("wish", step.counter.n, FOUNTAIN_SPOT.x, FOUNTAIN_SPOT.y, step.done ? 2.5 : 25);
      this.quest("wish");
      if (step.done) {
        host.cast("water/geyser", FOUNTAIN_SPOT.x, FOUNTAIN_SPOT.y);
        host.cast("holy/sunburst", FOUNTAIN_SPOT.x, FOUNTAIN_SPOT.y - 30);
        host.cast("ui/quest-complete", FOUNTAIN_SPOT.x, FOUNTAIN_SPOT.y - 60);
        this.events.push({ toast: "许愿泉：三愿成真 ✦", sfx: "wish" });
        this.badge("wish-3");
      } else this.events.push({ toast: `许愿 ${step.counter.n}/${WISH_GOAL}`, sfx: "wish" });
      return { handled: true };
    }
    if (id === "plaza-circle") {
      const step = countStep(this.rune, at, RUNE_GOAL);
      this.rune = step.done ? null : step.counter;
      host.play.showPips("rune", step.counter.n, CIRCLE_SPOT.x, CIRCLE_SPOT.y, step.done ? 2.5 : 25);
      if (step.done) {
        host.cast("arcane/magic-circle-cast", CIRCLE_SPOT.x, CIRCLE_SPOT.y);
        host.cast("holy/holy-pillar", CIRCLE_SPOT.x, CIRCLE_SPOT.y);
        this.events.push({ toast: "魔法阵点亮 ✦", sfx: "rune" });
        this.badge("circle-lit");
        this.quest("circle");
      } else {
        host.cast("pickups/collect-burst", CIRCLE_SPOT.x, CIRCLE_SPOT.y);
        this.events.push({ toast: `法阵符文 ${step.counter.n}/${RUNE_GOAL}`, sfx: "rune" });
      }
      return { handled: true };
    }
    if (id === "gate-portal" || id === "warp-pad") {
      const from = id as PortalEnd;
      const to = portalOther(from);
      const back = this.portal && this.portal.from === to && at - this.portal.at <= PORTAL_TRIP_MS;
      this.portal = back ? null : { from, at };
      host.cast("scifi/warp-out", PORTAL_SPOTS[from].x, PORTAL_SPOTS[from].y);
      host.transition("transitions/star-iris");
      this.events.push({ toast: back ? "传送往返完成 ✦" : to === "warp-pad" ? "传送中… → 传送台" : "传送中… → 村口传送门", sfx: "portal" });
      if (back) {
        this.badge("portal-trip");
        this.quest("portal");
      }
      return { handled: true, travel: PORTAL_SPOTS[to] };
    }
    return { handled: false };
  }

  /** After the camera lands at the far end of a portal. */
  arrive(host: PlayHost, spot: PlaySpot) {
    host.cast("scifi/warp-in", spot.x, spot.y);
  }

  /** Tap on open ground. True when it became a double-tap spell or a summon. */
  tapGround(host: PlayHost, spot: PlaySpot, at: number, seed: number) {
    if (!MAGIC_PLAY_ENABLED) return false;
    if (this.groundDouble(host, spot, at)) return true;
    return this.groundSingle(host, spot, seed);
  }

  /**
   * First half of a ground tap: a second tap close by and quick is a double-tap burst (true).
   * Otherwise the tap is remembered and the scene waits out the double-tap window before groundSingle,
   * so the first tap of a double never summons or casts on its own.
   */
  groundDouble(host: PlayHost, spot: PlaySpot, at: number) {
    if (!MAGIC_PLAY_ENABLED) return false;
    this.chain = null;
    const tap = { ...spot, at };
    const double = CHARGE_ENABLED && isDoubleTap(this.lastTap, tap);
    this.lastTap = double ? null : tap;
    if (!double) return false;
    for (const id of ULTIMATES[1]) host.cast(id, spot.x, spot.y);
    this.events.push({ toast: "双击 · 魔力迸发", sfx: "ultimate" });
    this.badge("first-ultimate");
    return true;
  }

  /** Second half of a single ground tap: maybe a summon. True when something was summoned. */
  groundSingle(host: PlayHost, spot: PlaySpot, seed: number) {
    if (!MAGIC_PLAY_ENABLED || !SUMMON_ENABLED) return false;
    this.groundTaps += 1;
    const summon = summonFor(this.groundTaps, seed);
    if (!summon) return false;
    host.cast(summon.kind === "critter" ? "spawn/poof" : "nature/healing-bloom", spot.x, spot.y);
    host.play.summon(summon, spot.x, spot.y);
    this.events.push({ toast: summon.kind === "critter" ? "召唤了一只小家伙" : "种下一朵魔法花", sfx: "summon" });
    this.badge("first-summon");
    this.quest("summon");
    return true;
  }

  /** Long press began (the scene's timer fired). */
  chargeStart(host: PlayHost, spot: PlaySpot, at: number) {
    if (!MAGIC_PLAY_ENABLED || !CHARGE_ENABLED) return false;
    this.press = { ...spot, at };
    this.chain = null;
    host.play.chargeStart(spot.x, spot.y);
    this.events.push({ sfx: "charge" });
    return true;
  }

  chargeMove(host: PlayHost, spot: PlaySpot) {
    if (!this.press || !TRAIL_ENABLED) return;
    host.play.chargeMove(spot.x, spot.y);
  }

  get charging() {
    return Boolean(this.press);
  }

  /** Release: cast the finisher sized by how long it was held, plus a sparkle line if a trail was drawn. */
  chargeRelease(host: PlayHost, spot: PlaySpot, at: number) {
    const press = this.press;
    this.press = null;
    const trail: TrailPoint[] = host.play.chargeEnd();
    if (!press) return 0;
    const level = chargeLevel(at - press.at);
    const tier = chargeTier(level);
    ULTIMATES[tier].forEach((id, i) => host.cast(id, spot.x + (i === 0 ? 0 : (i % 2 ? -10 : 10)), spot.y - (i === 0 ? 0 : 6)));
    const drawn = trailLength(trail);
    if (TRAIL_ENABLED && drawn >= TRAIL_QUEST_PX) {
      const step = Math.max(1, Math.floor(trail.length / 3));
      for (let i = step; i < trail.length && i <= step * 3; i += step) host.cast("pickups/collect-burst", trail[i].x, trail[i].y);
      this.quest("trail");
    }
    this.events.push({ toast: tier === 3 ? "满蓄力大招！" : tier === 2 ? "蓄力大招 · 二段" : "蓄力大招 · 一段", sfx: "ultimate" });
    this.badge("first-ultimate");
    if (tier === 3) this.badge("full-charge");
    this.quest("charge");
    return tier;
  }

  cancelCharge(host: PlayHost) {
    if (!this.press) return;
    this.press = null;
    host.play.chargeEnd();
  }

  /** One villager waved at another: both sing a little spell together. */
  chorus(host: PlayHost, a: { name: string; x: number; y: number }, b: { name: string; x: number; y: number }) {
    if (!MAGIC_PLAY_ENABLED || !CHORUS_ENABLED || a.name === b.name) return false;
    host.play.chorus(a.x, a.y, b.x, b.y);
    host.cast("holy/blessing", a.x, a.y);
    host.cast("holy/blessing", b.x, b.y);
    host.castOn("status/charmed", b.name, 2.5);
    this.events.push({ toast: "♪ 合唱咒语", sfx: "chorus" });
    this.badge("chorus");
    return true;
  }
}

