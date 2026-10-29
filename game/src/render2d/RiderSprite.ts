// Rider + VTT vus de dessus, dessines en vectoriel (unites : metres).
// Repere local : x = droite du rider, y = vers l'arriere (l'avant est vers -y).
// En l'air, le rider grossit et son ombre s'ecarte ; les figures se lisent par
// rotation (360, tailwhip), ecrasement (flips) et position des membres.

import type { TrickId } from "../config";
import type { CharacterDef } from "../data/types";
import { SHADOW } from "../render2d/Map2D";

export interface SpritePose {
  /** Hauteur au-dessus du sol (m) */
  height: number;
  heading: number;
  /** Inclinaison dans les virages (-1..1) */
  lean: number;
  crouch: number;
  trick: TrickId | null;
  trickT: number;
  crashT: number;
  crashSide: number;
}

const TAU = Math.PI * 2;

export class RiderSprite {
  private suit: boolean;
  private enduro: boolean;
  private o: CharacterDef["outfit"];

  constructor(def: CharacterDef) {
    this.suit = def.model === "suit-laptop";
    this.enduro = def.bike === "enduro";
    this.o = def.outfit;
  }

  draw(g: CanvasRenderingContext2D, x: number, z: number, p: SpritePose) {
    const t = Math.min(1, Math.max(0, p.trickT));
    const ease = t * t * (3 - 2 * t);
    const w = Math.sin(Math.PI * t);

    // ---------------------------------------------------------------- ombre
    g.save();
    g.translate(x + SHADOW.x * p.height, z + SHADOW.z * p.height);
    g.rotate(-p.heading);
    const spread = 1.3 * (1 + p.height * 0.06);
    g.fillStyle = `rgba(15,10,5,${Math.max(0.15, 0.42 - p.height * 0.05)})`;
    g.beginPath();
    g.ellipse(0, 0, 0.42 * spread, 0.95 * spread, 0, 0, TAU);
    g.fill();
    g.restore();

    // ---------------------------------------------------------------- rider
    g.save();
    g.translate(x, z);
    g.rotate(-p.heading);
    // Rider dessine un peu plus gros que nature pour la lisibilite sur telephone
    const sc = 1.3 * (1 + p.height * 0.1);
    g.scale(sc, sc);

    // Figures qui tournent ou retournent tout l'ensemble
    let flipCos = 1;
    if (p.trick === "threesixty") g.rotate(ease * TAU);
    if (p.trick === "frontflip" || p.trick === "backflip") {
      flipCos = Math.cos(ease * TAU);
      g.scale(1, flipCos === 0 ? 0.01 : flipCos);
    }
    if (p.crashT > 0) {
      const k = Math.min(1, p.crashT * 2);
      g.translate(p.crashSide * 0.5 * k, 0);
      g.rotate(p.crashSide * 1.3 * k);
    }

    // Velo : roulis (table top, T-bog) et tailwhip (l'arriere tourne autour de la douille)
    let roll = 0;
    if (p.trick === "tabletop") roll = 1.35 * w;
    if (p.trick === "tbog") roll = -0.45 * w;
    if (p.crashT > 0) roll = p.crashSide * Math.min(1, p.crashT * 2) * 1.4;
    const whip = p.trick === "tailwhip" ? ease * TAU : 0;
    this.drawBike(g, roll, whip);

    if (p.crashT > 0) g.translate(p.crashSide * Math.min(1, p.crashT * 2) * 0.7, 0.2);
    this.drawRider(g, p, w);
    if (flipCos < 0) {
      // Dessous visible pendant le flip : un peu plus sombre
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.beginPath();
      g.ellipse(0, 0, 0.45, 1, 0, 0, TAU);
      g.fill();
    }
    g.restore();
  }

  private drawBike(g: CanvasRenderingContext2D, roll: number, whip: number) {
    const tire = this.enduro ? 0.13 : 0.11;
    const r = 0.37;
    const side = Math.sin(roll); // 0 : vu de dessus, 1 : couche sur le cote
    const off = side * 0.42;
    const wheel = (cy: number) => {
      // Une roue vue de dessus = un pneu fin ; couchee = un cercle
      const rx = Math.max(tire / 2, Math.abs(side) * r);
      g.fillStyle = "#1a1a1a";
      g.beginPath();
      g.ellipse(off, cy, rx, r, 0, 0, TAU);
      g.fill();
      if (Math.abs(side) > 0.3) {
        g.fillStyle = "#777";
        g.beginPath();
        g.ellipse(off, cy, rx * 0.72, r * 0.72, 0, 0, TAU);
        g.fill();
        g.fillStyle = "#333";
        g.beginPath();
        g.ellipse(off, cy, rx * 0.15, r * 0.15, 0, 0, TAU);
        g.fill();
      }
    };
    // Avant fixe (roue, fourche, guidon)
    wheel(-0.62);
    // Arriere (peut tourner pour le tailwhip)
    g.save();
    g.translate(0, -0.45);
    g.rotate(whip);
    g.translate(0, 0.45);
    wheel(0.58);
    g.strokeStyle = this.o.bike;
    g.lineCap = "round";
    g.lineWidth = this.enduro ? 0.11 : 0.09;
    g.beginPath();
    g.moveTo(off * 0.8, -0.45);
    g.lineTo(off * 0.8, 0.5);
    g.stroke();
    // Selle
    g.fillStyle = "#151515";
    g.fillRect(off * 0.8 - 0.06, 0.12, 0.12, 0.26);
    g.restore();
    // Guidon
    g.strokeStyle = "#111";
    g.lineWidth = 0.045;
    const bw = (this.enduro ? 0.4 : 0.37) * Math.cos(roll);
    g.beginPath();
    g.moveTo(off * 0.8 - bw, -0.44);
    g.lineTo(off * 0.8 + bw, -0.44);
    g.stroke();
  }

  private drawRider(g: CanvasRenderingContext2D, p: SpritePose, w: number) {
    const o = this.o;
    const lean = p.lean * 0.18;
    const crouch = p.crouch;
    const trick = p.trick;
    g.lineCap = "round";
    // Jambes (cotes du cadre)
    let feet: [number, number][] = [[-0.17, 0.08], [0.17, 0.08]];
    if (trick === "superman") feet = [[-0.13, 0.08 + 0.95 * w], [0.13, 0.08 + 0.95 * w]];
    if (trick === "nofootcan") feet = [[0.17 + 0.45 * w, 0.0], [0.17 + 0.62 * w, 0.1]];
    if (trick === "tbog") feet = [[-0.17 + 0.5 * w, 0.06], [0.17, 0.08]];
    if (trick === "tailwhip") feet = [[-0.17 - 0.3 * w, 0.1], [0.17 + 0.3 * w, 0.1]];
    g.strokeStyle = o.pants;
    g.lineWidth = 0.13;
    for (const [fx, fy] of feet) {
      g.beginPath();
      g.moveTo(lean + Math.sign(fx || 1) * 0.1, 0.12);
      g.lineTo(fx + lean * 0.5, fy);
      g.stroke();
      g.fillStyle = this.suit ? "#5a3a1e" : "#1a1a1a";
      g.beginPath();
      g.ellipse(fx + lean * 0.5, fy - 0.04, 0.05, 0.1, 0, 0, TAU);
      g.fill();
    }
    // Bras vers le guidon (ou ecartes pour le suicide)
    let hands: [number, number][] = [[-0.36, -0.44], [0.36, -0.44]];
    if (trick === "suicide") hands = [[-0.36 - 0.3 * w, -0.44 + 0.55 * w], [0.36 + 0.3 * w, -0.44 + 0.55 * w]];
    if (trick === "superman") hands = [[-0.3, -0.48], [0.3, -0.48]];
    const shY = -0.12 - crouch * 0.05 + (trick === "superman" ? -0.1 * w : 0);
    g.strokeStyle = o.jersey;
    g.lineWidth = 0.085;
    for (const [hx, hy] of hands) {
      g.beginPath();
      g.moveTo(lean + Math.sign(hx) * 0.19, shY);
      g.lineTo(hx, hy);
      g.stroke();
      g.fillStyle = this.suit ? o.skin : "#1a1a1a";
      g.beginPath();
      g.arc(hx, hy, 0.045, 0, TAU);
      g.fill();
    }
    // Torse / epaules
    const bodyLen = trick === "superman" ? 0.3 + 0.25 * w : 0.24 - crouch * 0.04;
    g.fillStyle = o.jersey;
    g.beginPath();
    g.ellipse(lean, -0.02, 0.22, bodyLen, 0, 0, TAU);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.beginPath();
    g.ellipse(lean - 0.06, -0.08, 0.1, bodyLen * 0.6, 0, 0, TAU);
    g.fill();
    if (this.suit) {
      // Col de chemise + cravate, ordi sous le bras gauche
      g.fillStyle = "#f4f4f4";
      g.beginPath();
      g.moveTo(lean - 0.06, -0.2);
      g.lineTo(lean + 0.06, -0.2);
      g.lineTo(lean, -0.08);
      g.fill();
      g.fillStyle = "#c0281e";
      g.fillRect(lean - 0.015, -0.17, 0.03, 0.12);
      g.fillStyle = "#c9ccd1";
      g.fillRect(lean - 0.31, -0.12, 0.06, 0.32);
      g.fillStyle = "#ffffff";
      g.fillRect(lean - 0.295, 0.02, 0.03, 0.04);
    } else {
      g.fillStyle = "#ffffff";
      g.fillRect(lean - 0.22, -0.04, 0.44, 0.05);
    }
    // Tete : casque ou cheveux
    const hy = -0.2 - crouch * 0.04;
    if (this.suit) {
      g.fillStyle = o.skin;
      g.beginPath();
      g.arc(lean, hy, 0.12, 0, TAU);
      g.fill();
      g.fillStyle = o.helmet;
      g.beginPath();
      g.ellipse(lean, hy + 0.02, 0.12, 0.11, 0, 0, TAU);
      g.fill();
    } else {
      const grd = g.createRadialGradient(lean - 0.04, hy - 0.04, 0.02, lean, hy, 0.15);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(1, o.helmet);
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(lean, hy, 0.135, 0.15, 0, 0, TAU);
      g.fill();
      g.fillStyle = o.jersey;
      g.beginPath();
      g.ellipse(lean, hy - 0.13, 0.11, 0.05, 0, 0, TAU);
      g.fill();
    }
  }
}
