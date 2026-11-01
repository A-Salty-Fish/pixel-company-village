/**
 * Every pixelfx module the village plays, by id. Loaded with import() so the map's first paint
 * never waits on it. Effects: pixelfx by patch-gg (MIT), vendored under src/vendor/pixelfx.
 */
import * as fireflies from "../../vendor/pixelfx/fx/weather/fireflies.js";
import * as aurora from "../../vendor/pixelfx/fx/weather/aurora.js";
import * as shootingStars from "../../vendor/pixelfx/fx/weather/shooting-stars.js";
import * as fog from "../../vendor/pixelfx/fx/weather/fog.js";
import * as fallingLeaves from "../../vendor/pixelfx/fx/weather/falling-leaves.js";
import * as cherryBlossoms from "../../vendor/pixelfx/fx/weather/cherry-blossoms.js";
import * as snow from "../../vendor/pixelfx/fx/weather/snow.js";
import * as godRays from "../../vendor/pixelfx/fx/weather/god-rays.js";
import * as halo from "../../vendor/pixelfx/fx/holy/halo.js";
import * as blessing from "../../vendor/pixelfx/fx/holy/blessing.js";
import * as heal from "../../vendor/pixelfx/fx/holy/heal.js";
import * as healAoe from "../../vendor/pixelfx/fx/holy/heal-aoe.js";
import * as featherBurst from "../../vendor/pixelfx/fx/holy/feather-burst.js";
import * as portal from "../../vendor/pixelfx/fx/arcane/portal.js";
import * as runeCircle from "../../vendor/pixelfx/fx/arcane/rune-circle.js";
import * as magicCircleCast from "../../vendor/pixelfx/fx/arcane/magic-circle-cast.js";
import * as blinkIn from "../../vendor/pixelfx/fx/arcane/blink-in.js";
import * as manaBurst from "../../vendor/pixelfx/fx/arcane/mana-burst.js";
import * as starFall from "../../vendor/pixelfx/fx/arcane/star-fall.js";
import * as fountain from "../../vendor/pixelfx/fx/water/fountain.js";
import * as geyser from "../../vendor/pixelfx/fx/water/geyser.js";
import * as splash from "../../vendor/pixelfx/fx/water/splash.js";
import * as ripples from "../../vendor/pixelfx/fx/water/ripples.js";
import * as campfire from "../../vendor/pixelfx/fx/fire/campfire.js";
import * as candle from "../../vendor/pixelfx/fx/fire/candle.js";
import * as brazier from "../../vendor/pixelfx/fx/fire/brazier.js";
import * as spiritFlame from "../../vendor/pixelfx/fx/fire/spirit-flame.js";
import * as butterfly from "../../vendor/pixelfx/fx/critters/butterfly.js";
import * as fishSchool from "../../vendor/pixelfx/fx/critters/fish-school.js";
import * as wisp from "../../vendor/pixelfx/fx/critters/wisp.js";
import * as collectBurst from "../../vendor/pixelfx/fx/pickups/collect-burst.js";
import * as confetti from "../../vendor/pixelfx/fx/ui/confetti.js";
import * as fireworkBurst from "../../vendor/pixelfx/fx/explosions/firework-burst.js";
import * as fireworkRocket from "../../vendor/pixelfx/fx/explosions/firework-rocket.js";
import * as frostNova from "../../vendor/pixelfx/fx/ice/frost-nova.js";
import * as snowflakeBurst from "../../vendor/pixelfx/fx/ice/snowflake-burst.js";
import * as healingBloom from "../../vendor/pixelfx/fx/nature/healing-bloom.js";
import * as sporeBurst from "../../vendor/pixelfx/fx/nature/spore-burst.js";
import * as coinDrop from "../../vendor/pixelfx/fx/spawn/coin-drop.js";
import * as arcaneMotes from "./fx/arcane-motes.js";
import * as fishBubbles from "./fx/fish-bubbles.js";
import * as sleepySparkle from "./fx/sleepy-sparkle.js";
import * as chimneySmoke from "./fx/chimney-smoke.js";
import * as roadGlint from "./fx/road-glint.js";
import * as groundGlint from "./fx/ground-glint.js";
import * as heartPop from "./fx/heart-pop.js";
import * as starPop from "./fx/star-pop.js";
import { createFrame, clearFrame, createFx, composite } from "../../vendor/pixelfx/core/fx.js";

export type FxMeta = {
  name?: string;
  size?: number[];
  origin?: number[];
  duration?: number;
  loop?: boolean;
  actor?: number;
  options?: Record<string, unknown>;
};
export type FxModule = { meta?: FxMeta };

export const FX: Record<string, FxModule> = {
  "weather/fireflies": fireflies,
  "weather/aurora": aurora,
  "weather/shooting-stars": shootingStars,
  "weather/fog": fog,
  "weather/falling-leaves": fallingLeaves,
  "weather/cherry-blossoms": cherryBlossoms,
  "weather/snow": snow,
  "weather/god-rays": godRays,
  "holy/halo": halo,
  "holy/blessing": blessing,
  "holy/heal": heal,
  "holy/heal-aoe": healAoe,
  "holy/feather-burst": featherBurst,
  "arcane/portal": portal,
  "arcane/rune-circle": runeCircle,
  "arcane/magic-circle-cast": magicCircleCast,
  "arcane/blink-in": blinkIn,
  "arcane/mana-burst": manaBurst,
  "arcane/star-fall": starFall,
  "water/fountain": fountain,
  "water/geyser": geyser,
  "water/splash": splash,
  "water/ripples": ripples,
  "fire/campfire": campfire,
  "fire/candle": candle,
  "fire/brazier": brazier,
  "fire/spirit-flame": spiritFlame,
  "critters/butterfly": butterfly,
  "critters/fish-school": fishSchool,
  "critters/wisp": wisp,
  "pickups/collect-burst": collectBurst,
  "ui/confetti": confetti,
  "explosions/firework-burst": fireworkBurst,
  "explosions/firework-rocket": fireworkRocket,
  "ice/frost-nova": frostNova,
  "ice/snowflake-burst": snowflakeBurst,
  "nature/healing-bloom": healingBloom,
  "nature/spore-burst": sporeBurst,
  "spawn/coin-drop": coinDrop,
  "village/arcane-motes": arcaneMotes,
  "village/fish-bubbles": fishBubbles,
  "village/sleepy-sparkle": sleepySparkle,
  "village/chimney-smoke": chimneySmoke,
  "village/road-glint": roadGlint,
  "village/ground-glint": groundGlint,
  "village/heart-pop": heartPop,
  "village/star-pop": starPop,
};

export type FxFrame = { w: number; h: number; ox: number; oy: number; color: Uint32Array; light: Uint32Array };
export type FxInstance = {
  meta: FxMeta;
  readonly t: number;
  update(dt: number): void;
  draw(frame: FxFrame, layer?: string): void;
  stop(): void;
  done(): boolean;
};

export type FxCore = {
  createFrame(w: number, h: number, ox?: number, oy?: number): FxFrame;
  clearFrame(frame: FxFrame): FxFrame;
  createFx(mod: FxModule, options?: Record<string, unknown>): FxInstance;
  composite(frame: FxFrame, out: Uint8ClampedArray, bg?: null, lightK?: number): Uint8ClampedArray;
};

export const CORE: FxCore = { createFrame, clearFrame, createFx, composite } as unknown as FxCore;
