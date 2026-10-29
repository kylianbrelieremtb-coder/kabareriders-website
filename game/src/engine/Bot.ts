// Bot : pilote la simulation avec un taux d'execution parfaite donne.
// Sert a calibrer l'adversaire (son temps = celui d'un rider qui reussit X % de perfects)
// et a verifier les reglages des sauts (npm run calibrate).

import { CONFIG } from "../config";
import { emptyIntent, type Intent } from "./intent";
import { RiderSim, type JumpAction } from "./RiderSim";
import type { Feature, Track } from "./Track";

/** Petit generateur pseudo-aleatoire reproductible */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Bot {
  private plans = new Map<Feature, { pressAt: number; perfect: boolean; done: boolean; action?: JumpAction }>();
  private wasDown = false;
  constructor(
    private sim: RiderSim,
    private success: number,
    private rand: () => number,
  ) {}

  /** Meilleure action pour un saut a la vitesse actuelle */
  static bestJumpAction(sim: RiderSim, f: Feature, v: number): { action: JumpAction; score: number }[] {
    const acts: JumpAction[] = ["none", "pull", "scrub"];
    const rank = { perfect: 0, ok: 1, bad: 2, crash: 3 };
    return acts
      .map((action) => {
        const p = sim.predictJump(f, v, action, 0);
        return { action, score: rank[p.quality] + Math.abs(p.ratio - 0.42) * 0.1 };
      })
      .sort((a, b) => a.score - b.score);
  }

  intent(): Intent {
    const sim = this.sim;
    const tr = sim.track;
    const it = emptyIntent();
    // Reste au centre et contre le deport des virages
    const b = tr.bankAt(sim.s);
    let targetU = 0;
    const berm = tr.features.find((f) => f.kind === "berm" && sim.s > f.windowStart - 4 && sim.s < f.windowEnd);
    if (berm) {
      // Ligne : exterieur si on va trop vite pour tenir l'interieur, sinon interieur (plus court)
      const k = Math.abs(tr.curvatureAt(berm.s));
      const vIn = Math.sqrt(CONFIG.lines.insideGrip / Math.max(0.01, k));
      targetU = (berm.outside ?? 1) * (sim.v > vIn * 0.97 ? 0.75 : -0.75) * (tr.laneWidth / 2);
    }
    // Contre le deport des virages (meme calcul que la simulation)
    const k = Math.abs(tr.curvatureAt(sim.s));
    const line = (sim.u * (b.outside || 1)) / (tr.laneWidth / 2);
    const drift = CONFIG.berm.driftGain * sim.v * sim.v * k * (line > 0.5 ? CONFIG.berm.driftHighLine : 1);
    const ff = b.outside !== 0 ? -b.outside * Math.min(1, drift / CONFIG.steer.speed) : 0;
    it.steer = Math.max(-1, Math.min(1, (targetU - sim.u) * 2 + ff));

    for (const f of tr.features) {
      if (f.windowEnd < sim.s || f.windowStart > sim.s + 20) continue;
      let plan = this.plans.get(f);
      if (!plan) {
        const perfect = this.rand() < this.success;
        plan = { pressAt: perfect ? f.s : f.s + (f.windowEnd - f.s) * 0.75, perfect, done: false };
        this.plans.set(f, plan);
      }
      if (plan.done) continue;
      if (f.kind === "jump") {
        // Decide l'action juste avant la levre
        if (sim.s >= f.s - sim.v * 0.2 && sim.s < f.s) {
          const ranked = Bot.bestJumpAction(sim, f, sim.v);
          let pick = ranked[0];
          if (!plan.perfect) {
            const none = ranked.find((r) => r.action === "none")!;
            if (none.score < 2) pick = none;
          }
          if (pick.action === "pull") {
            it.up = true;
            it.upPressed = true;
          } else if (pick.action === "scrub") {
            it.down = true;
            it.downPressed = true;
          }
          plan.done = true;
        }
      } else if (f.kind === "bump" && !sim.airborne && sim.s >= f.windowStart && sim.s < f.windowEnd) {
        // Pompe : bas maintenu dans la descente (toute la descente si "parfait", la fin sinon)
        if (tr.slopeAt(sim.s) < -0.03 && sim.s >= plan.pressAt) {
          it.down = true;
          it.downPressed = !this.wasDown;
        }
      }
    }
    this.wasDown = it.down;
    return it;
  }
}

export interface ReferenceRun {
  time: number;
  /** Profil par echantillon de s (pas = binSize) */
  binSize: number;
  v: Float32Array;
  y: Float32Array;
  air: Uint8Array;
  success: number;
  crashed: boolean;
  log: string[];
}

export function simulateRun(track: Track, success: number, seed: number, verbose = false): ReferenceRun {
  const rand = mulberry32(seed);
  const sim = new RiderSim(track, 1, rand);
  const bot = new Bot(sim, success, rand);
  const binSize = 0.5;
  const nb = Math.ceil(track.length / binSize) + 1;
  const v = new Float32Array(nb);
  const y = new Float32Array(nb);
  const air = new Uint8Array(nb);
  const log: string[] = [];
  sim.go();
  const dt = 1 / 120;
  let lastBin = -1;
  for (let i = 0; i < 120 * 120 && sim.state === "racing"; i++) {
    sim.step(dt, bot.intent());
    const bi = Math.floor(sim.s / binSize);
    for (let k = lastBin + 1; k <= bi && k < nb; k++) {
      v[k] = sim.airborne ? sim.vx : sim.v;
      y[k] = sim.y;
      air[k] = sim.airborne ? 1 : 0;
    }
    lastBin = Math.max(lastBin, bi);
    if (verbose) {
      for (const e of sim.events) {
        if (e.type === "takeoff")
          log.push(`s=${sim.s.toFixed(1)} decollage ${e.feature.jumpType} h=${e.feature.height} v=${sim.v.toFixed(2)} action=${e.action}`);
        else if (e.type === "land") log.push(`s=${sim.s.toFixed(1)} reception ${e.quality} ratio=${e.ratio.toFixed(2)} v=${sim.v.toFixed(2)}`);
        else if (e.type === "crash") log.push(`s=${sim.s.toFixed(1)} CHUTE ${e.reason}`);
        else if (e.type === "perfect") log.push(`s=${sim.s.toFixed(1)} perfect ${e.kind} v=${sim.v.toFixed(2)}`);
        else if (e.type === "miss") log.push(`s=${sim.s.toFixed(1)} rate ${e.kind}`);
      }
    }
  }
  // Fin du profil (apres l'arrivee) : on prolonge
  for (let k = lastBin + 1; k < nb; k++) {
    v[k] = Math.max(2, v[Math.max(0, lastBin)]);
    y[k] = track.heightAt(k * binSize);
  }
  return {
    time: sim.state === "finished" ? sim.finishTime : Infinity,
    binSize,
    v,
    y,
    air,
    success: sim.successRate,
    crashed: sim.state === "crashed",
    log,
  };
}

/** Temps de reference et run "median" pour un taux de reussite donne */
export function calibrate(track: Track, success: number, runs: number = CONFIG.opponent.calibrationRuns) {
  const results: ReferenceRun[] = [];
  for (let i = 0; i < runs; i++) {
    const r = simulateRun(track, success, 1000 + i);
    if (!r.crashed && isFinite(r.time)) results.push(r);
  }
  if (!results.length) results.push(simulateRun(track, 1, 1));
  results.sort((a, b) => a.time - b.time);
  const median = results[Math.floor(results.length / 2)];
  const mean = results.reduce((a, r) => a + r.time, 0) / results.length;
  return { median, meanTime: mean, finished: results.length };
}
