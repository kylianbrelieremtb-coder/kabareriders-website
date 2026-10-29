// Textures procedurales (canvas) : terre damee, gravier, herbe, planches, copeaux.
// Aucune image a charger, rendu proche des photos de la piste d'Apt.

import * as THREE from "three";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function finish(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return { c, g: c.getContext("2d")! };
}

/** Semis de petits cailloux */
function stones(g: CanvasRenderingContext2D, size: number, n: number, colors: string[], rMin: number, rMax: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    const x = r() * size;
    const y = r() * size;
    const rad = rMin + r() * (rMax - rMin);
    g.beginPath();
    g.ellipse(x, y, rad, rad * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
}

/** Terre damee gris-brun, avec cailloux et poussiere */
export function dirtTexture(): THREE.CanvasTexture {
  const size = 256;
  const { c, g } = canvas(size);
  g.fillStyle = "#8d7a63";
  g.fillRect(0, 0, size, size);
  const r = rng(7);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(178,160,132,0.18)" : "rgba(98,82,64,0.16)";
    g.beginPath();
    g.ellipse(r() * size, r() * size, 10 + r() * 30, 6 + r() * 18, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  stones(g, size, 900, ["#a8977c", "#73624d", "#c2b49c", "#5f5141"], 0.5, 1.6, 11);
  stones(g, size, 70, ["#d8d0c0", "#bfb5a3"], 1.2, 2.6, 12);
  return finish(c);
}

/** Gravier blanc-gris des bords de butte */
export function gravelTexture(): THREE.CanvasTexture {
  const size = 256;
  const { c, g } = canvas(size);
  g.fillStyle = "#b9b0a0";
  g.fillRect(0, 0, size, size);
  stones(g, size, 2600, ["#d9d3c7", "#a29886", "#8a8070", "#e9e5dc", "#c7bba6"], 0.8, 2.4, 21);
  stones(g, size, 120, ["#7a705f", "#f2efe8"], 2, 3.5, 22);
  return finish(c);
}

/** Herbe */
export function grassTexture(): THREE.CanvasTexture {
  const size = 256;
  const { c, g } = canvas(size);
  g.fillStyle = "#6f9b3e";
  g.fillRect(0, 0, size, size);
  const r = rng(31);
  for (let i = 0; i < 2600; i++) {
    const x = r() * size;
    const y = r() * size;
    const k = r();
    g.strokeStyle = k < 0.33 ? "#5b8a31" : k < 0.66 ? "#86b04c" : "#4f7a2a";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4);
    g.stroke();
  }
  return finish(c);
}

/** Planches de bois (kickers, depart) : v = sens de la pente */
export function woodTexture(): THREE.CanvasTexture {
  const size = 256;
  const { c, g } = canvas(size);
  const r = rng(41);
  const planks = 8;
  const ph = size / planks;
  for (let i = 0; i < planks; i++) {
    const base = 150 + Math.floor(r() * 40);
    g.fillStyle = `rgb(${base + 40},${base + 8},${base - 40})`;
    g.fillRect(0, i * ph, size, ph);
    // Veines
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(110,70,30,${0.08 + r() * 0.12})`;
      g.beginPath();
      const y = i * ph + r() * ph;
      g.moveTo(0, y);
      g.bezierCurveTo(size * 0.3, y + (r() - 0.5) * 6, size * 0.6, y + (r() - 0.5) * 6, size, y);
      g.stroke();
    }
    // Joint + clous
    g.fillStyle = "rgba(60,38,18,0.75)";
    g.fillRect(0, i * ph, size, 2);
    g.fillStyle = "#4b3a2a";
    for (const x of [14, size / 2, size - 14]) {
      g.fillRect(x, i * ph + 6, 3, 3);
      g.fillRect(x, i * ph + ph - 9, 3, 3);
    }
    // Traces de pneus / impacts
    for (let k = 0; k < 6; k++) {
      g.fillStyle = "rgba(70,50,30,0.25)";
      g.fillRect(r() * size, i * ph + r() * ph, 2 + r() * 5, 1 + r() * 2);
    }
  }
  return finish(c);
}

/** Copeaux de bois (zone de depart) */
export function chipsTexture(): THREE.CanvasTexture {
  const size = 256;
  const { c, g } = canvas(size);
  g.fillStyle = "#7a4a26";
  g.fillRect(0, 0, size, size);
  const r = rng(51);
  for (let i = 0; i < 6000; i++) {
    const k = r();
    g.fillStyle = k < 0.3 ? "#a8693a" : k < 0.6 ? "#5e381c" : k < 0.85 ? "#c08050" : "#3e2512";
    g.save();
    g.translate(r() * size, r() * size);
    g.rotate(r() * Math.PI);
    g.fillRect(-1.5, -0.5, 1.5 + r() * 2.5, 0.8 + r() * 1.2);
    g.restore();
  }
  return finish(c);
}

/** Canvas generique pour peindre le sol vu de dessus */
export function paintedTexture(size: number, paint: (g: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const { c, g } = canvas(size);
  paint(g, size);
  return finish(c, false);
}
