// Rendu « Affiche » : vue derriere le rider, aplats de couleurs KABARE, ombrage en 3 niveaux,
// grain papier, silhouettes. La piste est projetee en perspective section par section
// (vrai relief : bosses, virages releves, kickers) ; decor et riders en sprites plats.

import type { TrickId } from "../config";
import type { CharacterDef } from "../data/types";
import { placeDecor, type Decor, hash } from "../engine/decor";
import { groundHeight, moundEdge, sampleKind, shoulderWidth } from "../engine/layout";
import type { Track } from "../engine/Track";

export interface RiderView {
  def: CharacterDef;
  s: number;
  lat: number;
  y: number;
  airborne: boolean;
  trick: TrickId | null;
  trickT: number;
  crashT: number;
  crashSide: number;
  crouch: number;
  lean: number;
}

export interface Particle2 {
  x: number;
  y: number;
  z: number;
  life: number;
  max: number;
  r: number;
}

interface Drawable {
  depth: number;
  draw: () => void;
}

const COL = {
  sky: ["#f0cf8a", "#f3d9a2", "#f2e2bd", "#efe6ce"],
  sun: "#c76520",
  far: "#b3a46e",
  near: "#88823c",
  lake: "#2f6f8f",
  grassA: "#9db04e",
  grassB: "#93a747",
  lane: ["#c9925a", "#bd8650"],
  wood: ["#b8823f", "#a2702f"],
  chips: ["#8d5b31", "#7d4f2a"],
  top: "#c9a27a",
  gravelL: "#e3d9c0",
  gravelR: "#c3b697",
  startGrassL: "#a7bb58",
  startGrassR: "#839b3f",
  ink: "#704916",
  dark: "#2b2116",
  red: "#c62f22",
  white: "#f6f0e2",
};

function tone(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * k) | 0;
  const g = Math.min(255, ((n >> 8) & 255) * k) | 0;
  const b = Math.min(255, (n & 255) * k) | 0;
  return `rgb(${r},${g},${b})`;
}

/** Ombrage pose en 3 niveaux (aplats) */
const level = (v: number) => (v > 0.06 ? 1.12 : v < -0.06 ? 0.84 : 1);

export class PosterRenderer {
  readonly decor: Decor;
  private grain: HTMLCanvasElement;
  cam = { x: 0, y: 3, z: 0, h: 0, pitch: 0.16, s: 0 };
  private W = 1;
  private F = 1;
  private yh = 0;
  private cosP = 1;
  private sinP = 0;
  private fx = 0;
  private fz = -1;
  private rx = 1;
  private rz = 0;

  constructor(private track: Track) {
    this.decor = placeDecor(track);
    this.grain = document.createElement("canvas");
    this.grain.width = this.grain.height = 180;
    const g = this.grain.getContext("2d")!;
    const im = g.createImageData(180, 180);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.random() * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 22;
    }
    g.putImageData(im, 0, 0);
  }

  /** Projette un point monde -> ecran. z = profondeur camera (<= 0 : derriere) */
  proj(x: number, y: number, z: number) {
    const dx = x - this.cam.x;
    const dz = z - this.cam.z;
    const up = y - this.cam.y;
    const depth = dx * this.fx + dz * this.fz;
    const lat = dx * this.rx + dz * this.rz;
    const dC = depth * this.cosP - up * this.sinP;
    const uC = depth * this.sinP + up * this.cosP;
    return { x: this.W / 2 + (lat * this.F) / dC, y: this.yh - (uC * this.F) / dC, d: dC };
  }

  render(
    g: CanvasRenderingContext2D,
    W: number,
    H: number,
    o: { riders: RiderView[]; time: number; excitement: number; speedK: number; zoom: number; particles: Particle2[]; shake: number },
  ) {
    const c = this.cam;
    this.W = W;

    this.F = W * 1.05 * o.zoom;
    this.cosP = Math.cos(c.pitch);
    this.sinP = Math.sin(c.pitch);
    this.fx = -Math.sin(c.h);
    this.fz = -Math.cos(c.h);
    this.rx = Math.cos(c.h);
    this.rz = -Math.sin(c.h);
    const shakeX = (Math.random() - 0.5) * o.shake * W * 0.03;
    const shakeY = (Math.random() - 0.5) * o.shake * W * 0.03;
    g.save();
    g.translate(shakeX, shakeY);
    // Ligne d'horizon a 30 % de la hauteur
    this.yh = H * 0.3 + this.F * Math.tan(c.pitch);
    const horizon = this.yh - this.F * Math.tan(c.pitch);

    this.drawSky(g, horizon);
    // Sol de base (herbe)
    g.fillStyle = COL.grassA;
    g.fillRect(-20, horizon, W + 40, H - horizon + 40);

    const items: Drawable[] = [];
    this.buildTrack(items);
    this.buildSprites(items, o.time, o.excitement);
    for (const r of o.riders) this.buildRider(items, r);
    for (const p of o.particles) {
      const q = this.proj(p.x, p.y, p.z);
      if (q.d < 0.4) continue;
      items.push({
        depth: q.d - 0.05,
        draw: () => {
          g.fillStyle = `rgba(214,190,150,${0.55 * (p.life / p.max)})`;
          g.beginPath();
          g.arc(q.x, q.y, (p.r * this.F) / q.d, 0, Math.PI * 2);
          g.fill();
        },
      });
    }
    items.sort((a, b) => b.depth - a.depth);
    for (const it of items) it.draw.call(this);

    // Lignes de vitesse sur les bords
    if (o.speedK > 0.02) {
      g.strokeStyle = `rgba(246,240,226,${0.35 * o.speedK})`;
      g.lineCap = "round";
      g.lineWidth = Math.max(1.5, W * 0.004);
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        const ph = (o.time * (1.4 + hash(i) * 1.2) + hash(i * 3)) % 1;
        const a = (hash(i * 7) - 0.5) * 1.2 + (side > 0 ? 0 : Math.PI);
        const r0 = W * (0.35 + ph * 0.6);
        const cx = W / 2;
        const cy = horizon + H * 0.12;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 1.3);
        g.lineTo(cx + Math.cos(a) * (r0 + W * 0.12 * o.speedK), cy + Math.sin(a) * (r0 + W * 0.12 * o.speedK) * 1.3);
        g.stroke();
      }
    }
    g.restore();

    // Grain papier + vignette
    g.fillStyle = g.createPattern(this.grain, "repeat")!;
    g.fillRect(0, 0, W, H);
    const vg = g.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.85);
    vg.addColorStop(0, "rgba(60,30,10,0)");
    vg.addColorStop(1, "rgba(60,30,10,0.28)");
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
  }

  // ------------------------------------------------------------------ ciel
  private drawSky(g: CanvasRenderingContext2D, horizon: number) {
    const W = this.W;
    const n = COL.sky.length;
    COL.sky.forEach((col, i) => {
      g.fillStyle = col;
      g.fillRect(-20, (horizon * i) / n - 2, W + 40, horizon / n + 4);
    });
    // Soleil : direction fixe dans le monde (devant, un peu a droite au depart)
    const sunAz = 0.45;
    let da = sunAz - this.cam.h;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) < 1.3) {
      const sx = W / 2 - Math.tan(da) * this.F * 0.55;
      g.fillStyle = COL.sun;
      g.beginPath();
      g.arc(sx, horizon * 0.48, W * 0.12, 0, Math.PI * 2);
      g.fill();
    }
    // Luberon : deux couches, parallaxe selon le cap
    const ridge = (base: number, amp: number, col: string, seed: number, par: number) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-20, horizon + 2);
      const off = this.cam.h * W * par;
      for (let x = -20; x <= W + 20; x += W / 30) {
        const u = (x + off) / W;
        const y = base - amp * (0.55 + 0.45 * Math.sin(u * 4.1 + seed) * Math.cos(u * 1.7 + seed * 2));
        g.lineTo(x, y);
      }
      g.lineTo(W + 20, horizon + 2);
      g.closePath();
      g.fill();
    };
    ridge(horizon - 2, horizon * 0.3, COL.far, 1.3, 0.6);
    ridge(horizon, horizon * 0.17, COL.near, 4.1, 1.0);
    g.fillStyle = COL.lake;
    g.fillRect(-20, horizon - Math.max(3, horizon * 0.035), W + 40, Math.max(3, horizon * 0.035));
  }

  // ------------------------------------------------------------------ piste
  private buildTrack(items: Drawable[]) {
    const t = this.track;
    const e = moundEdge(t);
    const w = t.laneWidth;
    const c1 = t.laneCenter(-1);
    const c2 = t.laneCenter(1);
    const sNear = Math.max(0, this.cam.s + 0.6);
    const sFar = Math.min(t.length, this.cam.s + 95);
    const P = { x: 0, z: 0 };
    type Sec = { s: number; pts: { x: number; y: number; d: number }[]; h: number[]; lats: number[]; kind: ReturnType<typeof sampleKind>; wood: boolean };
    const section = (s: number): Sec => {
      const sh = shoulderWidth(t, s);
      const lats = [-60, -(e + sh), -e, c1 - w / 2, c1, c1 + w / 2, c2 - w / 2, c2, c2 + w / 2, e, e + sh, 60];
      const h: number[] = [];
      const pts = lats.map((lat, i) => {
        t.posAt(s, lat, P);
        const y = i === 0 || i === lats.length - 1 ? 0 : groundHeight(t, s, lat);
        h.push(y);
        return this.proj(P.x, y, P.z);
      });
      return { s, pts, h, lats, kind: sampleKind(t, s), wood: t.wood[t.index(s)] === 1 };
    };
    const list: number[] = [];
    for (let s = sNear; s < sFar; ) {
      list.push(s);
      const d = s - this.cam.s;
      s += d < 25 ? 0.5 : d < 55 ? 1 : 1.8;
    }
    list.push(sFar);
    const secs = list.map(section);
    const g = () => this.ctx!;
    for (let i = secs.length - 1; i > 0; i--) {
      const far = secs[i];
      const near = secs[i - 1];
      if (near.pts.every((p) => p.d < 0.3)) continue;
      const ds = far.s - near.s;
      const sMid = (far.s + near.s) / 2;
      const stripe = Math.floor(sMid / 1.6) % 2;
      for (let b = 0; b < near.pts.length - 1; b++) {
        const a0 = near.pts[b], a1 = near.pts[b + 1], b0 = far.pts[b], b1 = far.pts[b + 1];
        if (a0.d < 0.3 || a1.d < 0.3 || b0.d < 0.3 || b1.d < 0.3) continue;
        const along = ((far.h[b] + far.h[b + 1]) - (near.h[b] + near.h[b + 1])) / (2 * ds);
        const across = ((near.h[b + 1] - near.h[b]) / Math.max(0.1, near.lats[b + 1] - near.lats[b]));
        let col: string;
        const kind = near.kind;
        if (b === 0 || b === near.pts.length - 2) col = Math.floor(sMid / 4) % 2 ? COL.grassA : COL.grassB;
        else if (b === 1) col = kind === "start" ? COL.startGrassL : COL.gravelL;
        else if (b === near.pts.length - 3) col = kind === "start" ? COL.startGrassR : COL.gravelR;
        else if (b === 3 || b === 4 || b === 6 || b === 7) {
          const pal = near.wood ? COL.wood : kind === "start" ? COL.chips : COL.lane;
          col = tone(near.wood ? pal[Math.floor(sMid / 0.3) % 2] : pal[stripe], level(along * 1.4) * level(-across * 0.6));
        } else col = tone(COL.top, level(along * 1.2));
        const depth = (a0.d + a1.d) / 2;
        items.push({
          depth: depth + 0.001 * (b === 0 || b === near.pts.length - 2 ? 1 : 0),
          draw: () => {
            const ctx = g();
            ctx.fillStyle = col;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a0.x, a0.y);
            ctx.lineTo(a1.x, a1.y);
            ctx.lineTo(b1.x, b1.y);
            ctx.lineTo(b0.x, b0.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          },
        });
      }
    }
    // Rubalise (bords exterieurs et separation centrale)
    const et = t.laneSpacing / 2 + w / 2 + 0.45;
    const jumps = t.features.filter((f) => f.kind === "jump");
    const inJump = (s: number) => jumps.some((f) => s > f.s - (f.jumpType === "kicker" ? 6 : 2.5) && s < (f.landEnd ?? f.s) + 0.5);
    for (const lat of [-et, 0, et]) {
      for (let s = Math.ceil(sNear / 2.5) * 2.5; s < Math.min(sFar, t.finishS + 10); s += 2.5) {
        if (s < t.startS + 1) continue;
        if (lat === 0 && (inJump(s) || inJump(s + 2.5) || s > t.finishS - 1)) continue;
        const pa = t.posAt(s, lat);
        const pb = t.posAt(s + 2.5, lat);
        const ha = groundHeight(t, s, lat);
        const hb = groundHeight(t, s + 2.5, lat);
        const a0 = this.proj(pa.x, ha + 0.95, pa.z), a1 = this.proj(pa.x, ha + 0.82, pa.z);
        const b0 = this.proj(pb.x, hb + 0.95, pb.z), b1 = this.proj(pb.x, hb + 0.82, pb.z);
        const base = this.proj(pa.x, ha, pa.z);
        if (a0.d < 0.4 || b0.d < 0.4) continue;
        const col = Math.floor(s / 2.5) % 2 ? COL.red : COL.white;
        items.push({
          depth: (a0.d + b0.d) / 2 - 0.02,
          draw: () => {
            const ctx = g();
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(a0.x, a0.y);
            ctx.lineTo(b0.x, b0.y);
            ctx.lineTo(b1.x, b1.y);
            ctx.lineTo(a1.x, a1.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = COL.white;
            ctx.lineWidth = Math.max(1, (0.05 * this.F) / a0.d);
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(a0.x, a0.y);
            ctx.stroke();
          },
        });
      }
    }
  }

  private ctx: CanvasRenderingContext2D | null = null;

  /** A appeler avant render() */
  bind(g: CanvasRenderingContext2D) {
    this.ctx = g;
  }

  // ------------------------------------------------------------------ decor
  private buildSprites(items: Drawable[], time: number, excitement: number) {
    const g = this.ctx!;
    const t = this.track;
    const d = this.decor;
    const add = (x: number, y: number, z: number, maxD: number, fn: (sx: number, sy: number, sc: number) => void) => {
      const q = this.proj(x, y, z);
      if (q.d < 0.6 || q.d > maxD) return;
      items.push({ depth: q.d, draw: () => fn(q.x, q.y, this.F / q.d) });
    };
    for (const l of d.landmarks) {
      add(l.x, 0, l.z, 160, (sx, sy, sc) => drawLandmark(g, l.kind, sx, sy, sc * l.s, l.seed));
    }
    if (d.pylon) {
      const p = d.pylon;
      add(p.x, 0, p.z, 260, (sx, sy, sc) => drawPylon(g, sx, sy, sc));
    }
    // Barrieres et baches
    for (const b of d.barriers) {
      add(b.x, 0, b.z, 70, (sx, sy, sc) => {
        g.fillStyle = b.banner ? COL.sun : "#a9aaa4";
        g.fillRect(sx - sc * 1.1, sy - sc * 1.0, sc * 2.2, sc * 1.0);
        if (b.banner && sc > 12) {
          g.fillStyle = "#efe6ce";
          g.font = `${Math.round(sc * 0.55)}px 'Squada One', Impact, sans-serif`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText("KABARE", sx, sy - sc * 0.5);
        }
      });
    }
    // Public
    const ex = Math.min(1.4, 0.15 + excitement * 0.8);
    for (const p of d.crowd) {
      const gy = 0;
      add(p.x, gy, p.z, 70, (sx, sy, sc) => {
        const k = ex * p.energy;
        const jump = Math.max(0, Math.sin(time * 9 + p.phase)) * Math.max(0, k - 0.4) * 0.25;
        const raise = Math.min(1, Math.max(0, k - 0.3 + Math.sin(time * 6 + p.phase) * 0.25));
        const y0 = sy - jump * sc;
        g.fillStyle = p.color;
        g.fillRect(sx - sc * 0.22, y0 - sc * 1.45, sc * 0.44, sc * 0.75);
        g.fillStyle = COL.dark;
        g.fillRect(sx - sc * 0.2, y0 - sc * 0.72, sc * 0.17, sc * 0.72);
        g.fillRect(sx + sc * 0.03, y0 - sc * 0.72, sc * 0.17, sc * 0.72);
        g.fillStyle = p.skin;
        g.beginPath();
        g.arc(sx, y0 - sc * 1.62, sc * 0.15, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = p.color;
        g.lineWidth = Math.max(1, sc * 0.1);
        g.lineCap = "round";
        for (const side of [-1, 1]) {
          g.beginPath();
          g.moveTo(sx + side * sc * 0.2, y0 - sc * 1.38);
          g.lineTo(sx + side * sc * (0.32 + 0.1 * raise), y0 - sc * (1.0 + 0.85 * raise));
          g.stroke();
        }
      });
    }
    // Arches de depart et d'arrivee
    for (const [s, text, checker] of [[t.startS - 1.2, "KABARE", false], [t.finishS, "ARRIVÉE", true]] as const) {
      const half = t.laneSpacing / 2 + t.laneWidth / 2 + 0.6;
      const h0 = t.heightAt(s);
      const L = t.posAt(s, -half);
      const R = t.posAt(s, half);
      const qa = this.proj(L.x, h0, L.z), qb = this.proj(R.x, h0, R.z);
      const ta = this.proj(L.x, h0 + 5.6, L.z), tb = this.proj(R.x, h0 + 5.6, R.z);
      const ba = this.proj(L.x, h0 + 4.7, L.z), bb = this.proj(R.x, h0 + 4.7, R.z);
      if (qa.d < 0.6 || qb.d < 0.6) continue;
      items.push({
        depth: (qa.d + qb.d) / 2 - 0.1,
        draw: () => {
          const sc = this.F / qa.d;
          g.strokeStyle = COL.ink;
          g.lineWidth = Math.max(2, sc * 0.25);
          g.beginPath();
          g.moveTo(qa.x, qa.y);
          g.lineTo(ta.x, ta.y);
          g.moveTo(qb.x, qb.y);
          g.lineTo(tb.x, tb.y);
          g.stroke();
          g.fillStyle = checker ? COL.dark : COL.sun;
          g.beginPath();
          g.moveTo(ta.x, ta.y);
          g.lineTo(tb.x, tb.y);
          g.lineTo(bb.x, bb.y);
          g.lineTo(ba.x, ba.y);
          g.closePath();
          g.fill();
          g.fillStyle = "#efe6ce";
          g.font = `${Math.round(Math.abs(ba.y - ta.y) * 0.75)}px 'Squada One', Impact, sans-serif`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(text, (ta.x + tb.x) / 2, (ta.y + ba.y) / 2 + 1);
        },
      });
    }
    // Ligne d'arrivee en damier
    {
      const s = t.finishS;
      const half = t.laneSpacing / 2 + t.laneWidth / 2;
      const n = 12;
      for (let i = 0; i < n; i++) {
        const l0 = -half + (i * 2 * half) / n;
        const l1 = l0 + (2 * half) / n;
        const pts = [
          t.posAt(s - 0.3, l0), t.posAt(s - 0.3, l1), t.posAt(s + 0.3, l1), t.posAt(s + 0.3, l0),
        ].map((p, k) => this.proj(p.x, groundHeight(t, k < 2 ? s - 0.3 : s + 0.3, k === 0 || k === 3 ? l0 : l1) + 0.03, p.z));
        if (pts.some((p) => p.d < 0.4)) continue;
        items.push({
          depth: (pts[0].d + pts[1].d) / 2 - 0.05,
          draw: () => {
            g.fillStyle = i % 2 ? COL.dark : COL.white;
            g.beginPath();
            pts.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
            g.closePath();
            g.fill();
          },
        });
      }
    }
  }

  // ------------------------------------------------------------------ riders
  private buildRider(items: Drawable[], r: RiderView) {
    const t = this.track;
    const p = t.posAt(r.s, r.lat);
    const gy = groundHeight(t, r.s, r.lat);
    const q = this.proj(p.x, r.y, p.z);
    const sh = this.proj(p.x, gy, p.z);
    if (q.d < 0.6) return;
    const g = this.ctx!;
    items.push({
      depth: q.d - 0.15,
      draw: () => {
        const sc = this.F / q.d;
        const hgt = Math.max(0, r.y - gy);
        g.fillStyle = `rgba(60,35,15,${Math.max(0.12, 0.35 - hgt * 0.05)})`;
        g.beginPath();
        g.ellipse(sh.x, sh.y, sc * 0.55, sc * 0.16, 0, 0, Math.PI * 2);
        g.fill();
        drawRider(g, q.x, q.y, sc, r);
      },
    });
  }
}

// =============================================================================
//  Silhouettes du decor (aplats)

function drawLandmark(g: CanvasRenderingContext2D, kind: string, sx: number, sy: number, sc: number, seed: number) {
  switch (kind) {
    case "pine": {
      g.fillStyle = "#5a3d24";
      g.fillRect(sx - sc * 0.22, sy - sc * 8, sc * 0.44, sc * 8);
      g.fillStyle = "#4f6a2a";
      g.beginPath();
      g.ellipse(sx + sc * 0.4, sy - sc * 8.6, sc * 4.6, sc * 1.6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#3d5521";
      g.beginPath();
      g.ellipse(sx + sc * 1.4, sy - sc * 8.2, sc * 3.2, sc * 1.1, 0, 0, Math.PI);
      g.fill();
      break;
    }
    case "poplar":
      g.fillStyle = "#5a3d24";
      g.fillRect(sx - sc * 0.18, sy - sc * 2.5, sc * 0.36, sc * 2.5);
      g.fillStyle = "#56782e";
      g.beginPath();
      g.ellipse(sx, sy - sc * 7.5, sc * 1.6, sc * 5.6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#44612a";
      g.beginPath();
      g.ellipse(sx + sc * 0.5, sy - sc * 7.5, sc * 1.0, sc * 5.2, 0, -Math.PI / 2, Math.PI / 2);
      g.fill();
      break;
    case "willow":
    case "round": {
      const light = kind === "willow" ? "#a3bf5a" : "#6f9238";
      const dark = kind === "willow" ? "#86a447" : "#587a2c";
      g.fillStyle = "#5a3d24";
      g.fillRect(sx - sc * 0.25, sy - sc * 3, sc * 0.5, sc * 3);
      g.fillStyle = light;
      g.beginPath();
      g.arc(sx, sy - sc * 4.6, sc * 2.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = dark;
      g.beginPath();
      g.arc(sx + sc * 0.9, sy - sc * 4.2, sc * 1.8, -1.2, 1.9);
      g.fill();
      break;
    }
    case "bush":
      g.fillStyle = "#5f8233";
      g.beginPath();
      g.ellipse(sx, sy - sc * 0.6, sc * 1.4, sc * 0.75, 0, Math.PI, 0);
      g.fill();
      break;
    case "van":
      g.fillStyle = "#f2efe6";
      g.fillRect(sx - sc * 2.2, sy - sc * 2.0, sc * 4.4, sc * 1.7);
      g.fillStyle = "#26323d";
      g.fillRect(sx - sc * 2.1, sy - sc * 1.85, sc * 0.9, sc * 0.6);
      g.fillStyle = COL.dark;
      for (const x of [-1.5, 1.4]) {
        g.beginPath();
        g.arc(sx + sc * x, sy - sc * 0.3, sc * 0.38, 0, Math.PI * 2);
        g.fill();
      }
      break;
  }
  void seed;
}

function drawPylon(g: CanvasRenderingContext2D, sx: number, sy: number, sc: number) {
  g.strokeStyle = COL.ink;
  g.lineWidth = Math.max(1, sc * 0.2);
  const H = 32 * sc;
  const base = 3.4 * sc;
  const top = 0.9 * sc;
  g.beginPath();
  g.moveTo(sx - base, sy);
  g.lineTo(sx - top, sy - H * 0.75);
  g.lineTo(sx, sy - H);
  g.lineTo(sx + top, sy - H * 0.75);
  g.lineTo(sx + base, sy);
  for (let k = 1; k < 8; k++) {
    const y = sy - (H * 0.75 * k) / 8;
    const w = base + ((top - base) * k) / 8;
    const y2 = sy - (H * 0.75 * (k - 1)) / 8;
    const w2 = base + ((top - base) * (k - 1)) / 8;
    g.moveTo(sx - w, y);
    g.lineTo(sx + w, y);
    g.moveTo(sx - w2, y2);
    g.lineTo(sx + w, y);
  }
  for (const [y, w] of [[21, 9], [26.5, 7]]) {
    g.moveTo(sx - w * sc, sy - y * sc);
    g.lineTo(sx + w * sc, sy - y * sc);
  }
  g.stroke();
  // Cables
  g.lineWidth = Math.max(1, sc * 0.05);
  for (const [y, w] of [[19.2, 8.7], [24.7, 6.7]]) {
    for (const x of [-w, w]) {
      g.beginPath();
      g.moveTo(sx + x * sc, sy - y * sc);
      g.quadraticCurveTo(sx + x * sc * 6, sy - y * sc * 0.6, sx + x * sc * 40, sy - y * sc * 1.2);
      g.stroke();
    }
  }
}

// =============================================================================
//  Rider vu de dos (silhouette affiche)

function drawRider(g: CanvasRenderingContext2D, sx: number, sy: number, sc: number, r: RiderView) {
  const o = r.def.outfit;
  const suit = r.def.model === "suit-laptop";
  const t = Math.min(1, Math.max(0, r.trickT));
  const ease = t * t * (3 - 2 * t);
  const w = Math.sin(Math.PI * t);
  g.save();
  g.translate(sx, sy);
  g.scale(sc, sc);
  // Inclinaison dans les virages / chute
  let rot = -r.lean * 0.35;
  if (r.crashT > 0) rot = r.crashSide * Math.min(1, r.crashT * 2.2) * 1.4;
  g.rotate(rot);
  // Figures : on tourne autour du centre de gravite (1 m)
  g.translate(0, -1);
  if (r.trick === "frontflip" || r.trick === "backflip") {
    const c = Math.cos(ease * Math.PI * 2);
    g.scale(1, Math.abs(c) < 0.05 ? 0.05 : c);
  }
  if (r.trick === "threesixty") {
    const c = Math.cos(ease * Math.PI * 2);
    g.scale(Math.abs(c) < 0.08 ? 0.08 : c, 1);
  }
  let bikeRot = 0;
  let wheelX = 0;
  if (r.trick === "tabletop") bikeRot = 1.25 * w;
  if (r.trick === "tbog") bikeRot = -0.4 * w;
  if (r.trick === "tailwhip") wheelX = Math.sin(ease * Math.PI * 2) * 0.9;
  g.translate(0, 1);

  // Velo : roue arriere vue de dos, garde-boue et selle
  g.save();
  g.translate(0, -0.55);
  g.rotate(bikeRot);
  g.translate(0, 0.55);
  g.fillStyle = COL.dark;
  roundRect(g, -0.07 + wheelX, -0.72, 0.14, 0.72, 0.07);
  g.fillStyle = o.bike;
  g.fillRect(-0.05 + wheelX * 0.6, -0.95, 0.1, 0.3);
  g.fillStyle = COL.dark;
  g.fillRect(-0.4, -1.12, 0.8, 0.05);
  g.restore();

  const crouch = r.crouch * 0.12;
  // Jambes
  g.strokeStyle = o.pants;
  g.lineCap = "round";
  g.lineWidth = 0.15;
  let legs: [number, number][] = [[-0.22, -0.42], [0.22, -0.42]];
  if (r.trick === "superman") legs = [[-0.15, -0.1 + 0.3 * w], [0.15, -0.1 + 0.3 * w]];
  if (r.trick === "nofootcan") legs = [[0.25 + 0.5 * w, -0.6], [0.35 + 0.6 * w, -0.5]];
  if (r.trick === "tbog") legs = [[-0.22 + 0.55 * w, -0.5], [0.22, -0.42]];
  for (const [lx, ly] of legs) {
    g.beginPath();
    g.moveTo(Math.sign(lx || 1) * 0.12, -1.0 + crouch);
    g.lineTo(lx, ly);
    g.stroke();
  }
  // Dos
  g.fillStyle = o.jersey;
  g.beginPath();
  g.ellipse(0, -1.3 + crouch, 0.27, 0.33, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(0,0,0,0.18)";
  g.beginPath();
  g.ellipse(0.1, -1.3 + crouch, 0.17, 0.32, 0, -Math.PI / 2, Math.PI / 2);
  g.fill();
  if (suit) {
    g.fillStyle = "#c9ccd1";
    g.fillRect(-0.38, -1.42 + crouch, 0.09, 0.36);
  } else {
    g.fillStyle = "#ffffff";
    g.fillRect(-0.27, -1.36 + crouch, 0.54, 0.06);
  }
  // Bras
  g.strokeStyle = o.jersey;
  g.lineWidth = 0.1;
  let hands: [number, number][] = [[-0.4, -1.1], [0.4, -1.1]];
  if (r.trick === "suicide") hands = [[-0.4 - 0.45 * w, -1.1 - 0.35 * w], [0.4 + 0.45 * w, -1.1 - 0.35 * w]];
  for (const [hx, hy] of hands) {
    g.beginPath();
    g.moveTo(Math.sign(hx) * 0.22, -1.5 + crouch);
    g.lineTo(hx, hy);
    g.stroke();
  }
  // Tete
  if (suit) {
    g.fillStyle = o.skin;
    g.beginPath();
    g.arc(0, -1.78 + crouch, 0.14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.helmet;
    g.beginPath();
    g.arc(0, -1.8 + crouch, 0.14, Math.PI, 0);
    g.fill();
  } else {
    g.fillStyle = o.helmet;
    g.beginPath();
    g.arc(0, -1.8 + crouch, 0.17, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.jersey;
    g.fillRect(-0.17, -1.86 + crouch, 0.34, 0.05);
  }
  g.restore();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.fill();
}
