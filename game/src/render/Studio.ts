// Ecran de choix du perso : studio KABARE (fond beige, barnum KABARE), perso de face sans casque,
// avec son objet et le VTT d'enduro KABARE. On change de perso en glissant ou avec les fleches.

import type { CharacterDef, CharacterLook } from "../data/types";
import { paintPattern } from "./looks";

const C = {
  bgTop: "#f2e9d4",
  bgBottom: "#e6d7b6",
  floor: "#dccaa5",
  floorLine: "#cdb88f",
  ocre: "#c76520",
  ocreDark: "#9c4d16",
  marron: "#704916",
  beige: "#efe6ce",
  ink: "#2a1a0c",
  metal: "#9aa0a6",
  tire: "#211a14",
};

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export class Studio {
  private g: CanvasRenderingContext2D;
  private running = false;
  private t0 = 0;
  private slideT = 1;
  private slideDir = 1;
  private prev = -1;
  private down: { x: number; id: number } | null = null;
  index = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private chars: CharacterDef[],
    private onChange: (c: CharacterDef) => void,
  ) {
    this.g = canvas.getContext("2d")!;
    canvas.addEventListener("pointerdown", (e) => (this.down = { x: e.clientX, id: e.pointerId }));
    canvas.addEventListener("pointerup", (e) => {
      if (!this.down || this.down.id !== e.pointerId) return;
      const dx = e.clientX - this.down.x;
      this.down = null;
      if (Math.abs(dx) > 35) this.step(dx < 0 ? 1 : -1);
    });
    canvas.addEventListener("pointercancel", () => (this.down = null));
  }

  select(id: string) {
    const i = this.chars.findIndex((c) => c.id === id);
    if (i >= 0) this.index = i;
  }

  step(dir: 1 | -1) {
    this.prev = this.index;
    this.index = (this.index + dir + this.chars.length) % this.chars.length;
    this.slideDir = dir;
    this.slideT = 0;
    this.onChange(this.chars[this.index]);
  }

  get current() {
    return this.chars[this.index];
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.t0 = performance.now();
    let last = this.t0;
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.slideT = Math.min(1, this.slideT + dt / 0.35);
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
    // Fond studio beige
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, C.bgTop);
    bg.addColorStop(1, C.bgBottom);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const floorY = h * 0.64;
    const k = Math.min(w / 2.5, (floorY - h * 0.12) / 2.95);
    // Sol du studio
    g.fillStyle = C.floor;
    g.fillRect(0, floorY, w, h - floorY);
    g.strokeStyle = C.floorLine;
    g.lineWidth = Math.max(1, k * 0.01);
    for (let i = -8; i <= 8; i++) {
      g.beginPath();
      g.moveTo(w / 2 + i * k * 0.5, floorY);
      g.lineTo(w / 2 + i * k * 1.6, h);
      g.stroke();
    }

    g.save();
    g.translate(w / 2, floorY);
    g.scale(k, k);
    drawBarnum(g);
    // Perso : glisse depuis le cote au changement
    const e = ease(this.slideT);
    if (this.prev >= 0 && e < 1) {
      g.save();
      g.globalAlpha = 1 - e;
      g.translate(-this.slideDir * e * 2.4, 0);
      drawSet(g, this.chars[this.prev], t);
      g.restore();
    }
    g.save();
    g.globalAlpha = this.prev >= 0 ? e : 1;
    g.translate(this.slideDir * (1 - e) * 2.4, 0);
    drawSet(g, this.chars[this.index], t);
    g.restore();
    g.restore();

    // Grain papier leger
    g.fillStyle = "rgba(60,30,10,0.05)";
    for (let i = 0; i < 260; i++) {
      const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * w;
      const y = (Math.sin(i * 47.3 + 1.3) * 0.5 + 0.5) * h;
      g.fillRect(x, y, 2, 2);
    }
  }
}

// ---------------------------------------------------------------- decor
function drawBarnum(g: CanvasRenderingContext2D) {
  const top = -2.75;
  // Toile du fond, logo
  g.fillStyle = "#f6efdd";
  g.fillRect(-1.5, top, 3.0, 1.7);
  g.fillStyle = C.marron;
  text(g, "KABARE", 0, top + 0.62, 0.36);
  g.fillStyle = C.ocre;
  text(g, "R I D E R S", 0, top + 0.86, 0.11);
  // Pieds du barnum
  g.fillStyle = C.metal;
  for (const x of [-1.55, 1.49]) g.fillRect(x, top, 0.06, -top);
  // Toit
  g.fillStyle = C.ocreDark;
  g.beginPath();
  g.moveTo(-1.75, top - 0.05);
  g.lineTo(0, top - 0.75);
  g.lineTo(1.75, top - 0.05);
  g.closePath();
  g.fill();
  g.fillStyle = C.ocre;
  g.beginPath();
  g.moveTo(-1.75, top - 0.05);
  g.lineTo(0, top - 0.75);
  g.lineTo(0, top - 0.05);
  g.closePath();
  g.fill();
  // Lambrequin avec le nom
  g.fillStyle = C.ocre;
  g.fillRect(-1.75, top - 0.08, 3.5, 0.32);
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.arc(-1.75 + 0.125 + i * 0.25, top + 0.24, 0.125, 0, Math.PI);
    g.fill();
  }
  g.fillStyle = C.beige;
  text(g, "KABARE  •  KABARE  •  KABARE", 0, top + 0.09, 0.24);
}

// ---------------------------------------------------------------- perso + velo
function drawSet(g: CanvasRenderingContext2D, def: CharacterDef, t: number) {
  const L = def.look;
  // Ombre au sol
  g.fillStyle = "rgba(80,50,20,0.22)";
  g.beginPath();
  g.ellipse(0.15, 0.02, 1.2, 0.09, 0, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.translate(0.1, 0);
  g.scale(0.88, 0.88);
  drawBike(g, def.outfit.bike);
  g.restore();
  if (!L) return;
  if (L.beside === "pc") drawPc(g, -0.95, t);
  drawCharacter(g, L, def.outfit.skin, t);
}

function drawBike(g: CanvasRenderingContext2D, color: string) {
  const r = 0.36;
  const rx = -0.45;
  const fx = 0.8;
  const wy = -r;
  // Roues
  for (const x of [rx, fx]) {
    g.strokeStyle = C.tire;
    g.lineWidth = 0.075;
    g.beginPath();
    g.arc(x, wy, r - 0.04, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#5a5a5a";
    g.lineWidth = 0.012;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI;
      g.beginPath();
      g.moveTo(x + Math.cos(a) * (r - 0.08), wy + Math.sin(a) * (r - 0.08));
      g.lineTo(x - Math.cos(a) * (r - 0.08), wy - Math.sin(a) * (r - 0.08));
      g.stroke();
    }
    g.fillStyle = "#777";
    g.beginPath();
    g.arc(x, wy, 0.04, 0, Math.PI * 2);
    g.fill();
  }
  // Cadre enduro
  const bb = { x: 0.08, y: -0.33 };
  const seat = { x: -0.05, y: -0.86 };
  const head = { x: 0.56, y: -0.9 };
  g.strokeStyle = color;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.lineWidth = 0.075;
  g.beginPath();
  g.moveTo(bb.x, bb.y);
  g.lineTo(head.x, head.y);
  g.moveTo(bb.x, bb.y);
  g.lineTo(seat.x, seat.y);
  g.lineTo(head.x - 0.02, head.y - 0.03);
  g.stroke();
  // Bras oscillant + amortisseur
  g.lineWidth = 0.055;
  g.beginPath();
  g.moveTo(bb.x, bb.y);
  g.lineTo(rx, wy);
  g.lineTo(seat.x + 0.02, seat.y + 0.12);
  g.stroke();
  g.strokeStyle = "#222";
  g.lineWidth = 0.05;
  g.beginPath();
  g.moveTo(bb.x + 0.03, bb.y - 0.12);
  g.lineTo(seat.x + 0.08, seat.y + 0.25);
  g.stroke();
  // Fourche, cintre, selle
  g.strokeStyle = "#1c1c1c";
  g.lineWidth = 0.05;
  g.beginPath();
  g.moveTo(head.x, head.y);
  g.lineTo(fx, wy);
  g.moveTo(head.x - 0.02, head.y);
  g.lineTo(head.x - 0.06, head.y - 0.14);
  g.lineTo(head.x + 0.08, head.y - 0.16);
  g.stroke();
  g.fillStyle = "#1c1c1c";
  g.beginPath();
  g.ellipse(seat.x - 0.04, seat.y - 0.03, 0.13, 0.035, -0.05, 0, Math.PI * 2);
  g.fill();
  // Logo KABARE sur le tube diagonal
  g.save();
  g.translate((bb.x + head.x) / 2, (bb.y + head.y) / 2);
  g.rotate(Math.atan2(head.y - bb.y, head.x - bb.x));
  g.fillStyle = C.beige;
  text(g, "KABARE", 0, 0.004, 0.075);
  g.restore();
}

function drawPc(g: CanvasRenderingContext2D, x: number, t: number) {
  // Tour gamer (qui "galere") avec ventilos RGB
  g.fillStyle = "#16161c";
  g.fillRect(x - 0.2, -0.62, 0.4, 0.62);
  g.fillStyle = "#2a2a34";
  g.fillRect(x - 0.17, -0.58, 0.34, 0.54);
  const cols = ["#ff3b6b", "#39ff88", "#3bb2ff"];
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = cols[(i + Math.floor(t * 3)) % 3];
    g.lineWidth = 0.025;
    g.beginPath();
    g.arc(x, -0.48 + i * 0.16, 0.06, 0, Math.PI * 2);
    g.stroke();
  }
  // Petite fumee : le PC rame
  g.fillStyle = "rgba(120,120,120,0.35)";
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.5 + i / 3) % 1;
    g.beginPath();
    g.arc(x + 0.12 + Math.sin(p * 6 + i) * 0.04, -0.66 - p * 0.35, 0.03 + p * 0.05, 0, Math.PI * 2);
    g.fill();
  }
}

// ---------------------------------------------------------------- perso de face
function drawCharacter(g: CanvasRenderingContext2D, L: CharacterLook, skin: string, t: number) {
  const H = L.height;
  const breathe = Math.sin(t * 2.2) * 0.006;
  const headR = 0.105;
  const headY = -H + headR * 1.08 - breathe;
  const neckY = headY + headR * 0.95;
  const shY = neckY + 0.05;
  const hipY = -H * 0.5;
  const kneeY = -H * 0.27;
  const shW = { slim: 0.18, normal: 0.2, curvy: 0.18, broad: 0.235 }[L.build];
  const hipW = { slim: 0.12, normal: 0.135, curvy: 0.185, broad: 0.15 }[L.build];
  const waistW = L.build === "curvy" ? 0.115 : hipW * 0.95;
  const legW = L.build === "curvy" ? 0.095 : 0.075;
  const u = 0.06;

  g.lineCap = "round";
  g.lineJoin = "round";

  // Cheveux longs derriere la tete
  if (L.hair.style === "medium") {
    g.fillStyle = L.hair.color;
    g.beginPath();
    g.moveTo(-headR * 1.15, headY - headR * 0.3);
    g.quadraticCurveTo(-headR * 1.6, shY + 0.12, -headR * 1.05, shY + 0.16);
    g.lineTo(headR * 1.05, shY + 0.16);
    g.quadraticCurveTo(headR * 1.6, shY + 0.12, headR * 1.15, headY - headR * 0.3);
    g.closePath();
    g.fill();
  }

  // ---- Jambes
  const legBottom = (side: number) => {
    const hx = side * hipW * 0.5;
    const fx = side * 0.1;
    return { hx, fx };
  };
  for (const side of [-1, 1]) {
    const { hx, fx } = legBottom(side);
    // Peau (jambes nues sous un short)
    g.strokeStyle = skin;
    g.lineWidth = legW;
    g.beginPath();
    g.moveTo(hx, hipY + 0.05);
    g.lineTo((hx + fx) / 2 + side * 0.01, kneeY);
    g.lineTo(fx, -0.06);
    g.stroke();
    // Vetement du bas
    const b = L.bottom;
    const endY = b.kind === "pants" ? -0.07 : b.kind === "hotpants" ? hipY + 0.09 : b.kind === "swim" ? hipY + 0.2 : hipY + 0.22;
    g.save();
    g.strokeStyle = b.color;
    g.lineWidth = legW + 0.025;
    g.beginPath();
    g.moveTo(hx, hipY + 0.02);
    const kx = (hx + fx) / 2 + side * 0.01;
    if (endY > kneeY) {
      g.lineTo(kx, kneeY);
      g.lineTo(fx + (kx - fx) * ((endY + 0.06) / (kneeY + 0.06)), endY);
    } else g.lineTo(hx + (kx - hx) * ((endY - hipY) / (kneeY - hipY)), endY);
    g.stroke();
    g.restore();
    // Chaussure
    g.fillStyle = L.shoes;
    g.beginPath();
    g.ellipse(fx + side * 0.015, -0.035, 0.065, 0.04, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Bassin
  const pelvis = () => {
    g.beginPath();
    g.moveTo(-waistW, hipY - 0.06);
    g.lineTo(waistW, hipY - 0.06);
    g.lineTo(hipW, hipY + 0.02);
    g.lineTo(hipW * 0.6, hipY + (L.bottom.kind === "hotpants" ? 0.09 : 0.12));
    g.lineTo(-hipW * 0.6, hipY + (L.bottom.kind === "hotpants" ? 0.09 : 0.12));
    g.lineTo(-hipW, hipY + 0.02);
    g.closePath();
  };
  g.fillStyle = L.bottom.color;
  pelvis();
  g.fill();
  if (L.bottom.pattern) {
    g.save();
    pelvis();
    g.clip();
    paintPattern(g, L.bottom.pattern, L.bottom.color, L.top.accent ?? "#fff", -hipW, hipY - 0.1, hipW * 2, 0.25, u);
    g.restore();
  }
  // Pantalon a motif : un peu de motif sur les jambes aussi
  if (L.bottom.pattern && L.bottom.kind === "pants") {
    for (const side of [-1, 1]) {
      const { hx, fx } = legBottom(side);
      g.save();
      g.beginPath();
      g.moveTo(hx - legW, hipY);
      g.lineTo(hx + legW, hipY);
      g.lineTo(fx + legW * 0.7, -0.07);
      g.lineTo(fx - legW * 0.7, -0.07);
      g.closePath();
      g.clip();
      paintPattern(g, L.bottom.pattern, L.bottom.color, L.top.accent ?? "#fff", Math.min(hx, fx) - legW, hipY, legW * 2 + Math.abs(hx - fx), -hipY, u);
      g.restore();
    }
  }

  // ---- Buste
  const top = L.top;
  const crop = top.kind === "crop";
  const torsoBottom = crop ? shY + (hipY - shY) * 0.42 : top.kind === "coat" ? kneeY + 0.04 : hipY - 0.02;
  if (crop) {
    // Ventre nu
    g.fillStyle = skin;
    g.beginPath();
    g.moveTo(-shW * 0.85, shY + 0.1);
    g.lineTo(shW * 0.85, shY + 0.1);
    g.quadraticCurveTo(waistW * 0.9, (shY + hipY) / 2, waistW, hipY - 0.05);
    g.lineTo(-waistW, hipY - 0.05);
    g.quadraticCurveTo(-waistW * 0.9, (shY + hipY) / 2, -shW * 0.85, shY + 0.1);
    g.fill();
  }
  const torso = () => {
    g.beginPath();
    g.moveTo(-shW, shY);
    g.quadraticCurveTo(0, shY - 0.03, shW, shY);
    const bw = top.kind === "coat" ? hipW + 0.06 : crop ? shW * 0.85 : waistW + 0.01;
    g.lineTo(bw, torsoBottom);
    g.lineTo(-bw, torsoBottom);
    g.closePath();
  };
  if (top.kind !== "none") {
    // Salopette : t-shirt dessous
    g.fillStyle = top.kind === "overalls" ? top.accent ?? "#eee" : top.color;
    torso();
    g.fill();
    if (top.kind === "overalls") {
      g.fillStyle = top.color;
      g.fillRect(-waistW * 0.75, shY + 0.12, waistW * 1.5, hipY - shY - 0.1);
      g.strokeStyle = top.color;
      g.lineWidth = 0.035;
      g.beginPath();
      g.moveTo(-waistW * 0.65, shY + 0.13);
      g.lineTo(-shW * 0.6, shY + 0.01);
      g.moveTo(waistW * 0.65, shY + 0.13);
      g.lineTo(shW * 0.6, shY + 0.01);
      g.stroke();
    }
    if (top.pattern) {
      g.save();
      torso();
      g.clip();
      paintPattern(g, top.pattern, top.color, top.accent ?? "#fff", -shW - 0.05, shY - 0.05, shW * 2 + 0.1, torsoBottom - shY + 0.1, u);
      g.restore();
    }
    // Details par type de haut
    if (top.kind === "suit" || top.kind === "coat") {
      // Revers en V, chemise blanche, cravate
      g.fillStyle = top.kind === "suit" ? "#f4f1ea" : top.accent ?? "#111";
      g.beginPath();
      g.moveTo(-0.07, shY - 0.01);
      g.lineTo(0.07, shY - 0.01);
      g.lineTo(0, shY + 0.2);
      g.closePath();
      g.fill();
      if (top.kind === "suit") {
        g.fillStyle = top.accent ?? "#c62f22";
        g.beginPath();
        g.moveTo(-0.018, shY + 0.01);
        g.lineTo(0.018, shY + 0.01);
        g.lineTo(0.026, shY + 0.17);
        g.lineTo(0, shY + 0.2);
        g.lineTo(-0.026, shY + 0.17);
        g.closePath();
        g.fill();
      } else {
        // Grosse ceinture du manteau de defile
        g.fillStyle = top.accent ?? "#111";
        g.fillRect(-hipW - 0.02, hipY - 0.06, hipW * 2 + 0.04, 0.04);
      }
    } else if (top.kind === "shirt") {
      g.fillStyle = skin;
      g.beginPath();
      g.moveTo(-0.06, shY - 0.01);
      g.lineTo(0.06, shY - 0.01);
      g.lineTo(0, shY + 0.16);
      g.closePath();
      g.fill();
    } else if (top.kind === "hoodie") {
      g.fillStyle = shade(top.color, 0.8);
      g.fillRect(-waistW * 0.6, hipY - 0.16, waistW * 1.2, 0.09);
      g.strokeStyle = "#ddd";
      g.lineWidth = 0.008;
      g.beginPath();
      g.moveTo(-0.03, shY + 0.01);
      g.lineTo(-0.035, shY + 0.12);
      g.moveTo(0.03, shY + 0.01);
      g.lineTo(0.035, shY + 0.12);
      g.stroke();
    } else if (top.kind === "jacket" && top.accent && !top.pattern) {
      // Bandes (haute visibilite pour le paysagiste) / poches de photographe
      g.fillStyle = top.accent;
      g.fillRect(-waistW - 0.01, hipY - 0.13, waistW * 2 + 0.02, 0.035);
      g.fillRect(-shW + 0.01, shY + 0.15, shW * 2 - 0.02, 0.03);
    }
  }

  // ---- Sacoche en bandouliere
  if (L.bag) {
    g.strokeStyle = shade(L.bag.color, 1.3);
    g.lineWidth = 0.022;
    g.beginPath();
    g.moveTo(-shW * 0.7, shY);
    g.lineTo(hipW + 0.02, hipY);
    g.stroke();
    g.fillStyle = L.bag.color;
    const bw = L.bag.kind === "camerabag" ? 0.26 : 0.17;
    const bh = L.bag.kind === "camerabag" ? 0.2 : 0.14;
    g.fillRect(hipW - 0.04, hipY - 0.04, bw, bh);
    g.fillStyle = shade(L.bag.color, 1.5);
    g.fillRect(hipW - 0.04, hipY - 0.04, bw, 0.04);
  }

  // ---- Bras
  const sleeveLen = crop ? 0 : top.kind === "shirt" || top.kind === "tshirt" ? 0.45 : top.kind === "overalls" ? 0.4 : 1;
  const armCol = top.kind === "overalls" ? top.accent ?? "#eee" : top.color;
  const hand = handPose(L, shY, hipY, shW);
  const arm = (sx: number, ex: number, ey: number, hx: number, hy: number) => {
    // Peau en dessous, manche par-dessus
    g.strokeStyle = skin;
    g.lineWidth = 0.065;
    g.beginPath();
    g.moveTo(sx, shY + 0.03);
    g.lineTo(ex, ey);
    g.lineTo(hx, hy);
    g.stroke();
    if (sleeveLen > 0) {
      g.strokeStyle = armCol;
      g.lineWidth = 0.08;
      g.beginPath();
      g.moveTo(sx, shY + 0.03);
      if (sleeveLen >= 1) {
        g.lineTo(ex, ey);
        g.lineTo(hx + (ex - hx) * 0.15, hy + (ey - hy) * 0.15);
      } else g.lineTo(sx + (ex - sx) * sleeveLen * 2, shY + 0.03 + (ey - shY - 0.03) * sleeveLen * 2);
      g.stroke();
    }
    g.fillStyle = skin;
    g.beginPath();
    g.arc(hx, hy, 0.037, 0, Math.PI * 2);
    g.fill();
  };
  arm(-shW, hand.l.ex, hand.l.ey, hand.l.x, hand.l.y);
  arm(shW, hand.r.ex, hand.r.ey, hand.r.x, hand.r.y);

  // ---- Tete
  g.fillStyle = skin;
  g.fillRect(-0.035, headY + headR * 0.6, 0.07, neckY - headY);
  g.beginPath();
  g.ellipse(0, headY, headR * 0.86, headR, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(-headR * 0.86, headY + 0.01, 0.022, 0, Math.PI * 2);
  g.arc(headR * 0.86, headY + 0.01, 0.022, 0, Math.PI * 2);
  g.fill();
  // Visage
  if (L.glasses) {
    g.fillStyle = "#141414";
    g.beginPath();
    g.ellipse(-0.035, headY, 0.03, 0.022, 0, 0, Math.PI * 2);
    g.ellipse(0.035, headY, 0.03, 0.022, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-0.01, headY - 0.006, 0.02, 0.006);
  } else {
    g.fillStyle = C.ink;
    g.beginPath();
    g.arc(-0.033, headY, 0.009, 0, Math.PI * 2);
    g.arc(0.033, headY, 0.009, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = shade(skin, 0.6);
  g.lineWidth = 0.008;
  g.beginPath();
  g.arc(0, headY + 0.035, 0.025, 0.2, Math.PI - 0.2);
  g.stroke();
  drawHair(g, L, headY, headR);
  drawHeadwear(g, L, headY, headR);

  // ---- Objet en main (par-dessus)
  drawProp(g, L, hand, t);
}

interface HandPose {
  l: { x: number; y: number; ex: number; ey: number };
  r: { x: number; y: number; ex: number; ey: number };
}

function handPose(L: CharacterLook, shY: number, hipY: number, shW: number): HandPose {
  const hang = (side: number) => ({ x: side * (shW + 0.05), y: hipY + 0.04, ex: side * (shW + 0.05), ey: (shY + hipY) / 2 });
  const chest = (side: number, dx = 0.07, dy = 0.18) => ({ x: side * dx, y: shY + dy, ex: side * (shW + 0.06), ey: shY + 0.24 });
  switch (L.prop) {
    case "phone":
      return { l: hang(-1), r: { x: shW + 0.02, y: shY - 0.12, ex: shW + 0.12, ey: shY + 0.12 } };
    case "cocktail":
      return { l: hang(-1), r: chest(1, 0.13, 0.15) };
    case "controller":
    case "camera":
      return { l: chest(-1, 0.07, 0.2), r: chest(1, 0.07, 0.2) };
    case "plan":
      return { l: hang(-1), r: { x: shW + 0.03, y: (shY + hipY) / 2 + 0.03, ex: shW + 0.08, ey: shY + 0.17 } };
    default:
      return { l: hang(-1), r: hang(1) };
  }
}

function drawProp(g: CanvasRenderingContext2D, L: CharacterLook, hand: HandPose, t: number) {
  const r = hand.r;
  switch (L.prop) {
    case "briefcase": {
      g.fillStyle = "#3b2414";
      g.fillRect(r.x - 0.16, r.y + 0.03, 0.32, 0.24);
      g.fillStyle = "#c9a35a";
      g.fillRect(r.x - 0.03, r.y + 0.12, 0.06, 0.025);
      g.strokeStyle = "#3b2414";
      g.lineWidth = 0.018;
      g.beginPath();
      g.arc(r.x, r.y + 0.03, 0.04, Math.PI, 0);
      g.stroke();
      break;
    }
    case "phone": {
      g.fillStyle = "#ff7ab8";
      g.fillRect(r.x - 0.035, r.y - 0.1, 0.07, 0.13);
      g.fillStyle = "#222";
      g.fillRect(r.x - 0.027, r.y - 0.092, 0.054, 0.114);
      // Petit flash de selfie
      if (Math.sin(t * 1.3) > 0.97) {
        g.fillStyle = "rgba(255,255,255,0.8)";
        g.beginPath();
        g.arc(r.x, r.y - 0.04, 0.09, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "cocktail": {
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.moveTo(r.x - 0.06, r.y - 0.12);
      g.lineTo(r.x + 0.06, r.y - 0.12);
      g.lineTo(r.x + 0.04, r.y + 0.04);
      g.lineTo(r.x - 0.04, r.y + 0.04);
      g.closePath();
      g.fill();
      g.fillStyle = "#ff8a3c";
      g.fillRect(r.x - 0.045, r.y - 0.06, 0.09, 0.09);
      g.strokeStyle = "#e84a5f";
      g.lineWidth = 0.008;
      g.beginPath();
      g.moveTo(r.x + 0.02, r.y - 0.02);
      g.lineTo(r.x + 0.07, r.y - 0.2);
      g.stroke();
      g.fillStyle = "#f2d36b";
      g.beginPath();
      g.moveTo(r.x + 0.07, r.y - 0.2);
      g.arc(r.x + 0.07, r.y - 0.2, 0.07, Math.PI * 1.1, Math.PI * 1.9);
      g.closePath();
      g.fill();
      break;
    }
    case "chainsaw": {
      g.save();
      g.translate(r.x, r.y);
      g.rotate(0.35);
      g.fillStyle = "#ef6c1a";
      g.fillRect(-0.07, -0.02, 0.17, 0.15);
      g.fillStyle = "#2a2a2a";
      g.fillRect(-0.04, -0.06, 0.1, 0.05);
      g.fillStyle = "#b9bec4";
      g.fillRect(0.0, 0.12, 0.05, 0.42);
      g.strokeStyle = "#444";
      g.lineWidth = 0.012;
      g.strokeRect(0.0, 0.12, 0.05, 0.42);
      g.restore();
      break;
    }
    case "controller": {
      const cx = (hand.l.x + r.x) / 2;
      const cy = r.y + 0.01;
      g.fillStyle = "#1a1a1f";
      g.beginPath();
      g.ellipse(cx - 0.06, cy, 0.06, 0.045, 0, 0, Math.PI * 2);
      g.ellipse(cx + 0.06, cy, 0.06, 0.045, 0, 0, Math.PI * 2);
      g.fill();
      g.fillRect(cx - 0.07, cy - 0.04, 0.14, 0.06);
      g.fillStyle = "#39ff88";
      g.beginPath();
      g.arc(cx + 0.06, cy - 0.01, 0.01, 0, Math.PI * 2);
      g.arc(cx - 0.06, cy - 0.01, 0.01, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "camera": {
      const cx = (hand.l.x + r.x) / 2;
      const cy = r.y - 0.03;
      g.fillStyle = "#151515";
      g.fillRect(cx - 0.1, cy - 0.06, 0.2, 0.12);
      g.fillStyle = "#2b2b2b";
      g.beginPath();
      g.arc(cx, cy, 0.05, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#4a6a8a";
      g.beginPath();
      g.arc(cx, cy, 0.028, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#c76520";
      g.fillRect(cx - 0.09, cy - 0.055, 0.03, 0.015);
      break;
    }
    case "wrench": {
      g.save();
      g.translate(r.x, r.y);
      g.rotate(-0.25);
      g.fillStyle = "#9aa0a6";
      g.fillRect(-0.018, 0.0, 0.036, 0.3);
      g.beginPath();
      g.arc(0, 0.32, 0.05, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#dccaa5";
      g.fillRect(-0.015, 0.32, 0.03, 0.06);
      g.restore();
      break;
    }
    case "plan": {
      g.save();
      g.translate(r.x, r.y);
      g.rotate(-0.9);
      g.fillStyle = "#dfe9f2";
      g.fillRect(-0.04, -0.3, 0.08, 0.6);
      g.fillStyle = "#4a7bb0";
      g.fillRect(-0.04, -0.3, 0.08, 0.03);
      g.fillRect(-0.04, 0.27, 0.08, 0.03);
      g.strokeStyle = "#8fb0d0";
      g.lineWidth = 0.006;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(-0.04, i * 0.1);
        g.lineTo(0.04, i * 0.1 + 0.02);
        g.stroke();
      }
      g.restore();
      break;
    }
  }
}

function drawHair(g: CanvasRenderingContext2D, L: CharacterLook, y: number, r: number) {
  const c = L.hair.color;
  g.fillStyle = c;
  switch (L.hair.style) {
    case "messy": {
      g.beginPath();
      g.ellipse(0, y - r * 0.35, r * 0.95, r * 0.72, 0, Math.PI, 0);
      g.fill();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        g.beginPath();
        g.moveTo(Math.cos(a) * r * 0.8, y - r * 0.35 + Math.sin(a) * r * 0.6);
        g.lineTo(Math.cos(a - 0.15) * r * 1.15, y - r * 0.35 + Math.sin(a - 0.15) * r * 0.95);
        g.lineTo(Math.cos(a + 0.2) * r * 0.8, y - r * 0.35 + Math.sin(a + 0.2) * r * 0.6);
        g.fill();
      }
      // Meche sur le front
      g.beginPath();
      g.moveTo(-r * 0.6, y - r * 0.5);
      g.quadraticCurveTo(0, y - r * 0.1, r * 0.5, y - r * 0.55);
      g.lineTo(r * 0.7, y - r * 0.7);
      g.lineTo(-r * 0.7, y - r * 0.7);
      g.fill();
      break;
    }
    case "short":
    case "medium": {
      g.beginPath();
      g.ellipse(0, y - r * 0.3, r * 0.92, r * 0.78, 0, Math.PI, 0);
      g.fill();
      g.fillRect(-r * 0.9, y - r * 0.35, r * 0.18, r * 0.35);
      g.fillRect(r * 0.72, y - r * 0.35, r * 0.18, r * 0.35);
      if (L.hair.style === "medium") {
        // Frange
        g.beginPath();
        g.moveTo(-r * 0.85, y - r * 0.2);
        g.quadraticCurveTo(0, y - r * 0.55, r * 0.85, y - r * 0.2);
        g.lineTo(r * 0.85, y - r * 0.6);
        g.lineTo(-r * 0.85, y - r * 0.6);
        g.fill();
      }
      break;
    }
    case "buzz": {
      g.globalAlpha = 0.85;
      g.beginPath();
      g.ellipse(0, y - r * 0.25, r * 0.88, r * 0.78, 0, Math.PI * 1.05, Math.PI * 1.95);
      g.fill();
      g.globalAlpha = 1;
      break;
    }
    case "bald": {
      // Grosse calvitie : quelques cheveux sur les cotes
      g.beginPath();
      g.ellipse(-r * 0.85, y - r * 0.05, r * 0.14, r * 0.35, 0.2, 0, Math.PI * 2);
      g.ellipse(r * 0.85, y - r * 0.05, r * 0.14, r * 0.35, -0.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.beginPath();
      g.ellipse(-r * 0.25, y - r * 0.7, r * 0.2, r * 0.08, -0.3, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "clown": {
      // Coupe Bozo : dessus chauve, grosses touffes bouclees multicolores sur les cotes
      const cols = ["#e84a5f", "#ff9a3c", "#f9d423", "#4cd964", "#2c9cf0", "#9b59d0"];
      for (const side of [-1, 1]) {
        for (let i = 0; i < 9; i++) {
          g.fillStyle = cols[(i + (side > 0 ? 3 : 0)) % cols.length];
          const a = -0.9 + (i / 8) * 1.6;
          g.beginPath();
          g.arc(side * (r * 1.05 + Math.cos(a) * r * 0.35), y + Math.sin(a) * r * 0.75, r * 0.32, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.fillStyle = "rgba(255,255,255,0.3)";
      g.beginPath();
      g.ellipse(-r * 0.2, y - r * 0.7, r * 0.2, r * 0.08, -0.3, 0, Math.PI * 2);
      g.fill();
      break;
    }
  }
}

function drawHeadwear(g: CanvasRenderingContext2D, L: CharacterLook, y: number, r: number) {
  const hw = L.headwear;
  if (!hw) return;
  switch (hw.kind) {
    case "cap": {
      g.fillStyle = hw.color;
      g.beginPath();
      g.ellipse(0, y - r * 0.4, r * 0.95, r * 0.8, 0, Math.PI, 0);
      g.fill();
      g.fillStyle = shade(hw.color, 0.85);
      g.beginPath();
      g.ellipse(0, y - r * 0.38, r * 1.05, r * 0.2, 0, 0, Math.PI);
      g.fill();
      break;
    }
    case "beachhat": {
      g.fillStyle = hw.color;
      g.beginPath();
      g.ellipse(0, y - r * 0.55, r * 1.9, r * 0.28, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(0, y - r * 0.7, r * 0.85, r * 0.6, 0, Math.PI, 0);
      g.fill();
      g.fillStyle = "#e8613c";
      g.fillRect(-r * 0.85, y - r * 0.78, r * 1.7, r * 0.15);
      break;
    }
    case "forestry": {
      // Casque de debroussaillage : coque, visiere grillagee relevee, coquilles anti-bruit
      g.fillStyle = hw.color;
      g.beginPath();
      g.ellipse(0, y - r * 0.35, r * 1.05, r * 0.9, 0, Math.PI, 0);
      g.fill();
      g.fillRect(-r * 1.05, y - r * 0.4, r * 2.1, r * 0.12);
      g.fillStyle = "#3a3a3a";
      g.fillRect(-r * 1.15, y - r * 0.2, r * 0.25, r * 0.55);
      g.fillRect(r * 0.9, y - r * 0.2, r * 0.25, r * 0.55);
      g.strokeStyle = "#555";
      g.lineWidth = 0.006;
      const vy = y - r * 1.2;
      g.strokeRect(-r * 0.9, vy, r * 1.8, r * 0.38);
      for (let i = 1; i < 8; i++) {
        g.beginPath();
        g.moveTo(-r * 0.9 + (i * r * 1.8) / 8, vy);
        g.lineTo(-r * 0.9 + (i * r * 1.8) / 8, vy + r * 0.38);
        g.stroke();
      }
      break;
    }
  }
}

/** Texte centre, taille en metres (les polices minuscules sont mal rendues : on passe en pixels) */
function text(g: CanvasRenderingContext2D, str: string, x: number, y: number, size: number) {
  g.save();
  g.scale(0.01, 0.01);
  g.font = `${Math.round(size * 100)}px 'Squada One', Impact, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(str.toUpperCase(), x * 100, y * 100);
  g.restore();
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * k) | 0;
  const gg = Math.min(255, ((n >> 8) & 255) * k) | 0;
  const b = Math.min(255, (n & 255) * k) | 0;
  return `rgb(${r},${gg},${b})`;
}
