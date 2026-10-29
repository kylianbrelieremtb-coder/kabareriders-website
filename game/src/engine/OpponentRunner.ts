// Adversaire : rejoue un run de reference calibre sur son taux de reussite,
// deforme par sa signature de vitesse (accelere / ralentit selon les sections)
// tout en gardant le temps cible.

import { CONFIG, FLIP_TRICKS, STYLE_TRICKS, type TrickId } from "../config";
import type { OpponentDef } from "../data/types";
import type { ReferenceRun } from "./Bot";
import type { Track } from "./Track";

export class OpponentRunner {
  s: number;
  v = 0;
  y = 0;
  u = 0;
  airborne = false;
  time = 0;
  started = false;
  finished = false;
  finishTime = Infinity;
  trick: { id: TrickId; t: number; duration: number } | null = null;
  private k = 1;

  constructor(
    private track: Track,
    private def: OpponentDef,
    private ref: ReferenceRun,
    targetTime: number,
    private rand: () => number = Math.random,
  ) {
    this.s = track.startS;
    this.y = track.surfaceY(this.s, 0);
    // Temps du profil deforme (k = 1), puis facteur pour tomber sur le temps cible
    let t = 0;
    for (let s = track.startS; s < track.finishS; s += 0.1) t += 0.1 / this.baseSpeed(s);
    this.k = t / (targetTime * CONFIG.opponent.timeFactor);
  }

  private sig(s: number): number {
    const p = this.def.speedProfile;
    const x = (s - this.track.startS) / (this.track.finishS - this.track.startS);
    if (x <= p[0].at) return p[0].mult;
    for (let i = 1; i < p.length; i++) {
      if (x <= p[i].at) {
        const a = p[i - 1];
        const b = p[i];
        return a.mult + ((b.mult - a.mult) * (x - a.at)) / (b.at - a.at);
      }
    }
    return p[p.length - 1].mult;
  }

  private refAt(arr: ArrayLike<number>, s: number): number {
    const f = Math.min(Math.max(s / this.ref.binSize, 0), arr.length - 1.001);
    const i = Math.floor(f);
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  }

  private baseSpeed(s: number): number {
    return Math.max(1.5, this.refAt(this.ref.v, s)) * this.sig(s);
  }

  go() {
    this.started = true;
  }

  step(dt: number) {
    if (!this.started) return;
    this.time += dt;
    const finishing = this.finished;
    this.v = finishing ? Math.max(0, this.v - 3 * dt) : this.baseSpeed(this.s) * this.k;
    const wasAir = this.airborne;
    this.s += this.v * dt;
    const bin = Math.min(this.ref.air.length - 1, Math.floor(this.s / this.ref.binSize));
    this.airborne = this.ref.air[bin] === 1;
    // Petite vie laterale
    this.u = Math.sin(this.time * 0.9) * 0.25 + Math.sin(this.time * 2.3) * 0.08;
    const ground = this.track.surfaceY(this.s, this.u);
    this.y = this.airborne ? Math.max(ground, this.refAt(this.ref.y, this.s)) : ground;

    if (this.airborne && !wasAir) this.maybeTrick(bin);
    if (this.trick) {
      this.trick.t += dt / this.trick.duration;
      if (this.trick.t >= 1) this.trick = null;
    }
    if (!this.airborne && this.trick) this.trick = null;

    if (!this.finished && this.s >= this.track.finishS) {
      this.finished = true;
      this.finishTime = this.time - (this.s - this.track.finishS) / Math.max(0.5, this.v);
    }
  }

  private maybeTrick(bin: number) {
    const f = this.track.features.find((f) => f.kind === "jump" && Math.abs(f.s - this.s) < 1.5);
    if (!f || this.rand() > CONFIG.opponent.trickChance) return;
    // Duree d'air restante d'apres le run de reference
    let n = bin;
    while (n < this.ref.air.length && this.ref.air[n] === 1) n++;
    const airTime = ((n - bin) * this.ref.binSize) / Math.max(1, this.v);
    const pool = f.big ? [...FLIP_TRICKS, ...STYLE_TRICKS] : STYLE_TRICKS;
    const id = pool[Math.floor(this.rand() * pool.length)];
    const duration = Math.min(CONFIG.trick.list[id].duration, airTime * 0.85);
    if (duration > 0.3) this.trick = { id, t: 0, duration };
  }

  /** Pente pour l'assiette du modele */
  pitch(): number {
    if (this.airborne) return Math.atan((this.refAt(this.ref.y, this.s + 0.4) - this.refAt(this.ref.y, this.s - 0.4)) / 0.8) * 0.6;
    return Math.atan((this.track.heightAt(this.s + 0.6) - this.track.heightAt(this.s - 0.6)) / 1.2);
  }
}
