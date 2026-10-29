// Simulation arcade du rider joueur : suit la ligne de la piste (abscisse s),
// gere vitesse, pump, sauts, tricks, hype et chutes. Pure logique (pas de rendu).

import { CONFIG, FLIP_TRICKS, STYLE_TRICKS, type TrickId } from "../config";
import type { Dir, Intent } from "./intent";
import type { Feature, FeatureKind, Track } from "./Track";

export type LandQuality = "perfect" | "ok" | "bad";
export type LandResult = { quality: LandQuality | "crash"; ratio: number; reason?: string };
export type JumpAction = "none" | "pull" | "scrub";

export type SimEvent =
  | { type: "perfect"; kind: FeatureKind; streak: number }
  | { type: "miss"; kind: FeatureKind }
  | { type: "schralp" }
  | { type: "takeoff"; feature: Feature; action: JumpAction }
  | { type: "land"; quality: LandQuality; ratio: number }
  | { type: "trickStart"; id: TrickId }
  | { type: "trick"; id: TrickId; hype: number }
  | { type: "hypeFull" }
  | { type: "crash"; reason: string }
  | { type: "finish"; time: number };

export type RiderState = "ready" | "racing" | "crashed" | "finished";

interface OpenFeature {
  f: Feature;
  /** Bosses : temps passe en descente / en montee, et bouton bas tenu pendant ces phases */
  back: number;
  good: number;
  front: number;
  wrong: number;
  /** Virages : ecart max au centre de la ligne, temps de direction vers l'interieur */
  maxDev: number;
  inward: number;
  airborne: boolean;
}

export interface ActiveTrick {
  id: TrickId;
  t: number; // progression 0..1
  duration: number;
}

const T = CONFIG.trick;

export class RiderSim {
  readonly track: Track;
  readonly lane: -1 | 1;
  rand: () => number;

  state: RiderState = "ready";
  time = 0;
  s: number;
  v = 0;
  /** Decalage lateral dans la ligne (m, + = droite) */
  u = 0;
  y = 0;
  vx = 0;
  vy = 0;
  airborne = false;

  hype = 0;
  boostTime = 0;
  streak = 0;
  perfectCount = 0;
  featureCount = 0;
  tricksLanded: TrickId[] = [];
  finishTime = 0;
  crashReason = "";
  crashSide: -1 | 1 = 1;
  crashT = 0;

  trick: ActiveTrick | null = null;
  private pendingFlip: TrickId | null = null;
  private pendingStyleAt: number | null = null;
  private airFeature: Feature | null = null;
  private takeoffSpeed = 0;
  private flipTooSmall = false;
  private lastUpPress = -9;
  private lastDownPress = -9;
  private nextFeature = 0;
  private open: OpenFeature[] = [];
  /** Vrai quand on tient bas dans une bosse (trick interdit) */
  private pumpingBump = false;

  // Pour l'animation
  pumpAnim = 0;
  pullAnim = 0;
  schralpTime = 0;
  steerAnim = 0;

  events: SimEvent[] = [];

  constructor(track: Track, lane: -1 | 1, rand: () => number = Math.random) {
    this.track = track;
    this.lane = lane;
    this.rand = rand;
    this.s = track.startS;
    this.y = track.surfaceY(this.s, 0);
  }

  get successRate(): number {
    return this.featureCount ? this.perfectCount / this.featureCount : 0;
  }

  get hypeRatio(): number {
    return Math.min(1, this.hype / this.track.def.hypeToFill);
  }

  go() {
    this.state = "racing";
    this.v = CONFIG.speed.start;
  }

  // ---------------------------------------------------------------- update
  step(dt: number, intent: Intent) {
    this.events.length = 0;
    if (this.state === "ready") return;
    this.time += dt;
    if (intent.upPressed) this.lastUpPress = this.time;
    if (intent.downPressed) this.lastDownPress = this.time;

    if (this.state === "crashed") {
      this.stepCrash(dt);
      return;
    }

    this.pumpAnim += ((intent.down && !intent.trick ? 1 : 0) - this.pumpAnim) * Math.min(1, dt * 12);
    this.pullAnim += ((intent.up && !intent.trick ? 1 : 0) - this.pullAnim) * Math.min(1, dt * 12);
    this.steerAnim += (intent.steer - this.steerAnim) * Math.min(1, dt * 8);
    this.schralpTime = Math.max(0, this.schralpTime - dt);

    // Boost de hype : la barre se vide pendant le boost
    if (this.boostTime > 0) {
      this.boostTime -= dt;
      this.hype = this.track.def.hypeToFill * Math.max(0, this.boostTime / CONFIG.hype.boostDuration);
      if (this.boostTime <= 0) this.hype = 0;
    }

    const prevS = this.s;
    if (this.airborne) this.stepAir(dt, intent);
    else this.stepGround(dt, intent, prevS);

    if ((this.state as RiderState) === "crashed") return;
    this.updateFeatures(intent, dt);

    // On ne passe la ligne qu'une fois au sol (pas d'arrivee en volant au-dessus d'une reception ratee)
    if (this.state === "racing" && !this.airborne && this.s >= this.track.finishS) {
      this.state = "finished";
      // Interpolation du temps exact de passage
      const over = (this.s - this.track.finishS) / Math.max(0.1, this.airborne ? this.vx : this.v);
      this.finishTime = this.time - over;
      this.events.push({ type: "finish", time: this.finishTime });
    }
  }

  private stepGround(dt: number, intent: Intent, prevS: number) {
    const S = CONFIG.speed;
    const tr = this.track;

    // Vitesse
    let a = -S.gravity * tr.gradeAt(this.s) * S.slopeGain;
    if (this.v > S.cruise) a -= S.dragToCruise * (this.v - S.cruise);
    if (this.v < S.pedalTarget && this.state === "racing") a += S.pedalAccel;
    if (this.boostTime > 0) a += CONFIG.hype.boostAccel;
    if (this.state === "finished") a = -3;
    this.v = Math.min(S.max, Math.max(this.state === "finished" ? 0 : S.min, this.v + a * dt));

    // Direction + deport dans les virages
    this.u += intent.steer * CONFIG.steer.speed * dt;
    const b = tr.bankAt(this.s);
    if (b.outside !== 0) {
      const k = Math.abs(tr.curvatureAt(this.s));
      const drift = CONFIG.berm.driftGain * this.v * this.v * k;
      this.u += b.outside * drift * dt;
    }
    const limit = tr.laneWidth / 2 + CONFIG.steer.offTrackTolerance;
    if (Math.abs(this.u) > limit && this.state === "racing") {
      this.crash("Sortie de piste !", this.u > 0 ? 1 : -1);
      return;
    }
    if (this.state === "finished") this.u = Math.max(-limit + 0.2, Math.min(limit - 0.2, this.u));

    this.s += this.v * dt;

    // Tricks au sol
    if (this.state === "racing") this.groundTricks(intent);
    if (this.state === "crashed") return;

    // Decollage
    const jump = tr.features.find((f) => f.kind === "jump" && prevS < f.s && this.s >= f.s);
    if (jump && this.state === "racing") {
      if (jump.jumpType === "kicker" || this.v >= CONFIG.jump.minLaunchSpeed) {
        this.takeoff(jump, intent);
        return;
      }
    }
    this.y = tr.surfaceY(this.s, this.u);
  }

  private groundTricks(intent: Intent) {
    const dir = intent.trickDirPressed;
    const raking = this.pumpingBump;
    if ((intent.trickPressed || dir) && raking) {
      this.crash("Trick en rasant une bosse !", this.rand() < 0.5 ? -1 : 1);
      return;
    }
    if (!dir) return;
    const next = this.track.features.find((f) => f.kind === "jump" && f.s > this.s);
    if (!next) return;
    const takeoffZone = next.s - this.v * T.takeoffWindow;
    if (this.s >= takeoffZone) {
      this.pendingFlip = dirToTakeoffTrick(dir);
    } else if (this.s >= next.windowStart) {
      this.crash("Trick lancé trop tôt !", this.rand() < 0.5 ? -1 : 1);
    }
  }

  /** Calcule la vitesse de decollage selon l'action (utilise aussi par le bot et les aides) */
  launchVelocity(f: Feature, v: number, action: JumpAction, custom?: number): { vx: number; vy: number } {
    const J = CONFIG.jump;
    const ang = Math.atan(this.track.slopeBefore(f.s));
    let vx = v * Math.cos(ang);
    let vy = v * Math.sin(ang);
    if (custom !== undefined) return { vx: vx * (1 - (1 - custom) * 0.3), vy: vy * custom };
    if (action === "pull") {
      vx *= J.pullVx;
      vy *= J.pullVy;
    } else if (action === "scrub") {
      vx *= J.scrubVx;
      vy *= J.scrubVy;
    }
    return { vx, vy };
  }

  /** Prediction de reception pour une action donnee (bot, aides visuelles) */
  predictJump(f: Feature, v: number, action: JumpAction, u = this.u, custom?: number): LandResult & { s: number; air: number } {
    let { vx, vy } = this.launchVelocity(f, v, action, custom);
    let s = f.s;
    let y = this.track.heightAt(f.s - 1e-4);
    const dt = 1 / 120;
    let t = 0;
    const g = CONFIG.jump.gravity;
    for (let i = 0; i < 600; i++) {
      s += vx * dt;
      y += vy * dt;
      vy -= g * dt;
      t += dt;
      if (vy < 0 && y <= this.track.surfaceY(s, u)) break;
    }
    return { ...classifyLanding(f, s), s, air: t };
  }

  private takeoff(f: Feature, intent: Intent) {
    const J = CONFIG.jump;
    let action: JumpAction = "none";
    let flip = this.pendingFlip;
    if (!flip && intent.trick && intent.trickDir) flip = dirToTakeoffTrick(intent.trickDir);
    if (!flip && !intent.trick) {
      const pull = intent.up || this.time - this.lastUpPress < J.actionWindow;
      const scrub = intent.down || this.time - this.lastDownPress < J.actionWindow;
      if (pull && scrub) action = this.lastUpPress > this.lastDownPress ? "pull" : "scrub";
      else if (pull) action = "pull";
      else if (scrub) action = "scrub";
    }
    // Flip ou 360 : la trajectoire s'ajuste toute seule pour viser la reception (plus simple)
    let custom: number | undefined;
    if (flip && flip !== "tailwhip") custom = this.flipLaunch(f, T.list[flip].duration * T.landTolerance);
    const lv = this.launchVelocity(f, this.v, action, custom);
    this.vx = lv.vx;
    this.vy = lv.vy;
    this.y = this.track.heightAt(f.s - 1e-4);
    this.airborne = true;
    this.takeoffSpeed = this.v;
    this.airFeature = f;
    this.pendingFlip = null;
    this.pendingStyleAt = null;
    this.flipTooSmall = false;
    this.events.push({ type: "takeoff", feature: f, action });
    if (flip) {
      if (flip === "tailwhip") {
        this.startTrick("tailwhip");
      } else {
        this.startTrick(flip);
        this.flipTooSmall = !f.big;
      }
    }
  }

  /** Temps d'air restant estime (s) */
  remainingAir(): number {
    let s = this.s, y = this.y, vy = this.vy;
    const dt = 1 / 120;
    for (let i = 1; i < 400; i++) {
      s += this.vx * dt;
      y += vy * dt;
      vy -= CONFIG.jump.gravity * dt;
      if (vy < 0 && y <= this.track.surfaceY(s, this.u)) return i * dt;
    }
    return 400 * dt;
  }

  /** Flip / 360 : impulsion ajustee automatiquement pour viser la reception avec assez d'air */
  private flipLaunch(f: Feature, minAir: number): number {
    let best = 1;
    let bestScore = Infinity;
    const rank = { perfect: 0, ok: 1, bad: 2, crash: 3 };
    for (let k = 0.45; k <= 1.4; k += 0.05) {
      const p = this.predictJump(f, this.v, "none", this.u, k);
      const score = rank[p.quality] * 2 + Math.abs(p.ratio - 0.4) + (p.air < minAir ? 3 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = k;
      }
    }
    return best;
  }

  /** Action (rien / tirer / raser) qui donne la meilleure reception a la vitesse actuelle */
  bestAction(f: Feature, minAir = 0): JumpAction {
    const rank = { perfect: 0, ok: 1, bad: 2, crash: 3 };
    let best: JumpAction = "none";
    let bestScore = Infinity;
    for (const a of ["none", "pull", "scrub"] as JumpAction[]) {
      const p = this.predictJump(f, this.v, a, this.u);
      // Pour un flip : il faut assez de temps d'air pour finir la rotation
      const score = rank[p.quality] + Math.abs(p.ratio - 0.42) * 0.1 + (p.air < minAir ? 2.5 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }

  private startTrick(id: TrickId) {
    this.trick = { id, t: 0, duration: T.list[id].duration };
    this.pendingStyleAt = null;
    this.events.push({ type: "trickStart", id });
  }

  private stepAir(dt: number, intent: Intent) {
    const J = CONFIG.jump;
    this.s += this.vx * dt;
    this.y += this.vy * dt;
    this.vy -= J.gravity * dt;
    if (this.state !== "finished") this.u += intent.steer * CONFIG.steer.speed * CONFIG.steer.airControl * dt;

    if (this.state === "racing") {
      const dir = intent.trickDirPressed;
      if (dir && !this.trick) {
        if (dir === "left") this.startTrick("tailwhip");
        else {
          this.crash(dir === "right" ? "360 lancé en l'air !" : "Flip lancé en l'air !", this.rand() < 0.5 ? -1 : 1);
          return;
        }
      } else if (intent.trickPressed && !this.trick && this.pendingStyleAt === null) {
        this.pendingStyleAt = this.time;
      }
      if (this.pendingStyleAt !== null && !this.trick && this.time - this.pendingStyleAt > T.styleDelay) {
        // Trick de style au hasard, parmi ceux qui ont le temps d'etre finis (sinon le plus court)
        const air = this.remainingAir();
        const fit = STYLE_TRICKS.filter((id) => T.list[id].duration * T.landTolerance <= air);
        const pool = fit.length ? fit : [...STYLE_TRICKS].sort((a, b) => T.list[a].duration - T.list[b].duration).slice(0, 1);
        this.startTrick(pool[Math.floor(this.rand() * pool.length)]);
      }
    }
    if (this.trick) this.trick.t = Math.min(1.2, this.trick.t + dt / this.trick.duration);

    const gy = this.track.surfaceY(this.s, this.u);
    if (this.vy < 0 && this.y <= gy) {
      this.y = gy;
      this.land();
    }
  }

  private land() {
    const J = CONFIG.jump;
    const f = this.airFeature;
    this.airborne = false;
    this.airFeature = null;
    // Vitesse conservee (arcade) : on repart a la vitesse de decollage
    this.v = Math.max(CONFIG.speed.min, this.takeoffSpeed);

    if (this.state !== "racing" || !f) {
      this.trick = null;
      return;
    }

    if (this.trick && this.trick.t < T.landTolerance) {
      this.crash("Trick pas fini à la réception !", this.rand() < 0.5 ? -1 : 1);
      return;
    }
    if (this.trick && this.flipTooSmall) {
      this.crash("Saut trop petit pour un " + T.list[this.trick.id].label.toLowerCase() + " !", -1);
      return;
    }
    const res = classifyLanding(f, this.s);
    if (res.quality === "crash") {
      this.crash(res.reason ?? "Chute !", this.rand() < 0.5 ? -1 : 1);
      return;
    }
    const quality = res.quality;
    this.events.push({ type: "land", quality, ratio: res.ratio });
    this.featureCount++;
    if (quality === "perfect") this.awardPerfect("jump");
    else {
      this.streak = 0;
      this.v -= quality === "ok" ? J.lossOk : J.lossBad;
      if (quality === "bad") this.events.push({ type: "miss", kind: "jump" });
    }
    if (this.trick) {
      const def = T.list[this.trick.id];
      this.tricksLanded.push(this.trick.id);
      this.events.push({ type: "trick", id: this.trick.id, hype: def.hype });
      this.addHype(def.hype);
      this.trick = null;
    }
    this.v = Math.max(CONFIG.speed.min, this.v);
  }

  private awardPerfect(kind: FeatureKind) {
    const P = CONFIG.perfect;
    this.perfectCount++;
    const mult = Math.min(P.streakMaxMult, 1 + this.streak * P.streakBonus);
    this.streak++;
    this.v = Math.min(CONFIG.speed.max, this.v + P.boost * mult);
    this.events.push({ type: "perfect", kind, streak: this.streak });
  }

  addHype(pts: number) {
    if (this.boostTime > 0) return;
    this.hype += pts;
    if (this.hype >= this.track.def.hypeToFill) {
      this.hype = this.track.def.hypeToFill;
      this.boostTime = CONFIG.hype.boostDuration;
      this.events.push({ type: "hypeFull" });
    }
  }

  // ----------------------------------------------------- bosses & virages
  private updateFeatures(intent: Intent, dt: number) {
    const feats = this.track.features;
    while (this.nextFeature < feats.length && feats[this.nextFeature].windowStart <= this.s) {
      const f = feats[this.nextFeature++];
      if (f.kind !== "jump") this.open.push({ f, back: 0, good: 0, front: 0, wrong: 0, maxDev: 0, inward: 0, airborne: false });
    }
    const down = intent.down && !intent.trick;
    this.pumpingBump = false;
    for (let i = this.open.length - 1; i >= 0; i--) {
      const o = this.open[i];
      if (this.airborne) o.airborne = true;
      else if (o.f.kind === "bump") {
        // Pomper : bas maintenu dans la descente, relache dans la montee
        const slope = this.track.slopeAt(this.s);
        if (slope < -0.03) {
          o.back += dt;
          if (down) {
            o.good += dt;
            this.v = Math.min(CONFIG.speed.max, this.v + CONFIG.pump.accel * dt);
          }
        } else if (slope > 0.03) {
          o.front += dt;
          if (down) o.wrong += dt;
        }
        if (down) this.pumpingBump = true;
      } else if (o.f.kind === "berm") {
        o.maxDev = Math.max(o.maxDev, Math.abs(this.u));
        if (intent.steer * -(o.f.outside ?? 0) > 0.25) o.inward += dt;
      }
      if (this.s >= o.f.windowEnd) {
        this.open.splice(i, 1);
        if (this.state === "racing" && !o.airborne) this.evaluate(o);
      }
    }
  }

  private evaluate(o: OpenFeature) {
    this.featureCount++;
    if (o.f.kind === "berm") {
      if (o.maxDev <= this.track.laneWidth * CONFIG.berm.perfectDeviation) {
        this.awardPerfect("berm");
        if (o.inward > 0.2 && this.rand() < CONFIG.berm.schralpChance) {
          this.v = Math.min(CONFIG.speed.max, this.v + CONFIG.berm.schralpBoost);
          this.schralpTime = 0.8;
          this.events.push({ type: "schralp" });
          this.addHype(CONFIG.berm.schralpHype);
        }
      } else this.streak = 0;
      return;
    }
    const P = CONFIG.pump;
    const g = o.back > 0 ? o.good / o.back : 0;
    const w = o.front > 0 ? o.wrong / o.front : 0;
    if (g >= P.perfectRatio && w <= P.maxWrongRatio) this.awardPerfect("bump");
    else if (g >= P.okRatio) this.streak = 0;
    else {
      this.streak = 0;
      this.v = Math.max(CONFIG.speed.min, this.v - P.lossNoPump);
      this.events.push({ type: "miss", kind: "bump" });
    }
  }

  // ----------------------------------------------------------------- chute
  crash(reason: string, side: -1 | 1) {
    if (this.state !== "racing") return;
    this.state = "crashed";
    this.crashReason = reason;
    // On tombe vers la rubalise la plus proche, jamais vers le public :
    // le rider s'arrete sur la rubalise du bord de sa ligne.
    this.crashSide = side;
    this.crashT = 0;
    this.trick = null;
    this.events.push({ type: "crash", reason });
  }

  private stepCrash(dt: number) {
    this.crashT += dt;
    if (this.airborne) {
      this.s += this.vx * dt;
      this.y += this.vy * dt;
      this.vy -= CONFIG.jump.gravity * dt;
      const gy = this.track.surfaceY(this.s, this.u);
      if (this.vy < 0 && this.y <= gy) {
        this.y = gy;
        this.airborne = false;
        this.v = Math.max(0, this.vx * 0.5);
      }
      return;
    }
    this.v = Math.max(0, this.v - 9 * dt);
    this.s += this.v * dt;
    const tapeU = this.crashSide * (this.track.laneWidth / 2 + 0.35);
    this.u += (tapeU - this.u) * Math.min(1, dt * 3);
    this.y = this.track.surfaceY(this.s, Math.max(-this.track.laneWidth / 2, Math.min(this.track.laneWidth / 2, this.u)));
  }
}

/** Qualite de reception selon la position d'atterrissage sur la face de reception */
export function classifyLanding(f: Feature, sLand: number): LandResult {
  const J = CONFIG.jump;
  const a = f.landStart ?? f.s;
  const b = f.landEnd ?? f.s + 1;
  const ratio = (sLand - a) / Math.max(0.1, b - a);
  const big = (f.height ?? 0) >= J.caseCrashHeight;
  if (ratio >= J.perfectMin && ratio <= J.perfectMax) return { quality: "perfect", ratio };
  if (ratio >= J.okMin && ratio <= J.okMax) return { quality: "ok", ratio };
  if (ratio > J.okMax) {
    if (ratio > J.longMax) return { quality: "crash", ratio, reason: "Trop long ! Il fallait raser (bas)" };
    return { quality: "bad", ratio };
  }
  // Trop court
  const inGap = f.jumpType === "kicker" && sLand < (f.deckStart ?? f.s);
  if (big || inGap) return { quality: "crash", ratio, reason: "Saut casé ! Il fallait tirer (haut)" };
  return { quality: "bad", ratio };
}

function dirToTakeoffTrick(d: Dir): TrickId {
  switch (d) {
    case "up":
      return "frontflip";
    case "down":
      return "backflip";
    case "right":
      return "threesixty";
    case "left":
      return "tailwhip";
  }
}

export const isFlip = (id: TrickId) => FLIP_TRICKS.includes(id);
