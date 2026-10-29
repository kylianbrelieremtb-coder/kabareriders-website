// Piste : transforme la liste de modules (data/tracks) en geometrie echantillonnee
// (ligne centrale, altitude, devers) et en "features" de gameplay (bosses, virages, sauts).
// Pur calcul : aucune dependance au rendu, reutilise par la calibration de l'adversaire.

import { CONFIG } from "../config";
import type { ModuleDef, TrackDef } from "../data/types";

export const DS = 0.2; // pas d'echantillonnage (m)

export type FeatureKind = "bump" | "berm" | "jump";

export interface Feature {
  kind: FeatureKind;
  moduleIndex: number;
  /** Point de timing : crete de bosse, point de pompage du virage, levre du saut */
  s: number;
  windowStart: number;
  windowEnd: number;
  // Sauts
  jumpType?: "kicker" | "table";
  height?: number;
  big?: boolean;
  /** Pied de la rampe d'appel */
  rampStart?: number;
  /** Debut de la structure de reception (fin du trou) */
  deckStart?: number;
  /** Face de reception : de landStart (haut) a landEnd (bas) */
  landStart?: number;
  landEnd?: number;
  // Virages
  outside?: 1 | -1;
  radius?: number;
}

interface ModuleSample {
  rel: number; // altitude relative a la ligne de base
  rate: number; // vitesse de rotation du cap (rad/m), + = gauche
  bank: number; // hauteur du devers au bord exterieur
  wood: boolean;
  chips?: boolean;
}

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

function moduleSlope(m: ModuleDef): number {
  return "slope" in m && m.slope !== undefined ? m.slope : 0;
}

export function moduleLength(m: ModuleDef): number {
  switch (m.type) {
    case "start":
    case "straight":
    case "finish":
      return m.length;
    case "rollers":
      return m.count * m.spacing;
    case "berm":
      return m.radius * Math.abs((m.angle * Math.PI) / 180);
    case "table":
      return m.up + m.top + m.down;
    case "kicker":
      return m.length + m.gap + m.landing.up + m.landing.top + m.landing.down;
  }
}

function landingShape(x: number, l: { height: number; up: number; top: number; down: number }) {
  if (x < l.up) return l.height * Math.sin((Math.PI / 2) * (x / l.up));
  if (x < l.up + l.top) return l.height;
  return l.height * (1 - landingDrop((x - l.up - l.top) / l.down));
}

/** Profil d'une face de reception : arrondi en haut, pente reguliere, courte transition en bas */
function landingDrop(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  const a = 0.2;
  const b = 0.88;
  const area = a / 2 + (b - a) + (1 - b) / 2;
  let v: number;
  if (x < a) v = (x * x) / (2 * a);
  else if (x < b) v = a / 2 + (x - a);
  else {
    const r = 1 - x;
    v = area - (r * r) / (2 * (1 - b));
  }
  return v / area;
}

function sampleModule(m: ModuleDef, x: number, len: number): ModuleSample {
  const out: ModuleSample = { rel: 0, rate: 0, bank: 0, wood: false };
  switch (m.type) {
    case "start": {
      const flat = 3;
      out.rel = x < flat ? m.drop : m.drop * (1 - smooth((x - flat) / (len - flat)));
      out.wood = x < flat; // plancher de depart
      break;
    }
    case "rollers":
      out.rel = m.height * 0.5 * (1 - Math.cos((2 * Math.PI * x) / m.spacing));
      break;
    case "berm": {
      const a = (m.angle * Math.PI) / 180;
      const t = x / len;
      out.rate = (a / len) * (1 - 0.5 * Math.cos(2 * Math.PI * t));
      out.bank = m.bank * smooth(t / 0.22) * smooth((1 - t) / 0.22);
      break;
    }
    case "table": {
      const wood = m.material === "wood";
      if (x < m.up) out.rel = m.height * Math.pow(x / m.up, wood ? 2 : 1.3);
      else if (x < m.up + m.top) out.rel = m.height;
      else {
        out.rel = m.height * (1 - landingDrop((x - m.up - m.top) / m.down));
        out.chips = m.landingSurface === "chips";
      }
      out.wood = wood && x < m.up + m.top;
      break;
    }
    case "kicker": {
      if (x < m.length) {
        out.rel = m.height * Math.pow(x / m.length, 2);
        out.wood = m.material !== "dirt";
      } else if (x < m.length + m.gap) {
        out.rel = 0;
      } else {
        out.rel = landingShape(x - m.length - m.gap, m.landing);
        out.chips = m.landingSurface === "chips";
      }
      break;
    }
    default:
      break;
  }
  return out;
}

export class Track {
  readonly def: TrackDef;
  readonly length: number;
  readonly startS = 2;
  readonly finishS: number;
  readonly moduleStarts: number[] = [];
  private readonly moduleLens: number[];
  private readonly moduleBase: number[] = [];
  private shiftY = 0;
  readonly features: Feature[] = [];
  readonly laneWidth: number;
  readonly laneSpacing: number;

  // Echantillons
  readonly n: number;
  readonly x: Float32Array;
  readonly z: Float32Array;
  readonly heading: Float32Array;
  readonly y: Float32Array;
  /** Pente de la ligne de base seule (sans les bosses), pour la gravite arcade */
  readonly grade: Float32Array;
  readonly bank: Float32Array;
  readonly outside: Int8Array;
  readonly wood: Uint8Array;
  readonly chips: Uint8Array;
  readonly moduleIdx: Uint8Array;

  constructor(def: TrackDef) {
    this.def = def;
    this.laneWidth = def.laneWidth;
    this.laneSpacing = def.laneSpacing;

    let total = 0;
    const lens = def.modules.map((m) => {
      this.moduleStarts.push(total);
      const l = moduleLength(m);
      total += l;
      return l;
    });
    this.length = total;
    this.moduleLens = lens;
    const finishIdx = def.modules.findIndex((m) => m.type === "finish");
    this.finishS = finishIdx >= 0 ? this.moduleStarts[finishIdx] : total - 5;

    this.n = Math.ceil(total / DS) + 2;
    this.x = new Float32Array(this.n);
    this.z = new Float32Array(this.n);
    this.heading = new Float32Array(this.n);
    this.y = new Float32Array(this.n);
    this.grade = new Float32Array(this.n);
    const baseOnly = new Float32Array(this.n);
    this.bank = new Float32Array(this.n);
    this.outside = new Int8Array(this.n);
    this.wood = new Uint8Array(this.n);
    this.chips = new Uint8Array(this.n);
    this.moduleIdx = new Uint8Array(this.n);

    let base = 0;
    let hx = 0;
    let hz = 0;
    let head = 0;
    let mi = 0;
    for (let i = 0; i < this.n; i++) {
      const s = i * DS;
      while (mi < def.modules.length - 1 && s >= this.moduleStarts[mi] + lens[mi]) mi++;
      if (this.moduleBase.length <= mi) this.moduleBase[mi] = base + (s - this.moduleStarts[mi]) * moduleSlope(def.modules[mi]);
      const m = def.modules[mi];
      const local = Math.min(s - this.moduleStarts[mi], lens[mi]);
      const smp = sampleModule(m, local, lens[mi]);
      const slope = moduleSlope(m);

      this.x[i] = hx;
      this.z[i] = hz;
      this.heading[i] = head;
      this.y[i] = base + smp.rel;
      baseOnly[i] = base + (m.type === "start" ? smp.rel : 0);
      this.bank[i] = smp.bank;
      this.outside[i] = m.type === "berm" ? (m.angle > 0 ? 1 : -1) : 0;
      this.wood[i] = smp.wood ? 1 : 0;
      this.chips[i] = smp.chips ? 1 : 0;
      this.moduleIdx[i] = mi;

      base -= slope * DS;
      head += smp.rate * DS;
      hx += -Math.sin(head) * DS;
      hz += -Math.cos(head) * DS;
    }

    // Recale pour que le point le plus bas soit au niveau du terrain (y = 0)
    let minY = Infinity;
    for (let i = 0; i < this.n; i++) minY = Math.min(minY, this.y[i]);
    for (let i = 0; i < this.n; i++) this.y[i] -= minY;
    this.shiftY = minY;
    for (let i = 0; i < this.n; i++) {
      const a = Math.max(0, i - 1);
      const b = Math.min(this.n - 1, i + 1);
      this.grade[i] = (baseOnly[b] - baseOnly[a]) / ((b - a) * DS);
    }

    this.buildFeatures(lens);
  }

  private buildFeatures(lens: number[]) {
    this.def.modules.forEach((m, mi) => {
      const s0 = this.moduleStarts[mi];
      const len = lens[mi];
      if (m.type === "rollers") {
        for (let k = 0; k < m.count; k++) {
          const crest = s0 + (k + 0.5) * m.spacing;
          this.features.push({
            kind: "bump",
            moduleIndex: mi,
            s: crest,
            windowStart: crest - m.spacing / 2,
            windowEnd: crest + m.spacing / 2,
          });
        }
      } else if (m.type === "berm") {
        this.features.push({
          kind: "berm",
          moduleIndex: mi,
          s: s0 + len / 2,
          windowStart: s0 + len * 0.1,
          windowEnd: s0 + len * 0.9,
          outside: m.angle > 0 ? 1 : -1,
          radius: m.radius,
        });
      } else if (m.type === "table") {
        const lip = s0 + m.up;
        this.features.push({
          kind: "jump",
          jumpType: "table",
          moduleIndex: mi,
          rampStart: s0,
          s: lip,
          windowStart: lip - CONFIG.trick.approachZone,
          windowEnd: s0 + len,
          height: m.height,
          big: m.height >= CONFIG.trick.minFlipHeight,
          deckStart: lip,
          landStart: lip + m.top,
          landEnd: s0 + len,
        });
      } else if (m.type === "kicker") {
        const lip = s0 + m.length;
        const l = m.landing;
        const downStart = lip + m.gap + l.up + l.top;
        this.features.push({
          kind: "jump",
          jumpType: "kicker",
          moduleIndex: mi,
          rampStart: lip - m.length,
          s: lip,
          windowStart: lip - CONFIG.trick.approachZone,
          windowEnd: s0 + len,
          height: m.height,
          big: m.height >= CONFIG.trick.minFlipHeight,
          deckStart: lip + m.gap,
          landStart: downStart,
          landEnd: s0 + len,
        });
      }
    });
    this.features.sort((a, b) => a.s - b.s);
  }

  private interp(arr: ArrayLike<number>, s: number): number {
    const f = Math.min(Math.max(s / DS, 0), this.n - 1.001);
    const i = Math.floor(f);
    const t = f - i;
    return arr[i] * (1 - t) + arr[i + 1] * t;
  }

  index(s: number): number {
    return Math.min(Math.max(Math.round(s / DS), 0), this.n - 1);
  }

  /** Altitude exacte de l'axe de la piste (calcul analytique, levres nettes) */
  heightAt(s: number): number {
    const c = Math.min(Math.max(s, 0), this.length);
    let mi = this.moduleIdx[this.index(c)];
    while (mi > 0 && c < this.moduleStarts[mi]) mi--;
    while (mi < this.moduleLens.length - 1 && c >= this.moduleStarts[mi] + this.moduleLens[mi]) mi++;
    const m = this.def.modules[mi];
    const local = c - this.moduleStarts[mi];
    const rel = sampleModule(m, local, this.moduleLens[mi]).rel;
    return this.moduleBase[mi] - moduleSlope(m) * local + rel - this.shiftY;
  }

  /** Pente dy/ds (positive = monte) */
  slopeAt(s: number, h = 0.15): number {
    return (this.heightAt(s + h) - this.heightAt(s - h)) / (2 * h);
  }

  /** Pente juste avant s (pour l'angle de levre d'un saut) */
  slopeBefore(s: number): number {
    return (this.heightAt(s - 0.005) - this.heightAt(s - 0.2)) / 0.195;
  }

  gradeAt(s: number): number {
    return this.interp(this.grade, s);
  }

  headingAt(s: number): number {
    return this.interp(this.heading, s);
  }

  bankAt(s: number): { h: number; outside: number } {
    const i = this.index(s);
    return { h: this.interp(this.bank, s), outside: this.outside[i] };
  }

  /** Altitude de la surface d'une ligne a la position laterale `u` (relative au centre de la ligne, + = droite) */
  surfaceY(s: number, u: number): number {
    const base = this.heightAt(s);
    const b = this.bankAt(s);
    if (b.h <= 0.001 || b.outside === 0) return base;
    const w = this.laneWidth;
    const t = Math.min(1, Math.max(0, (u * b.outside + w / 2) / w));
    return base + b.h * t * t;
  }

  /** Pente laterale du devers (rad) a la position u */
  bankAngle(s: number, u: number): number {
    const d = 0.05;
    return Math.atan2(this.surfaceY(s, u + d) - this.surfaceY(s, u - d), 2 * d);
  }

  /** Position monde (x, z) a l'abscisse s et au decalage lateral `lat` (relatif a l'axe central, + = droite) */
  posAt(s: number, lat: number, out: { x: number; z: number } = { x: 0, z: 0 }) {
    const h = this.headingAt(s);
    out.x = this.interp(this.x, s) + Math.cos(h) * lat;
    out.z = this.interp(this.z, s) - Math.sin(h) * lat;
    return out;
  }

  /** Decalage lateral du centre d'une ligne : -1 = gauche, 1 = droite */
  laneCenter(lane: -1 | 1): number {
    return (lane * this.laneSpacing) / 2;
  }

  moduleAt(s: number): number {
    return this.moduleIdx[this.index(s)];
  }

  curvatureAt(s: number): number {
    return (this.headingAt(s + 0.5) - this.headingAt(s - 0.5)) / 1.0;
  }
}
