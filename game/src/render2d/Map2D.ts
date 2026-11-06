// Terrain vu de dessus (facon photo drone), peint en tuiles a la demande.
// Relief ombre au soleil (butte, talus, bosses, virages, kickers), textures terre / gravier / herbe,
// rubalise, barrieres, arbres, pylone, plan d'eau. Les tuiles sont mises en cache.

import type { Landmark, TrackDef } from "../data/types";
import { chipsCanvas, dirtCanvas, grassCanvas, gravelCanvas } from "../engine/canvasTextures";
import { barrierLateral, moundEdge, moundHeight, sampleKind, shoulderWidth } from "../engine/layout";
import type { Track } from "../engine/Track";

/** Direction du soleil (x, y = haut, z) : haut-gauche de la carte */
export const SUN = (() => {
  const v = [-0.55, 0.72, -0.42];
  const n = Math.hypot(v[0], v[1], v[2]);
  return { x: v[0] / n, y: v[1] / n, z: v[2] / n };
})();
/** Decalage horizontal d'une ombre par metre de hauteur */
export const SHADOW = { x: -SUN.x / SUN.y, z: -SUN.z / SUN.y };

const TILE_M = 24;
const PX_PER_M = 24;
const TILE_PX = TILE_M * PX_PER_M;
const DS = 0.3;

type RGB = [number, number, number];
const C = {
  lane: [156, 134, 106] as RGB,
  top: [168, 148, 118] as RGB,
  gravel: [206, 198, 182] as RGB,
  wood1: [184, 140, 88] as RGB,
  wood2: [164, 120, 72] as RGB,
  chips: [128, 84, 46] as RGB,
  grass: [112, 152, 62] as RGB,
};

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

interface Placed {
  kind: Landmark["kind"];
  x: number;
  z: number;
  s: number;
  rot: number;
  seed: number;
}

export interface CrowdPerson {
  x: number;
  z: number;
  rot: number;
  color: string;
  skin: string;
  phase: number;
  energy: number;
}

export class Map2D {
  readonly track: Track;
  private def: TrackDef;
  private tiles = new Map<string, HTMLCanvasElement>();
  private order: string[] = [];
  private maxTiles = 36;
  // Grille de la butte (lignes de s, colonnes laterales)
  private rows: number;
  private cols: number;
  /** Demi-largeur de la grille pour chaque ligne (suit la forme de la butte : bords lisses) */
  private halfW: Float32Array;
  private gx: Float32Array;
  private gz: Float32Array;
  private gh: Float32Array;
  private rowBox: Float32Array; // minx, minz, maxx, maxz par ligne
  private patterns!: { grass: CanvasPattern; dirt: CanvasPattern; gravel: CanvasPattern; chips: CanvasPattern };
  private textures = { grass: grassCanvas(), dirt: dirtCanvas(), gravel: gravelCanvas(), chips: chipsCanvas() };
  readonly landmarks: Placed[] = [];
  readonly crowd: CrowdPerson[] = [];
  readonly barriers: { x: number; z: number; rot: number; banner: boolean }[] = [];
  readonly pylon: { x: number; z: number; rot: number } | null = null;
  readonly center: { x: number; z: number };
  private blotches: { x: number; z: number; r: number; c: string }[] = [];

  constructor(track: Track) {
    this.track = track;
    this.def = track.def;
    // Centre de la piste
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < track.n; i += 10) {
      minX = Math.min(minX, track.x[i]); maxX = Math.max(maxX, track.x[i]);
      minZ = Math.min(minZ, track.z[i]); maxZ = Math.max(maxZ, track.z[i]);
    }
    this.center = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };

    // ----- grille de hauteurs de la butte (largeur adaptee a chaque ligne)
    this.cols = 97;
    this.rows = Math.ceil(track.length / DS) + 1;
    const n = this.rows * this.cols;
    this.gx = new Float32Array(n);
    this.gz = new Float32Array(n);
    this.gh = new Float32Array(n);
    this.halfW = new Float32Array(this.rows);
    this.rowBox = new Float32Array(this.rows * 4);
    const P = { x: 0, z: 0 };
    for (let r = 0; r < this.rows; r++) {
      const s = Math.min(track.length, r * DS);
      const half = moundEdge(track) + shoulderWidth(track, s) + 0.05;
      this.halfW[r] = half;
      let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
      for (let c = 0; c < this.cols; c++) {
        const lat = -half + (c * 2 * half) / (this.cols - 1);
        track.posAt(s, lat, P);
        const i = r * this.cols + c;
        this.gx[i] = P.x;
        this.gz[i] = P.z;
        this.gh[i] = this.height(s, lat);
        bx0 = Math.min(bx0, P.x); bz0 = Math.min(bz0, P.z); bx1 = Math.max(bx1, P.x); bz1 = Math.max(bz1, P.z);
      }
      this.rowBox.set([bx0, bz0, bx1, bz1], r * 4);
    }

    this.placeLandmarks();
    this.placeCrowd();
    const d = this.def.decor;
    if (d.pylon) {
      const s = track.moduleStarts[d.pylon.nearModule] + 3;
      const lat = d.pylon.side * (moundEdge(track) + shoulderWidth(track, s) + d.pylon.distance);
      const p = track.posAt(s, lat);
      this.pylon = { x: p.x, z: p.z, rot: track.headingAt(s) + 0.35 };
    }
    // Taches d'herbe (plus claire / plus seche) pour casser la repetition
    for (let i = 0; i < 260; i++) {
      const g = hash(i * 3.1);
      this.blotches.push({
        x: this.center.x + (hash(i) - 0.5) * 360,
        z: this.center.z + (hash(i * 7.7) - 0.5) * 460,
        r: 4 + hash(i * 1.3) * 14,
        c: g < 0.5 ? "rgba(178,170,92,0.22)" : g < 0.8 ? "rgba(70,110,40,0.2)" : "rgba(150,170,80,0.2)",
      });
    }
  }

  /** Hauteur du sol en coordonnees piste */
  height(s: number, lat: number): number {
    const t = this.track;
    for (const lane of [-1, 1] as const) {
      const u = lat - t.laneCenter(lane);
      if (Math.abs(u) <= t.laneWidth / 2) return t.surfaceY(s, u);
    }
    return moundHeight(t, s, lat);
  }

  private material(s: number, lat: number): RGB {
    const t = this.track;
    const kind = sampleKind(t, s);
    for (const lane of [-1, 1] as const) {
      const u = lat - t.laneCenter(lane);
      if (Math.abs(u) <= t.laneWidth / 2) {
        if (t.wood[t.index(s)] === 1) return Math.floor(s / 0.3) % 2 ? C.wood1 : C.wood2;
        if (kind === "start") return C.chips;
        // Traces de roues
        const rut = Math.abs(Math.abs(u) - 0.35) < 0.12 ? 0.9 : 1;
        return [C.lane[0] * rut, C.lane[1] * rut, C.lane[2] * rut];
      }
    }
    const e = moundEdge(t);
    if (Math.abs(lat) <= e) return kind === "start" ? C.chips : C.top;
    return kind === "start" ? C.grass : C.gravel;
  }

  // -------------------------------------------------------------- placements
  private placeLandmarks() {
    const t = this.track;
    const centers: [number, number][] = [];
    for (let i = 0; i < t.n; i += 8) centers.push([t.x[i], t.z[i]]);
    const clear = (x: number, z: number, r: number) => centers.every(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 > r * r);
    this.def.decor.landmarks.forEach((l, i) => {
      let x: number;
      let z: number;
      let rot = hash(i) * 6;
      if (l.nearModule !== undefined) {
        const s = Math.min(t.length, t.moduleStarts[l.nearModule] + (l.along ?? 0));
        const lat = (l.side ?? 1) * (barrierLateral(t, s) + (l.distance ?? 6));
        const p = t.posAt(s, lat);
        x = p.x;
        z = p.z;
        rot = t.headingAt(s);
      } else {
        x = this.center.x + (l.x ?? 0);
        z = this.center.z + (l.z ?? 0);
        if (!clear(x, z, 14)) return;
      }
      this.landmarks.push({ kind: l.kind, x, z, s: l.s ?? 1, rot, seed: i + 1 });
    });
  }

  private placeCrowd() {
    const t = this.track;
    const P = { x: 0, z: 0 };
    const shirts = ["#C76520", "#C2A833", "#704916", "#EFE6CE", "#2e6db4", "#d94f3d", "#3a3a3a", "#ffffff", "#7a9c3c", "#e0a030"];
    const skins = ["#f0c8a0", "#e7b98f", "#c68c5a", "#8d5a3a", "#f5d5b5"];
    let k = 0;
    for (const zone of this.def.crowd) {
      const s0 = Math.max(t.startS, t.moduleStarts[zone.fromModule]);
      const s1 = zone.toModule + 1 < t.moduleStarts.length ? t.moduleStarts[zone.toModule + 1] : t.length;
      for (const side of zone.side === 0 ? [-1, 1] : [zone.side]) {
        let bi = 0;
        for (let s = s0; s < s1; s += 2.3) {
          const lat = side * barrierLateral(t, s);
          t.posAt(s, lat, P);
          this.barriers.push({ x: P.x, z: P.z, rot: t.headingAt(s), banner: bi++ % 4 === 1 });
        }
        for (let s = s0; s < s1; s += 1.6 / (zone.density ?? 1)) {
          const rows = hash(k) < 0.5 ? 1 : 2;
          for (let r = 0; r < rows; r++) {
            const lat = side * (barrierLateral(t, s) + 0.8 + r * 0.9 + hash(k * 3) * 0.4);
            t.posAt(s + hash(k * 5) * 0.6, lat, P);
            this.crowd.push({
              x: P.x,
              z: P.z,
              rot: t.headingAt(s) + (side > 0 ? Math.PI / 2 : -Math.PI / 2),
              color: shirts[k % shirts.length],
              skin: skins[(k * 7) % skins.length],
              phase: hash(k * 11) * 6.28,
              energy: 0.6 + hash(k * 13) * 0.6,
            });
            k++;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------- tuiles
  /** Dessine les tuiles visibles dans le rectangle monde donne (ctx deja en coordonnees monde) */
  draw(ctx: CanvasRenderingContext2D, minX: number, minZ: number, maxX: number, maxZ: number, budget = 1) {
    const tx0 = Math.floor(minX / TILE_M);
    const tx1 = Math.floor(maxX / TILE_M);
    const tz0 = Math.floor(minZ / TILE_M);
    const tz1 = Math.floor(maxZ / TILE_M);
    for (let tz = tz0; tz <= tz1; tz++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        let tile = this.tiles.get(`${tx},${tz}`);
        if (!tile && budget > 0) {
          tile = this.tile(tx, tz);
          budget--;
        }
        if (tile) ctx.drawImage(tile, tx * TILE_M, tz * TILE_M, TILE_M + 0.02, TILE_M + 0.02);
        else {
          ctx.fillStyle = "#6f9b3e";
          ctx.fillRect(tx * TILE_M, tz * TILE_M, TILE_M, TILE_M);
        }
      }
    }
  }

  /** Prepare a l'avance les tuiles d'une zone */
  prefetch(minX: number, minZ: number, maxX: number, maxZ: number, budget = 1) {
    for (let tz = Math.floor(minZ / TILE_M); tz <= Math.floor(maxZ / TILE_M) && budget > 0; tz++)
      for (let tx = Math.floor(minX / TILE_M); tx <= Math.floor(maxX / TILE_M) && budget > 0; tx++)
        if (!this.tiles.has(`${tx},${tz}`)) {
          this.tile(tx, tz);
          budget--;
        }
  }

  private tile(tx: number, tz: number): HTMLCanvasElement {
    const key = `${tx},${tz}`;
    const t0 = performance.now();
    const c = document.createElement("canvas");
    c.width = c.height = TILE_PX;
    const g = c.getContext("2d")!;
    if (!this.patterns) {
      const mk = (cv: HTMLCanvasElement, m: number) => {
        const p = g.createPattern(cv, "repeat")!;
        p.setTransform(new DOMMatrix().scale(m / cv.width));
        return p;
      };
      this.patterns = {
        grass: mk(this.textures.grass, 3.5),
        dirt: mk(this.textures.dirt, 3),
        gravel: mk(this.textures.gravel, 2.2),
        chips: mk(this.textures.chips, 1.6),
      };
    }
    g.setTransform(PX_PER_M, 0, 0, PX_PER_M, -tx * TILE_M * PX_PER_M, -tz * TILE_M * PX_PER_M);
    const x0 = tx * TILE_M;
    const z0 = tz * TILE_M;
    const tm: number[] = [performance.now()];
    this.paintGround(g, x0, z0);
    tm.push(performance.now());
    this.paintMound(g, x0, z0);
    tm.push(performance.now());
    this.paintTrackDetails(g);
    tm.push(performance.now());
    this.paintObjects(g, x0, z0);
    tm.push(performance.now());
    if (location.search.includes("perf")) console.log("tile", key, (performance.now() - t0).toFixed(0), tm.map((v, i) => (i ? (v - tm[i - 1]).toFixed(0) : "")).join(" "));
    this.tiles.set(key, c);
    this.order.push(key);
    if (this.order.length > this.maxTiles) this.tiles.delete(this.order.shift()!);
    return c;
  }

  private strokeCenter(g: CanvasRenderingContext2D, lat: number, width: number, style: string | CanvasPattern, alpha = 1) {
    const t = this.track;
    const P = { x: 0, z: 0 };
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = style;
    g.lineWidth = width;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    for (let s = -3; s <= t.length + 3; s += 1) {
      t.posAt(Math.min(Math.max(s, 0), t.length), lat, P);
      if (s === -3) g.moveTo(P.x, P.z);
      else g.lineTo(P.x, P.z);
    }
    g.stroke();
    g.restore();
  }

  private paintGround(g: CanvasRenderingContext2D, x0: number, z0: number) {
    g.fillStyle = this.patterns.grass;
    g.fillRect(x0, z0, TILE_M, TILE_M);
    for (const b of this.blotches) {
      if (b.x + b.r < x0 || b.x - b.r > x0 + TILE_M || b.z + b.r < z0 || b.z - b.r > z0 + TILE_M) continue;
      const grd = g.createRadialGradient(b.x, b.z, 0, b.x, b.z, b.r);
      grd.addColorStop(0, b.c);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(b.x - b.r, b.z - b.r, b.r * 2, b.r * 2);
    }
    // Terre tassee autour de la butte (vue drone)
    const e = moundEdge(this.track);
    this.strokeCenter(g, 0, (e + 12) * 2, "rgba(150,128,96,0.35)");
    this.strokeCenter(g, 0, (e + 8) * 2, this.patterns.dirt, 0.55);
    this.strokeCenter(g, 0, (e + 5) * 2, "rgba(152,132,104,0.5)");
    // Chemin pieton en gravier blanc
    this.strokeCenter(g, -26, 2.6, this.patterns.gravel, 0.95);
    // Plan d'eau
    const lake = this.def.decor.lake;
    if (lake) {
      const lx = this.center.x + lake.x;
      const lz = this.center.z + lake.z;
      g.fillStyle = "#9a9274";
      g.beginPath();
      g.ellipse(lx, lz, lake.w / 2 + 4, lake.d / 2 + 4, 0, 0, Math.PI * 2);
      g.fill();
      const grd = g.createRadialGradient(lx, lz, 0, lx, lz, lake.w / 2);
      grd.addColorStop(0, "#2f7fb8");
      grd.addColorStop(0.8, "#3b93c8");
      grd.addColorStop(1, "#5aa7c9");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(lx, lz, lake.w / 2, lake.d / 2, 0, 0, Math.PI * 2);
      g.fill();
      // Reflets
      g.strokeStyle = "rgba(255,255,255,0.18)";
      g.lineWidth = 0.4;
      for (let i = 0; i < 60; i++) {
        const ax = lx + (hash(i) - 0.5) * lake.w * 0.8;
        const az = lz + (hash(i * 3) - 0.5) * lake.d * 0.7;
        g.beginPath();
        g.moveTo(ax, az);
        g.lineTo(ax + 3 + hash(i * 5) * 5, az);
        g.stroke();
      }
      // Parc aquatique gonflable
      const n = lake.inflatables ?? 6;
      const cols = ["#1f7fe0", "#f6c700", "#f2f2f2", "#1f7fe0"];
      for (let i = 0; i < n; i++) {
        const px = lx - lake.w * 0.25 + (i * lake.w * 0.5) / Math.max(1, n - 1);
        const pz = lz + lake.d * 0.33 + Math.sin(i * 1.7) * 5;
        const w = i % 3 === 0 ? 7 : 2.6;
        const d = i % 3 === 0 ? 2.2 : 2.6;
        g.save();
        g.translate(px, pz);
        g.rotate(i * 0.4);
        g.fillStyle = "rgba(0,30,60,0.35)";
        g.fillRect(-w / 2 + 0.8, -d / 2 + 0.6, w, d);
        g.fillStyle = cols[i % cols.length];
        g.fillRect(-w / 2, -d / 2, w, d);
        g.fillStyle = "rgba(255,255,255,0.35)";
        g.fillRect(-w / 2, -d / 2, w, d * 0.3);
        g.restore();
      }
    }
  }

  private paintMound(g: CanvasRenderingContext2D, x0: number, z0: number) {
    const t = this.track;
    const cols = this.cols;
    const x1 = x0 + TILE_M;
    const z1 = z0 + TILE_M;
    const e = moundEdge(t);
    for (let r = 0; r < this.rows - 1; r++) {
      const b = r * 4;
      const b2 = (r + 1) * 4;
      const minx = Math.min(this.rowBox[b], this.rowBox[b2]);
      const minz = Math.min(this.rowBox[b + 1], this.rowBox[b2 + 1]);
      const maxx = Math.max(this.rowBox[b + 2], this.rowBox[b2 + 2]);
      const maxz = Math.max(this.rowBox[b + 3], this.rowBox[b2 + 3]);
      if (maxx < x0 || minx > x1 || maxz < z0 || minz > z1) continue;
      const s = r * DS + DS / 2;
      const half = (this.halfW[r] + this.halfW[r + 1]) / 2;
      const dl = (2 * half) / (cols - 1);
      const h = t.headingAt(s);
      const fx = -Math.sin(h);
      const fz = -Math.cos(h);
      const rx = Math.cos(h);
      const rz = -Math.sin(h);
      for (let c = 0; c < cols - 1; c++) {
        const lat = -half + (c + 0.5) * dl;
        const i00 = r * cols + c;
        const i01 = i00 + 1;
        const i10 = i00 + cols;
        const i11 = i10 + 1;
        // Normale depuis les pentes (le long de s et en travers)
        const dhds = (this.gh[i10] + this.gh[i11] - this.gh[i00] - this.gh[i01]) / (2 * DS);
        const dhdl = (this.gh[i01] + this.gh[i11] - this.gh[i00] - this.gh[i10]) / (2 * dl);
        const gx = dhds * fx + dhdl * rx;
        const gz = dhds * fz + dhdl * rz;
        const nl = Math.hypot(gx, 1, gz);
        const dot = (-gx * SUN.x + SUN.y - gz * SUN.z) / nl;
        // Lumiere rasante + creux plus sombres : les bosses ressortent comme sur la photo drone
        const hAvg = (this.gh[i00] + this.gh[i11]) / 2;
        const shade = (0.42 + 0.85 * Math.max(0, dot)) * (0.88 + 0.12 * Math.min(1, hAvg / 1.2));
        const m = this.material(s, lat);
        const noise = 0.96 + hash(r * 131 + c * 7) * 0.08;
        const k = shade * noise;
        const col = `rgb(${Math.min(255, m[0] * k) | 0},${Math.min(255, m[1] * k) | 0},${Math.min(255, m[2] * k) | 0})`;
        g.fillStyle = col;
        g.strokeStyle = col;
        g.lineWidth = 0.05;
        g.beginPath();
        g.moveTo(this.gx[i00], this.gz[i00]);
        g.lineTo(this.gx[i01], this.gz[i01]);
        g.lineTo(this.gx[i11], this.gz[i11]);
        g.lineTo(this.gx[i10], this.gz[i10]);
        g.closePath();
        g.fill();
        g.stroke();
      }
    }
    // Grain : texture de terre / gravier en lumiere douce par-dessus la butte
    g.save();
    g.globalCompositeOperation = "soft-light";
    this.strokeCenter(g, 0, (e + 1.5) * 2, this.patterns.gravel, 0.9);
    this.strokeCenter(g, 0, t.laneSpacing + t.laneWidth, this.patterns.dirt, 0.9);
    g.restore();
  }

  private paintTrackDetails(g: CanvasRenderingContext2D) {
    const t = this.track;
    const P = { x: 0, z: 0 };
    const Q = { x: 0, z: 0 };
    // Planches des kickers et du depart
    g.strokeStyle = "rgba(70,45,20,0.55)";
    g.lineWidth = 0.035;
    for (let s = 0; s < t.length; s += 0.3) {
      if (t.wood[t.index(s)] !== 1) continue;
      for (const lane of [-1, 1] as const) {
        const c0 = t.laneCenter(lane);
        t.posAt(s, c0 - t.laneWidth / 2, P);
        t.posAt(s, c0 + t.laneWidth / 2, Q);
        g.beginPath();
        g.moveTo(P.x, P.z);
        g.lineTo(Q.x, Q.z);
        g.stroke();
      }
    }
    // Ombre portee des kickers en bois (face arriere verticale)
    for (const f of t.features) {
      if (f.kind !== "jump" || f.jumpType !== "kicker") continue;
      const hgt = t.heightAt(f.s - 0.01) - t.heightAt(f.s + 0.05);
      for (const lane of [-1, 1] as const) {
        const c0 = t.laneCenter(lane);
        const pts = [
          t.posAt(f.s, c0 - t.laneWidth / 2),
          t.posAt(f.s, c0 + t.laneWidth / 2),
        ];
        g.fillStyle = "rgba(30,20,10,0.38)";
        g.beginPath();
        g.moveTo(pts[0].x, pts[0].z);
        g.lineTo(pts[1].x, pts[1].z);
        g.lineTo(pts[1].x + SHADOW.x * hgt, pts[1].z + SHADOW.z * hgt);
        g.lineTo(pts[0].x + SHADOW.x * hgt, pts[0].z + SHADOW.z * hgt);
        g.closePath();
        g.fill();
      }
    }
    // Ligne d'arrivee en damier
    {
      const s = t.finishS;
      const w = t.laneSpacing + t.laneWidth;
      const h = t.headingAt(s);
      const p = t.posAt(s, 0);
      g.save();
      g.translate(p.x, p.z);
      g.rotate(-h);
      const sq = 0.3;
      for (let x = -w / 2, i = 0; x < w / 2; x += sq, i++)
        for (let y = -0.3, j = 0; y < 0.3; y += sq, j++) {
          g.fillStyle = (i + j) % 2 ? "#151515" : "#f4f1ea";
          g.fillRect(x, y, sq, sq);
        }
      g.restore();
    }
    // Rubalise : bords exterieurs et separation (ombre puis ruban rouge et blanc)
    const e = t.laneSpacing / 2 + t.laneWidth / 2 + 0.45;
    const jumps = t.features.filter((f) => f.kind === "jump");
    const inJump = (s: number) => jumps.some((f) => s > f.s - (f.jumpType === "kicker" ? 6 : 2.5) && s < (f.landEnd ?? f.s) + 0.5);
    for (const lat of [-e, 0, e]) {
      let prev: { x: number; z: number } | null = null;
      let seg = 0;
      for (let s = t.startS + 1; s <= t.finishS + 12; s += 2.5) {
        if (lat === 0 && (inJump(s) || s > t.finishS - 1)) {
          prev = null;
          continue;
        }
        const p = t.posAt(s, lat);
        // Piquet
        g.fillStyle = "rgba(0,0,0,0.3)";
        g.beginPath();
        g.arc(p.x + SHADOW.x * 0.9, p.z + SHADOW.z * 0.9, 0.06, 0, Math.PI * 2);
        g.fill();
        if (prev) {
          g.strokeStyle = "rgba(0,0,0,0.25)";
          g.lineWidth = 0.08;
          g.beginPath();
          g.moveTo(prev.x + SHADOW.x * 0.9, prev.z + SHADOW.z * 0.9);
          g.lineTo(p.x + SHADOW.x * 0.9, p.z + SHADOW.z * 0.9);
          g.stroke();
          g.strokeStyle = seg++ % 2 ? "#d42a1e" : "#f6f2ea";
          g.lineWidth = 0.09;
          g.beginPath();
          g.moveTo(prev.x, prev.z);
          g.lineTo(p.x, p.z);
          g.stroke();
        }
        g.fillStyle = "#e8e2d0";
        g.beginPath();
        g.arc(p.x, p.z, 0.05, 0, Math.PI * 2);
        g.fill();
        prev = p;
      }
    }
    // Barrieres et baches KABARE
    for (const b of this.barriers) {
      g.save();
      g.translate(b.x, b.z);
      g.rotate(-b.rot);
      g.fillStyle = "rgba(0,0,0,0.28)";
      g.fillRect(-0.08 + SHADOW.x * 0.9, -1.1 + SHADOW.z * 0.9, 0.16 + Math.abs(SHADOW.x), 2.2);
      g.fillStyle = b.banner ? "#C76520" : "#aeb3b8";
      g.fillRect(-0.06, -1.1, 0.12, 2.2);
      g.restore();
    }
  }

  private paintObjects(g: CanvasRenderingContext2D, x0: number, z0: number) {
    const near = (x: number, z: number, r: number) => x + r > x0 && x - r < x0 + TILE_M && z + r > z0 && z - r < z0 + TILE_M;
    // Ombres d'abord, puis objets
    for (const l of this.landmarks) if (near(l.x, l.z, 30)) drawLandmark(g, l, true);
    if (this.pylon && near(this.pylon.x, this.pylon.z, 45)) drawPylon(g, this.pylon, true);
    for (const l of this.landmarks) if (near(l.x, l.z, 12)) drawLandmark(g, l, false);
    if (this.pylon && near(this.pylon.x, this.pylon.z, 12)) drawPylon(g, this.pylon, false);
  }
}

// =============================================================================
//  Objets vus de dessus

function blob(g: CanvasRenderingContext2D, x: number, z: number, r: number, color: string, light: string, seed: number, lumps = 7) {
  for (let k = 0; k < lumps; k++) {
    const a = (k / lumps) * Math.PI * 2 + hash(seed + k);
    const rr = r * (0.45 + hash(seed * 3 + k) * 0.25);
    const cx = x + Math.cos(a) * r * 0.5;
    const cz = z + Math.sin(a) * r * 0.5;
    const grd = g.createRadialGradient(cx - rr * 0.35, cz - rr * 0.35, rr * 0.1, cx, cz, rr);
    grd.addColorStop(0, light);
    grd.addColorStop(1, color);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cz, rr, 0, Math.PI * 2);
    g.fill();
  }
  const grd = g.createRadialGradient(x - r * 0.3, z - r * 0.3, r * 0.1, x, z, r * 0.6);
  grd.addColorStop(0, light);
  grd.addColorStop(1, color);
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, z, r * 0.55, 0, Math.PI * 2);
  g.fill();
}

function drawLandmark(g: CanvasRenderingContext2D, l: Placed, shadow: boolean) {
  const s = l.s;
  const sh = (hgt: number) => ({ x: l.x + SHADOW.x * hgt, z: l.z + SHADOW.z * hgt });
  const shadowBlob = (r: number, hgt: number, stretch = 1) => {
    const p = sh(hgt);
    g.fillStyle = "rgba(20,30,10,0.38)";
    g.beginPath();
    g.ellipse((l.x + p.x) / 2 + (p.x - l.x) * 0.5, (l.z + p.z) / 2 + (p.z - l.z) * 0.5, r, r * stretch, Math.atan2(SHADOW.z, SHADOW.x), 0, Math.PI * 2);
    g.fill();
  };
  switch (l.kind) {
    case "pine":
      if (shadow) {
        g.strokeStyle = "rgba(20,30,10,0.35)";
        g.lineWidth = 0.5 * s;
        g.beginPath();
        g.moveTo(l.x, l.z);
        g.lineTo(sh(8 * s).x, sh(8 * s).z);
        g.stroke();
        shadowBlob(4.6 * s, 9 * s);
      } else blob(g, l.x + 0.6, l.z - 0.4, 5 * s, "#2f4a20", "#5f8238", l.seed, 9);
      break;
    case "poplar":
      if (shadow) {
        const p = sh(12 * s);
        g.strokeStyle = "rgba(20,30,10,0.35)";
        g.lineCap = "round";
        g.lineWidth = 2.6 * s;
        g.beginPath();
        g.moveTo(l.x, l.z);
        g.lineTo(p.x, p.z);
        g.stroke();
      } else blob(g, l.x, l.z, 2 * s, "#3d6427", "#6e9a40", l.seed, 5);
      break;
    case "round":
      if (shadow) shadowBlob(3.6 * s, 5 * s);
      else blob(g, l.x, l.z, 4 * s, "#3f6a26", "#79a845", l.seed, 7);
      break;
    case "willow":
      if (shadow) shadowBlob(3.8 * s, 4.5 * s);
      else blob(g, l.x, l.z, 4.4 * s, "#6f9a38", "#b4d070", l.seed, 9);
      break;
    case "bush":
      if (shadow) shadowBlob(1.4 * s, 1.2 * s);
      else blob(g, l.x, l.z, 1.6 * s, "#3e6424", "#6b9a3c", l.seed, 5);
      break;
    case "van": {
      g.save();
      g.translate(l.x, l.z);
      if (shadow) {
        g.translate(SHADOW.x * 2, SHADOW.z * 2);
        g.rotate(-l.rot);
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(-1, -2.3, 2, 4.6);
      } else {
        g.rotate(-l.rot);
        g.fillStyle = "#f3f3f3";
        g.fillRect(-0.95, -2.2, 1.9, 4.4);
        g.fillStyle = "#26323d";
        g.fillRect(-0.85, -1.85, 1.7, 0.55);
        g.fillStyle = "#d8d8d8";
        g.fillRect(-0.6, -0.8, 1.2, 2.4);
        g.fillStyle = "#333";
        g.fillRect(-0.55, -0.6, 1.1, 1.9);
      }
      g.restore();
      break;
    }
  }
}

function drawPylon(g: CanvasRenderingContext2D, p: { x: number; z: number; rot: number }, shadow: boolean) {
  g.save();
  g.translate(p.x, p.z);
  const H = 32;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const half = (y: number) => 3.4 + (0.9 - 3.4) * Math.min(1, y / (H * 0.75));
  const pt = (sx: number, sz: number, y: number): [number, number] => {
    const c = Math.cos(-p.rot);
    const s = Math.sin(-p.rot);
    const lx = sx * half(y);
    const lz = sz * half(y);
    let x = lx * c - lz * s;
    let z = lx * s + lz * c;
    if (shadow) {
      x += SHADOW.x * y;
      z += SHADOW.z * y;
    }
    return [x, z];
  };
  g.strokeStyle = shadow ? "rgba(20,25,15,0.3)" : "#4c5650";
  g.lineWidth = shadow ? 0.18 : 0.16;
  const levels = [0, 4, 8, 12, 16, 20, 24, 28, H];
  for (const [sx, sz] of corners) {
    g.beginPath();
    levels.forEach((y, i) => {
      const [x, z] = pt(sx, sz, y);
      if (i === 0) g.moveTo(x, z);
      else g.lineTo(x, z);
    });
    g.stroke();
  }
  for (const y of levels) {
    g.beginPath();
    corners.forEach(([sx, sz], i) => {
      const [x, z] = pt(sx, sz, y);
      if (i === 0) g.moveTo(x, z);
      else g.lineTo(x, z);
    });
    g.closePath();
    g.stroke();
    // Croisillons
    const a = pt(-1, -1, y);
    const b = pt(1, 1, y);
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.stroke();
  }
  // Bras porteurs
  for (const [y, w] of [[21, 9], [26.5, 7]]) {
    const c = Math.cos(-p.rot);
    const s = Math.sin(-p.rot);
    const off = shadow ? [SHADOW.x * y, SHADOW.z * y] : [0, 0];
    g.lineWidth = shadow ? 0.3 : 0.28;
    g.beginPath();
    g.moveTo(-w * c + off[0], -w * s + off[1]);
    g.lineTo(w * c + off[0], w * s + off[1]);
    g.stroke();
  }
  // Palissade en bois
  if (!shadow) {
    g.strokeStyle = "#6e4c2c";
    g.lineWidth = 0.22;
    g.save();
    g.rotate(-p.rot);
    g.strokeRect(-5, -5, 10, 10);
    g.restore();
  } else {
    g.save();
    g.rotate(-p.rot);
    g.strokeStyle = "rgba(20,25,15,0.28)";
    g.lineWidth = 1.6;
    g.strokeRect(-5 + SHADOW.x, -5 + SHADOW.z, 10, 10);
    g.restore();
  }
  g.restore();
}
