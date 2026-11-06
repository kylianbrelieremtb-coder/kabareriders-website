// Placement du decor commun aux rendus : arbres et objets, public, barrieres, pylone.

import type { Landmark } from "../data/types";
import { barrierLateral, moundEdge, shoulderWidth } from "./layout";
import type { Track } from "./Track";

export interface PlacedLandmark {
  kind: Landmark["kind"];
  x: number;
  z: number;
  s: number;
  rot: number;
  seed: number;
  /** Hauteur du terrain sous l'objet */
  y: number;
}

export interface CrowdPerson {
  x: number;
  y: number;
  z: number;
  rot: number;
  color: string;
  skin: string;
  phase: number;
  energy: number;
}

export interface Barrier {
  x: number;
  y: number;
  z: number;
  rot: number;
  banner: boolean;
}

export interface Decor {
  center: { x: number; z: number };
  landmarks: PlacedLandmark[];
  crowd: CrowdPerson[];
  barriers: Barrier[];
  pylon: { x: number; y: number; z: number; rot: number } | null;
  /** Telecabine : pylones (pied au sol) et hauteur des cables */
  gondola: { x: number; y: number; z: number }[];
}

export function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function placeDecor(t: Track): Decor {
  const def = t.def;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < t.n; i += 10) {
    minX = Math.min(minX, t.x[i]); maxX = Math.max(maxX, t.x[i]);
    minZ = Math.min(minZ, t.z[i]); maxZ = Math.max(maxZ, t.z[i]);
  }
  const center = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };

  // Arbres et objets
  const landmarks: PlacedLandmark[] = [];
  const centers: [number, number][] = [];
  for (let i = 0; i < t.n; i += 8) centers.push([t.x[i], t.z[i]]);
  const clear = (x: number, z: number, r: number) => centers.every(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 > r * r);
  def.decor.landmarks.forEach((l, i) => {
    let x: number;
    let z: number;
    let rot = hash(i) * 6;
    let y = 0;
    if (l.nearModule !== undefined) {
      const s = Math.min(t.length, t.moduleStarts[l.nearModule] + (l.along ?? 0));
      y = t.groundAt(s);
      const lat = (l.side ?? 1) * (barrierLateral(t, s) + (l.distance ?? 6));
      const p = t.posAt(s, lat);
      x = p.x;
      z = p.z;
      rot = t.headingAt(s);
    } else {
      x = center.x + (l.x ?? 0);
      z = center.z + (l.z ?? 0);
      if (!clear(x, z, 14)) return;
    }
    landmarks.push({ kind: l.kind, x, y, z, s: l.s ?? 1, rot, seed: i + 1 });
  });

  // Public et barrieres
  const crowd: CrowdPerson[] = [];
  const barriers: Barrier[] = [];
  const P = { x: 0, z: 0 };
  const shirts = ["#C76520", "#C2A833", "#704916", "#EFE6CE", "#2e6db4", "#d94f3d", "#3a3a3a", "#ffffff", "#7a9c3c", "#e0a030"];
  const skins = ["#f0c8a0", "#e7b98f", "#c68c5a", "#8d5a3a", "#f5d5b5"];
  let k = 0;
  for (const zone of def.crowd) {
    const s0 = Math.max(t.startS, t.moduleStarts[zone.fromModule]);
    const s1 = zone.toModule + 1 < t.moduleStarts.length ? t.moduleStarts[zone.toModule + 1] : t.length;
    for (const side of zone.side === 0 ? [-1, 1] : [zone.side]) {
      let bi = 0;
      for (let s = s0; s < s1; s += 2.3) {
        const lat = side * barrierLateral(t, s);
        t.posAt(s, lat, P);
        barriers.push({ x: P.x, y: t.groundAt(s), z: P.z, rot: t.headingAt(s), banner: bi++ % 4 === 1 });
      }
      for (let s = s0; s < s1; s += 1.6 / (zone.density ?? 1)) {
        const rows = hash(k) < 0.5 ? 1 : 2;
        for (let r = 0; r < rows; r++) {
          const lat = side * (barrierLateral(t, s) + 0.8 + r * 0.9 + hash(k * 3) * 0.4);
          t.posAt(s + hash(k * 5) * 0.6, lat, P);
          crowd.push({
            x: P.x,
            y: t.groundAt(s),
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

  let pylon: Decor["pylon"] = null;
  const d = def.decor;
  if (d.pylon) {
    const s = t.moduleStarts[d.pylon.nearModule] + 3;
    const lat = d.pylon.side * (moundEdge(t) + shoulderWidth(t, s) + d.pylon.distance);
    const p = t.posAt(s, lat);
    pylon = { x: p.x, y: t.groundAt(s), z: p.z, rot: t.headingAt(s) + 0.35 };
  }
  // Telecabine : ligne droite de pylones qui descend la pente, parallele a la piste pres d'un module
  const gondola: Decor["gondola"] = [];
  if (d.gondola) {
    const s0 = t.moduleStarts[d.gondola.nearModule];
    const lat = d.gondola.side * (moundEdge(t) + shoulderWidth(t, s0) + d.gondola.distance);
    const a = t.posAt(s0, lat);
    const h = t.headingAt(s0);
    const dx = -Math.sin(h);
    const dz = -Math.cos(h);
    for (let k = -3; k <= 3; k++) {
      const x = a.x + dx * k * 45;
      const z = a.z + dz * k * 45;
      const sNear = Math.max(0, Math.min(t.length, s0 + k * 45));
      gondola.push({ x, y: t.groundAt(sNear), z });
    }
  }
  return { center, landmarks, crowd, barriers, pylon, gondola };
}
