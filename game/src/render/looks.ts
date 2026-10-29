// Motifs des tenues (leopard, fleurs, camouflage, cambouis...) peints dans la forme en cours (clip).
// Utilise par l'ecran de choix (studio) et par le rider en course.

import type { Pattern } from "../data/types";

/** Pseudo-aleatoire stable (meme motif a chaque image) */
function rnd(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Peint un motif dans le rectangle (x, y, w, h). A appeler apres g.clip() sur la forme du vetement.
 * `u` = taille d'un motif (en unites du dessin courant).
 */
export function paintPattern(
  g: CanvasRenderingContext2D,
  p: Pattern,
  base: string,
  accent: string,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
) {
  const n = Math.max(4, Math.min(160, Math.round(((w * h) / (u * u)) * 1.4)));
  g.save();
  switch (p) {
    case "leopard": {
      for (let i = 0; i < n; i++) {
        const cx = x + rnd(i) * w;
        const cy = y + rnd(i + 50) * h;
        const r = u * (0.28 + rnd(i + 99) * 0.18);
        g.fillStyle = "#3a2410";
        g.beginPath();
        g.ellipse(cx, cy, r, r * 0.8, rnd(i + 7) * 3, 0.3, Math.PI * 1.7);
        g.lineWidth = r * 0.45;
        g.strokeStyle = "#2a1a0c";
        g.stroke();
        g.fillStyle = "#b9772b";
        g.beginPath();
        g.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "flowers": {
      for (let i = 0; i < n * 0.6; i++) {
        const cx = x + rnd(i) * w;
        const cy = y + rnd(i + 50) * h;
        const r = u * (0.25 + rnd(i + 3) * 0.15);
        g.fillStyle = i % 3 === 0 ? "#ffffff" : accent;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + rnd(i);
          g.beginPath();
          g.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.42, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = "#e8613c";
        g.beginPath();
        g.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "camo": {
      const cols = [accent, "#7b7a4a", "#2e3320"];
      for (let i = 0; i < n * 0.8; i++) {
        g.fillStyle = cols[i % cols.length];
        const cx = x + rnd(i) * w;
        const cy = y + rnd(i + 50) * h;
        g.beginPath();
        g.ellipse(cx, cy, u * (0.4 + rnd(i + 5) * 0.4), u * (0.22 + rnd(i + 6) * 0.2), rnd(i + 8) * 3, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "grease": {
      g.fillStyle = "rgba(15,12,10,0.75)";
      for (let i = 0; i < n * 0.35; i++) {
        const cx = x + rnd(i) * w;
        const cy = y + rnd(i + 50) * h;
        const r = u * (0.15 + rnd(i + 2) * 0.35);
        g.beginPath();
        g.ellipse(cx, cy, r * 1.4, r, rnd(i + 4) * 3, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "rainbow": {
      const cols = ["#e84a5f", "#ff9a3c", "#f9d423", "#4cd964", "#2c9cf0", "#9b59d0"];
      const band = h / cols.length;
      cols.forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(x, y + i * band, w, band + 0.5);
      });
      break;
    }
    case "pinstripe": {
      g.strokeStyle = accent;
      g.globalAlpha = 0.35;
      g.lineWidth = u * 0.06;
      for (let sx = x; sx < x + w; sx += u * 0.5) {
        g.beginPath();
        g.moveTo(sx, y);
        g.lineTo(sx, y + h);
        g.stroke();
      }
      break;
    }
    case "pixel": {
      g.fillStyle = accent;
      for (let i = 0; i < n * 0.25; i++) {
        const cx = x + Math.floor((rnd(i) * w) / (u * 0.3)) * u * 0.3;
        const cy = y + Math.floor((rnd(i + 50) * h) / (u * 0.3)) * u * 0.3;
        g.fillRect(cx, cy, u * 0.3, u * 0.3);
      }
      break;
    }
  }
  g.restore();
  void base;
}
