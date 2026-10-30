// Carte du monde : chaque piste est une ile volante, avec son trace dessine dessus.
// On touche une ile pour la choisir. Les pistes a venir sont des iles grisees « Bientôt ».

import type { TrackDef } from "../data/types";
import { Track } from "../engine/Track";

interface Island {
  id: string | null;
  name: string;
  place: string;
  x: number;
  y: number;
  grass: string;
  size: number;
  path: { x: number; y: number }[];
  seed: number;
}

/** Pistes prevues, affichees grisees */
const SOON = [
  { name: "Bonnieux", place: "Enduro (84)", x: 0.22, y: 0.28 },
  { name: "Courchevel", place: "The Cycling (73)", x: 0.5, y: 0.2 },
  { name: "Crankabare", place: "?", x: 0.84, y: 0.16 },
];

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export class WorldMap {
  private g: CanvasRenderingContext2D;
  private islands: Island[] = [];
  private running = false;
  private t0 = 0;
  selected: string;
  private hit: { i: number; x: number; y: number; r: number }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    tracks: TrackDef[],
    selected: string,
    private onPick: (id: string | null, name: string, place: string) => void,
  ) {
    this.g = canvas.getContext("2d")!;
    this.selected = selected;
    tracks.forEach((def, i) => {
      // Trace de la piste vu du dessus, normalise
      const t = new Track(def);
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (let k = 0; k < t.n; k += 6) {
        minX = Math.min(minX, t.x[k]); maxX = Math.max(maxX, t.x[k]);
        minZ = Math.min(minZ, t.z[k]); maxZ = Math.max(maxZ, t.z[k]);
      }
      const sc = Math.max(maxX - minX, maxZ - minZ) || 1;
      const path: { x: number; y: number }[] = [];
      for (let k = 0; k < t.n; k += 6) path.push({ x: (t.x[k] - (minX + maxX) / 2) / sc, y: (t.z[k] - (minZ + maxZ) / 2) / sc });
      const m = def.map ?? { x: 0.3 + i * 0.3, y: 0.5, grass: "#9db04e" };
      this.islands.push({ id: def.id, name: def.name, place: def.place, x: m.x, y: m.y, grass: m.grass, size: 1, path, seed: i + 1 });
    });
    SOON.forEach((s, i) => this.islands.push({ id: null, name: s.name, place: s.place, x: s.x, y: s.y, grass: "#b9b29a", size: 0.62, path: [], seed: 20 + i }));
    canvas.addEventListener("pointerup", (e) => this.onTap(e));
  }

  private onTap(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    const dpr = this.canvas.width / Math.max(1, r.width);
    const x = (e.clientX - r.left) * dpr;
    const y = (e.clientY - r.top) * dpr;
    let best: { i: number; d: number } | null = null;
    for (const h of this.hit) {
      const d = Math.hypot((x - h.x) / 1.6, y - h.y);
      if (d < h.r && (!best || d < best.d)) best = { i: h.i, d };
    }
    if (!best) return;
    const isl = this.islands[best.i];
    if (isl.id) this.selected = isl.id;
    this.onPick(isl.id, isl.name, isl.place);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.t0 = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.draw((now - this.t0) / 1000);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  private draw(t: number) {
    const cv = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(cv.clientWidth * dpr);
    const h = Math.round(cv.clientHeight * dpr);
    if (w < 2 || h < 2) return;
    if (cv.width !== w) cv.width = w;
    if (cv.height !== h) cv.height = h;
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    // Ciel beige -> bleu tres clair
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#cfe3ef");
    bg.addColorStop(0.55, "#efe6ce");
    bg.addColorStop(1, "#e8d6ae");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // Nuages qui derivent
    for (let i = 0; i < 9; i++) {
      const cx = ((rnd(i) * 1.4 + t * (0.008 + rnd(i + 3) * 0.01)) % 1.4 - 0.2) * w;
      const cy = (0.1 + rnd(i + 7) * 0.85) * h;
      const r = w * (0.05 + rnd(i + 9) * 0.05);
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.ellipse(cx, cy, r * 2.2, r * 0.7, 0, 0, Math.PI * 2);
      g.ellipse(cx + r, cy - r * 0.3, r * 1.2, r * 0.6, 0, 0, Math.PI * 2);
      g.fill();
    }
    this.hit = [];
    const base = Math.min(w * 0.15, h * 0.095);
    // Les iles du fond d'abord (petites et hautes)
    const order = this.islands.map((_, i) => i).sort((a, b) => this.islands[a].y - this.islands[b].y);
    for (const i of order) {
      const isl = this.islands[i];
      const sel = isl.id !== null && isl.id === this.selected;
      const R = base * isl.size * (sel ? 1.12 : 1);
      const x = isl.x * w;
      const y = isl.y * h + Math.sin(t * 1.1 + isl.seed * 1.7) * h * 0.008;
      this.drawIsland(g, isl, x, y, R, sel, t);
      this.hit.push({ i, x, y, r: R * 1.3 });
    }
  }

  private drawIsland(g: CanvasRenderingContext2D, isl: Island, x: number, y: number, R: number, sel: boolean, t: number) {
    const ry = R * 0.42;
    // Ombre portee lointaine
    g.fillStyle = "rgba(90,60,30,0.12)";
    g.beginPath();
    g.ellipse(x, y + R * 1.75, R * 0.8, R * 0.12, 0, 0, Math.PI * 2);
    g.fill();
    // Dessous rocheux (cone dechiquete)
    g.fillStyle = isl.id ? "#7a5634" : "#8f8676";
    g.beginPath();
    g.moveTo(x - R, y);
    const n = 9;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      const px = x - R + u * 2 * R;
      const depth = Math.sin(u * Math.PI) * R * (1.2 + rnd(isl.seed * 10 + k) * 0.35);
      g.lineTo(px, y + depth);
    }
    g.lineTo(x + R, y);
    g.closePath();
    g.fill();
    g.fillStyle = isl.id ? "#5e4127" : "#7a7262";
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k <= 5; k++) {
      const u = k / 5;
      g.lineTo(x + u * R, y + Math.sin((0.5 + u * 0.5) * Math.PI) * R * (1.25 + rnd(isl.seed * 7 + k) * 0.3) * (1 - u * 0.1));
    }
    g.lineTo(x + R, y);
    g.closePath();
    g.fill();
    // Racines qui pendent
    g.strokeStyle = isl.id ? "#4a331f" : "#6d6658";
    g.lineWidth = Math.max(1, R * 0.02);
    for (let k = 0; k < 4; k++) {
      const px = x - R * 0.6 + k * R * 0.4;
      g.beginPath();
      g.moveTo(px, y + R * 0.4);
      g.quadraticCurveTo(px + Math.sin(t + k) * R * 0.05, y + R * 0.8, px + R * 0.03, y + R * (0.9 + rnd(k + isl.seed) * 0.4));
      g.stroke();
    }
    // Plateau d'herbe
    g.fillStyle = isl.id ? "#5f7f2e" : "#9e977f";
    g.beginPath();
    g.ellipse(x, y + ry * 0.25, R, ry, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = isl.grass;
    g.beginPath();
    g.ellipse(x, y, R, ry, 0, 0, Math.PI * 2);
    g.fill();
    if (sel) {
      g.strokeStyle = "#c76520";
      g.lineWidth = Math.max(2, R * 0.05);
      g.beginPath();
      g.ellipse(x, y, R * 1.06, ry * 1.12, 0, 0, Math.PI * 2);
      g.stroke();
    }
    // Trace de la piste (terre) sur l'ile
    if (isl.path.length) {
      const sx = R * 0.95;
      const sy = ry * 0.95;
      for (const [col, lw] of [["#704916", R * 0.08], ["#c9925a", R * 0.05]] as const) {
        g.strokeStyle = col;
        g.lineWidth = lw;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.beginPath();
        isl.path.forEach((p, k) => (k ? g.lineTo(x + p.x * sx, y + p.y * sy) : g.moveTo(x + p.x * sx, y + p.y * sy)));
        g.stroke();
      }
      // Depart (drapeau) et arrivee (damier)
      const a = isl.path[0];
      const b = isl.path[isl.path.length - 1];
      g.fillStyle = "#c62f22";
      g.beginPath();
      g.arc(x + a.x * sx, y + a.y * sy, R * 0.05, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2b2116";
      g.fillRect(x + b.x * sx - R * 0.05, y + b.y * sy - R * 0.05, R * 0.1, R * 0.1);
    } else {
      g.fillStyle = "rgba(80,70,50,0.55)";
      g.font = `${Math.round(R * 0.5)}px 'Squada One', Impact, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("?", x, y);
    }
    // Petits arbres sur le bord
    for (let k = 0; k < 5; k++) {
      const a = rnd(isl.seed * 3 + k) * Math.PI * 2;
      const tx = x + Math.cos(a) * R * 0.82;
      const ty = y + Math.sin(a) * ry * 0.8;
      if (Math.sin(a) > 0.2) continue;
      g.fillStyle = isl.id ? "#3f6a2a" : "#857d68";
      g.beginPath();
      g.moveTo(tx - R * 0.07, ty);
      g.lineTo(tx, ty - R * 0.22);
      g.lineTo(tx + R * 0.07, ty);
      g.closePath();
      g.fill();
    }
    // Etiquette
    const label = isl.id ? isl.name.replace(/^Dual (du |de |d')/, "") : `${isl.name} · bientôt`;
    g.font = `${Math.round(Math.max(12, R * (isl.id ? 0.22 : 0.3)))}px 'Squada One', Impact, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const tw = g.measureText(label).width + R * 0.25;
    const ly = y + R * 1.5;
    g.fillStyle = isl.id ? (sel ? "#c76520" : "#704916") : "rgba(112,73,22,0.45)";
    roundRect(g, x - tw / 2, ly - R * 0.17, tw, R * 0.34, R * 0.17);
    g.fillStyle = "#efe6ce";
    g.fillText(label, x, ly + 1);
  }
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
  g.fill();
}
