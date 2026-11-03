/**
 * Every pixelfx module the village plays, by id. Loaded with import() so the map's first paint
 * never waits on it. Effects: pixelfx by patch-gg (MIT), vendored under src/vendor/pixelfx.
 * Only the effects listed here are vendored; magic-town.ts groups them (weather, landmarks, critters,
 * auras, spells, transitions, ui).
 */
import * as fxArcaneArcaneOrb from "../../vendor/pixelfx/fx/arcane/arcane-orb.js";
import * as fxArcaneBlinkIn from "../../vendor/pixelfx/fx/arcane/blink-in.js";
import * as fxArcaneBlinkOut from "../../vendor/pixelfx/fx/arcane/blink-out.js";
import * as fxArcaneMagicCircleCast from "../../vendor/pixelfx/fx/arcane/magic-circle-cast.js";
import * as fxArcaneManaBurst from "../../vendor/pixelfx/fx/arcane/mana-burst.js";
import * as fxArcanePortal from "../../vendor/pixelfx/fx/arcane/portal.js";
import * as fxArcaneRuneCircle from "../../vendor/pixelfx/fx/arcane/rune-circle.js";
import * as fxArcaneSpellCharge from "../../vendor/pixelfx/fx/arcane/spell-charge.js";
import * as fxArcaneStarFall from "../../vendor/pixelfx/fx/arcane/star-fall.js";
import * as fxArcaneTimeStop from "../../vendor/pixelfx/fx/arcane/time-stop.js";
import * as fxCrittersBat from "../../vendor/pixelfx/fx/critters/bat.js";
import * as fxCrittersBird from "../../vendor/pixelfx/fx/critters/bird.js";
import * as fxCrittersButterfly from "../../vendor/pixelfx/fx/critters/butterfly.js";
import * as fxCrittersFishSchool from "../../vendor/pixelfx/fx/critters/fish-school.js";
import * as fxCrittersFrog from "../../vendor/pixelfx/fx/critters/frog.js";
import * as fxCrittersGhost from "../../vendor/pixelfx/fx/critters/ghost.js";
import * as fxCrittersJellyfish from "../../vendor/pixelfx/fx/critters/jellyfish.js";
import * as fxCrittersSlime from "../../vendor/pixelfx/fx/critters/slime.js";
import * as fxCrittersSnake from "../../vendor/pixelfx/fx/critters/snake.js";
import * as fxCrittersWisp from "../../vendor/pixelfx/fx/critters/wisp.js";
import * as fxExplosionsCartoonPow from "../../vendor/pixelfx/fx/explosions/cartoon-pow.js";
import * as fxExplosionsFireworkBurst from "../../vendor/pixelfx/fx/explosions/firework-burst.js";
import * as fxExplosionsFireworkRocket from "../../vendor/pixelfx/fx/explosions/firework-rocket.js";
import * as fxExplosionsImplosion from "../../vendor/pixelfx/fx/explosions/implosion.js";
import * as fxExplosionsPlasmaExplosion from "../../vendor/pixelfx/fx/explosions/plasma-explosion.js";
import * as fxExplosionsSmokeBomb from "../../vendor/pixelfx/fx/explosions/smoke-bomb.js";
import * as fxFireBrazier from "../../vendor/pixelfx/fx/fire/brazier.js";
import * as fxFireCampfire from "../../vendor/pixelfx/fx/fire/campfire.js";
import * as fxFireCandle from "../../vendor/pixelfx/fx/fire/candle.js";
import * as fxFireFireRing from "../../vendor/pixelfx/fx/fire/fire-ring.js";
import * as fxFireSpiritFlame from "../../vendor/pixelfx/fx/fire/spirit-flame.js";
import * as fxFireTorch from "../../vendor/pixelfx/fx/fire/torch.js";
import * as fxHolyBlessing from "../../vendor/pixelfx/fx/holy/blessing.js";
import * as fxHolyDivineShield from "../../vendor/pixelfx/fx/holy/divine-shield.js";
import * as fxHolyFeatherBurst from "../../vendor/pixelfx/fx/holy/feather-burst.js";
import * as fxHolyHalo from "../../vendor/pixelfx/fx/holy/halo.js";
import * as fxHolyHeal from "../../vendor/pixelfx/fx/holy/heal.js";
import * as fxHolyHealAoe from "../../vendor/pixelfx/fx/holy/heal-aoe.js";
import * as fxHolyHolyPillar from "../../vendor/pixelfx/fx/holy/holy-pillar.js";
import * as fxHolyResurrection from "../../vendor/pixelfx/fx/holy/resurrection.js";
import * as fxHolySunburst from "../../vendor/pixelfx/fx/holy/sunburst.js";
import * as fxIceFreeze from "../../vendor/pixelfx/fx/ice/freeze.js";
import * as fxIceFrostNova from "../../vendor/pixelfx/fx/ice/frost-nova.js";
import * as fxIceIceCrystal from "../../vendor/pixelfx/fx/ice/ice-crystal.js";
import * as fxIceIceShatter from "../../vendor/pixelfx/fx/ice/ice-shatter.js";
import * as fxIceIceSpikes from "../../vendor/pixelfx/fx/ice/ice-spikes.js";
import * as fxIceIcicleFall from "../../vendor/pixelfx/fx/ice/icicle-fall.js";
import * as fxIceSnowflakeBurst from "../../vendor/pixelfx/fx/ice/snowflake-burst.js";
import * as fxLightningBallLightning from "../../vendor/pixelfx/fx/lightning/ball-lightning.js";
import * as fxLightningChargeUp from "../../vendor/pixelfx/fx/lightning/charge-up.js";
import * as fxLightningElectrified from "../../vendor/pixelfx/fx/lightning/electrified.js";
import * as fxLightningLightningStrike from "../../vendor/pixelfx/fx/lightning/lightning-strike.js";
import * as fxLightningPlasmaBall from "../../vendor/pixelfx/fx/lightning/plasma-ball.js";
import * as fxLightningZapHit from "../../vendor/pixelfx/fx/lightning/zap-hit.js";
import * as fxNatureHealingBloom from "../../vendor/pixelfx/fx/nature/healing-bloom.js";
import * as fxNatureLeafStorm from "../../vendor/pixelfx/fx/nature/leaf-storm.js";
import * as fxNatureSporeBurst from "../../vendor/pixelfx/fx/nature/spore-burst.js";
import * as fxNatureThorns from "../../vendor/pixelfx/fx/nature/thorns.js";
import * as fxNatureVineWhip from "../../vendor/pixelfx/fx/nature/vine-whip.js";
import * as fxPickupsChestOpen from "../../vendor/pixelfx/fx/pickups/chest-open.js";
import * as fxPickupsCoinSpin from "../../vendor/pixelfx/fx/pickups/coin-spin.js";
import * as fxPickupsCollectBurst from "../../vendor/pixelfx/fx/pickups/collect-burst.js";
import * as fxPickupsCrystalShard from "../../vendor/pixelfx/fx/pickups/crystal-shard.js";
import * as fxPickupsGemSpin from "../../vendor/pixelfx/fx/pickups/gem-spin.js";
import * as fxPickupsHeartPickup from "../../vendor/pixelfx/fx/pickups/heart-pickup.js";
import * as fxPickupsKeyGlint from "../../vendor/pixelfx/fx/pickups/key-glint.js";
import * as fxPickupsLootBeam from "../../vendor/pixelfx/fx/pickups/loot-beam.js";
import * as fxPickupsPotion from "../../vendor/pixelfx/fx/pickups/potion.js";
import * as fxPickupsPowerStar from "../../vendor/pixelfx/fx/pickups/power-star.js";
import * as fxPickupsXpOrb from "../../vendor/pixelfx/fx/pickups/xp-orb.js";
import * as fxScifiForceField from "../../vendor/pixelfx/fx/scifi/force-field.js";
import * as fxScifiGlitch from "../../vendor/pixelfx/fx/scifi/glitch.js";
import * as fxScifiTeleporterPad from "../../vendor/pixelfx/fx/scifi/teleporter-pad.js";
import * as fxScifiWarpIn from "../../vendor/pixelfx/fx/scifi/warp-in.js";
import * as fxScifiWarpOut from "../../vendor/pixelfx/fx/scifi/warp-out.js";
import * as fxShadowHexSigil from "../../vendor/pixelfx/fx/shadow/hex-sigil.js";
import * as fxSpawnCoinDrop from "../../vendor/pixelfx/fx/spawn/coin-drop.js";
import * as fxSpawnEggHatch from "../../vendor/pixelfx/fx/spawn/egg-hatch.js";
import * as fxSpawnPoof from "../../vendor/pixelfx/fx/spawn/poof.js";
import * as fxSpawnRespawnBeam from "../../vendor/pixelfx/fx/spawn/respawn-beam.js";
import * as fxSpawnSpawnPortal from "../../vendor/pixelfx/fx/spawn/spawn-portal.js";
import * as fxStatusCharmed from "../../vendor/pixelfx/fx/status/charmed.js";
import * as fxStatusConfused from "../../vendor/pixelfx/fx/status/confused.js";
import * as fxStatusFrozen from "../../vendor/pixelfx/fx/status/frozen.js";
import * as fxStatusHaste from "../../vendor/pixelfx/fx/status/haste.js";
import * as fxStatusSleep from "../../vendor/pixelfx/fx/status/sleep.js";
import * as fxStatusSlowed from "../../vendor/pixelfx/fx/status/slowed.js";
import * as fxStatusStunned from "../../vendor/pixelfx/fx/status/stunned.js";
import * as fxTransitionsBlinds from "../../vendor/pixelfx/fx/transitions/blinds.js";
import * as fxTransitionsBurnAway from "../../vendor/pixelfx/fx/transitions/burn-away.js";
import * as fxTransitionsDiamondWipe from "../../vendor/pixelfx/fx/transitions/diamond-wipe.js";
import * as fxTransitionsGlitchWipe from "../../vendor/pixelfx/fx/transitions/glitch-wipe.js";
import * as fxTransitionsIris from "../../vendor/pixelfx/fx/transitions/iris.js";
import * as fxTransitionsPixelDissolve from "../../vendor/pixelfx/fx/transitions/pixel-dissolve.js";
import * as fxTransitionsShatterWipe from "../../vendor/pixelfx/fx/transitions/shatter-wipe.js";
import * as fxTransitionsSlashWipe from "../../vendor/pixelfx/fx/transitions/slash-wipe.js";
import * as fxTransitionsStarIris from "../../vendor/pixelfx/fx/transitions/star-iris.js";
import * as fxUiAchievement from "../../vendor/pixelfx/fx/ui/achievement.js";
import * as fxUiCoinCollect from "../../vendor/pixelfx/fx/ui/coin-collect.js";
import * as fxUiComboCounter from "../../vendor/pixelfx/fx/ui/combo-counter.js";
import * as fxUiConfetti from "../../vendor/pixelfx/fx/ui/confetti.js";
import * as fxUiCountdown from "../../vendor/pixelfx/fx/ui/countdown.js";
import * as fxUiExclamation from "../../vendor/pixelfx/fx/ui/exclamation.js";
import * as fxUiLevelUp from "../../vendor/pixelfx/fx/ui/level-up.js";
import * as fxUiQuestComplete from "../../vendor/pixelfx/fx/ui/quest-complete.js";
import * as fxWaterBubbles from "../../vendor/pixelfx/fx/water/bubbles.js";
import * as fxWaterFountain from "../../vendor/pixelfx/fx/water/fountain.js";
import * as fxWaterGeyser from "../../vendor/pixelfx/fx/water/geyser.js";
import * as fxWaterRainSplash from "../../vendor/pixelfx/fx/water/rain-splash.js";
import * as fxWaterRipples from "../../vendor/pixelfx/fx/water/ripples.js";
import * as fxWaterSplash from "../../vendor/pixelfx/fx/water/splash.js";
import * as fxWaterWaterOrb from "../../vendor/pixelfx/fx/water/water-orb.js";
import * as fxWaterWaveCrash from "../../vendor/pixelfx/fx/water/wave-crash.js";
import * as fxWaterWhirlpool from "../../vendor/pixelfx/fx/water/whirlpool.js";
import * as fxWeatherAurora from "../../vendor/pixelfx/fx/weather/aurora.js";
import * as fxWeatherBlizzard from "../../vendor/pixelfx/fx/weather/blizzard.js";
import * as fxWeatherCherryBlossoms from "../../vendor/pixelfx/fx/weather/cherry-blossoms.js";
import * as fxWeatherClouds from "../../vendor/pixelfx/fx/weather/clouds.js";
import * as fxWeatherFallingLeaves from "../../vendor/pixelfx/fx/weather/falling-leaves.js";
import * as fxWeatherFireflies from "../../vendor/pixelfx/fx/weather/fireflies.js";
import * as fxWeatherFog from "../../vendor/pixelfx/fx/weather/fog.js";
import * as fxWeatherGodRays from "../../vendor/pixelfx/fx/weather/god-rays.js";
import * as fxWeatherRain from "../../vendor/pixelfx/fx/weather/rain.js";
import * as fxWeatherShootingStars from "../../vendor/pixelfx/fx/weather/shooting-stars.js";
import * as fxWeatherSnow from "../../vendor/pixelfx/fx/weather/snow.js";
import * as fxWeatherStorm from "../../vendor/pixelfx/fx/weather/storm.js";
import * as fxVillageArcaneMotes from "./fx/arcane-motes.js";
import * as fxVillageFishBubbles from "./fx/fish-bubbles.js";
import * as fxVillageSleepySparkle from "./fx/sleepy-sparkle.js";
import * as fxVillageChimneySmoke from "./fx/chimney-smoke.js";
import * as fxVillageRoadGlint from "./fx/road-glint.js";
import * as fxVillageGroundGlint from "./fx/ground-glint.js";
import * as fxVillageHeartPop from "./fx/heart-pop.js";
import * as fxVillageStarPop from "./fx/star-pop.js";
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
  "arcane/arcane-orb": fxArcaneArcaneOrb,
  "arcane/blink-in": fxArcaneBlinkIn,
  "arcane/blink-out": fxArcaneBlinkOut,
  "arcane/magic-circle-cast": fxArcaneMagicCircleCast,
  "arcane/mana-burst": fxArcaneManaBurst,
  "arcane/portal": fxArcanePortal,
  "arcane/rune-circle": fxArcaneRuneCircle,
  "arcane/spell-charge": fxArcaneSpellCharge,
  "arcane/star-fall": fxArcaneStarFall,
  "arcane/time-stop": fxArcaneTimeStop,
  "critters/bat": fxCrittersBat,
  "critters/bird": fxCrittersBird,
  "critters/butterfly": fxCrittersButterfly,
  "critters/fish-school": fxCrittersFishSchool,
  "critters/frog": fxCrittersFrog,
  "critters/ghost": fxCrittersGhost,
  "critters/jellyfish": fxCrittersJellyfish,
  "critters/slime": fxCrittersSlime,
  "critters/snake": fxCrittersSnake,
  "critters/wisp": fxCrittersWisp,
  "explosions/cartoon-pow": fxExplosionsCartoonPow,
  "explosions/firework-burst": fxExplosionsFireworkBurst,
  "explosions/firework-rocket": fxExplosionsFireworkRocket,
  "explosions/implosion": fxExplosionsImplosion,
  "explosions/plasma-explosion": fxExplosionsPlasmaExplosion,
  "explosions/smoke-bomb": fxExplosionsSmokeBomb,
  "fire/brazier": fxFireBrazier,
  "fire/campfire": fxFireCampfire,
  "fire/candle": fxFireCandle,
  "fire/fire-ring": fxFireFireRing,
  "fire/spirit-flame": fxFireSpiritFlame,
  "fire/torch": fxFireTorch,
  "holy/blessing": fxHolyBlessing,
  "holy/divine-shield": fxHolyDivineShield,
  "holy/feather-burst": fxHolyFeatherBurst,
  "holy/halo": fxHolyHalo,
  "holy/heal": fxHolyHeal,
  "holy/heal-aoe": fxHolyHealAoe,
  "holy/holy-pillar": fxHolyHolyPillar,
  "holy/resurrection": fxHolyResurrection,
  "holy/sunburst": fxHolySunburst,
  "ice/freeze": fxIceFreeze,
  "ice/frost-nova": fxIceFrostNova,
  "ice/ice-crystal": fxIceIceCrystal,
  "ice/ice-shatter": fxIceIceShatter,
  "ice/ice-spikes": fxIceIceSpikes,
  "ice/icicle-fall": fxIceIcicleFall,
  "ice/snowflake-burst": fxIceSnowflakeBurst,
  "lightning/ball-lightning": fxLightningBallLightning,
  "lightning/charge-up": fxLightningChargeUp,
  "lightning/electrified": fxLightningElectrified,
  "lightning/lightning-strike": fxLightningLightningStrike,
  "lightning/plasma-ball": fxLightningPlasmaBall,
  "lightning/zap-hit": fxLightningZapHit,
  "nature/healing-bloom": fxNatureHealingBloom,
  "nature/leaf-storm": fxNatureLeafStorm,
  "nature/spore-burst": fxNatureSporeBurst,
  "nature/thorns": fxNatureThorns,
  "nature/vine-whip": fxNatureVineWhip,
  "pickups/chest-open": fxPickupsChestOpen,
  "pickups/coin-spin": fxPickupsCoinSpin,
  "pickups/collect-burst": fxPickupsCollectBurst,
  "pickups/crystal-shard": fxPickupsCrystalShard,
  "pickups/gem-spin": fxPickupsGemSpin,
  "pickups/heart-pickup": fxPickupsHeartPickup,
  "pickups/key-glint": fxPickupsKeyGlint,
  "pickups/loot-beam": fxPickupsLootBeam,
  "pickups/potion": fxPickupsPotion,
  "pickups/power-star": fxPickupsPowerStar,
  "pickups/xp-orb": fxPickupsXpOrb,
  "scifi/force-field": fxScifiForceField,
  "scifi/glitch": fxScifiGlitch,
  "scifi/teleporter-pad": fxScifiTeleporterPad,
  "scifi/warp-in": fxScifiWarpIn,
  "scifi/warp-out": fxScifiWarpOut,
  "shadow/hex-sigil": fxShadowHexSigil,
  "spawn/coin-drop": fxSpawnCoinDrop,
  "spawn/egg-hatch": fxSpawnEggHatch,
  "spawn/poof": fxSpawnPoof,
  "spawn/respawn-beam": fxSpawnRespawnBeam,
  "spawn/spawn-portal": fxSpawnSpawnPortal,
  "status/charmed": fxStatusCharmed,
  "status/confused": fxStatusConfused,
  "status/frozen": fxStatusFrozen,
  "status/haste": fxStatusHaste,
  "status/sleep": fxStatusSleep,
  "status/slowed": fxStatusSlowed,
  "status/stunned": fxStatusStunned,
  "transitions/blinds": fxTransitionsBlinds,
  "transitions/burn-away": fxTransitionsBurnAway,
  "transitions/diamond-wipe": fxTransitionsDiamondWipe,
  "transitions/glitch-wipe": fxTransitionsGlitchWipe,
  "transitions/iris": fxTransitionsIris,
  "transitions/pixel-dissolve": fxTransitionsPixelDissolve,
  "transitions/shatter-wipe": fxTransitionsShatterWipe,
  "transitions/slash-wipe": fxTransitionsSlashWipe,
  "transitions/star-iris": fxTransitionsStarIris,
  "ui/achievement": fxUiAchievement,
  "ui/coin-collect": fxUiCoinCollect,
  "ui/combo-counter": fxUiComboCounter,
  "ui/confetti": fxUiConfetti,
  "ui/countdown": fxUiCountdown,
  "ui/exclamation": fxUiExclamation,
  "ui/level-up": fxUiLevelUp,
  "ui/quest-complete": fxUiQuestComplete,
  "water/bubbles": fxWaterBubbles,
  "water/fountain": fxWaterFountain,
  "water/geyser": fxWaterGeyser,
  "water/rain-splash": fxWaterRainSplash,
  "water/ripples": fxWaterRipples,
  "water/splash": fxWaterSplash,
  "water/water-orb": fxWaterWaterOrb,
  "water/wave-crash": fxWaterWaveCrash,
  "water/whirlpool": fxWaterWhirlpool,
  "weather/aurora": fxWeatherAurora,
  "weather/blizzard": fxWeatherBlizzard,
  "weather/cherry-blossoms": fxWeatherCherryBlossoms,
  "weather/clouds": fxWeatherClouds,
  "weather/falling-leaves": fxWeatherFallingLeaves,
  "weather/fireflies": fxWeatherFireflies,
  "weather/fog": fxWeatherFog,
  "weather/god-rays": fxWeatherGodRays,
  "weather/rain": fxWeatherRain,
  "weather/shooting-stars": fxWeatherShootingStars,
  "weather/snow": fxWeatherSnow,
  "weather/storm": fxWeatherStorm,
  "village/arcane-motes": fxVillageArcaneMotes,
  "village/fish-bubbles": fxVillageFishBubbles,
  "village/sleepy-sparkle": fxVillageSleepySparkle,
  "village/chimney-smoke": fxVillageChimneySmoke,
  "village/road-glint": fxVillageRoadGlint,
  "village/ground-glint": fxVillageGroundGlint,
  "village/heart-pop": fxVillageHeartPop,
  "village/star-pop": fxVillageStarPop,
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
