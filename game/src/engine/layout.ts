// Gabarit de la butte autour des deux lignes (partage par le decor, le public et la rubalise).

import type { Track } from "./Track";

export type SampleKind = "start" | "wood" | "dirt";

/** Demi-largeur du plateau de la butte depuis l'axe central */
export function moundEdge(track: Track): number {
  return track.laneSpacing / 2 + track.laneWidth / 2 + 0.7;
}

export function sampleKind(track: Track, s: number): SampleKind {
  const m = track.def.modules[track.moduleAt(s)];
  if (m.type === "start") return "start";
  return track.wood[track.index(s)] === 1 ? "wood" : "dirt";
}

/** Hauteur du plateau : sous un kicker en bois, la butte reste au niveau du sol du module */
export function moundTop(track: Track, s: number): number {
  if (sampleKind(track, s) === "wood") return track.heightAt(track.moduleStarts[track.moduleAt(s)]);
  return track.heightAt(s);
}

/** Largeur horizontale du talus de chaque cote */
export function shoulderWidth(track: Track, s: number): number {
  const k = sampleKind(track, s);
  const h = Math.max(0, moundTop(track, s) - track.groundAt(s));
  if (k === "start") return h * 2.4 + 1.5; // butte de depart en herbe, en pente douce
  return h * 1.25 + 0.5;
}

/** Hauteur du sol a une position laterale (plateau, talus puis terrain) */
export function moundHeight(track: Track, s: number, lat: number): number {
  const h = moundTop(track, s);
  const g0 = track.groundAt(s);
  const e = moundEdge(track);
  const a = Math.abs(lat);
  if (a <= e) return h;
  const t = (a - e) / shoulderWidth(track, s);
  if (t >= 1) return g0;
  // Talus legerement bombe
  return g0 + (h - g0) * (1 - t * t * (3 - 2 * t));
}

/** Distance laterale des barrieres (au pied du talus) */
export function barrierLateral(track: Track, s: number): number {
  return moundEdge(track) + shoulderWidth(track, s) + 1.2;
}

/** Hauteur du sol a une position laterale : surface des lignes (avec devers) ou butte */
export function groundHeight(track: Track, s: number, lat: number): number {
  for (const lane of [-1, 1] as const) {
    const u = lat - track.laneCenter(lane);
    if (Math.abs(u) <= track.laneWidth / 2) return track.surfaceY(s, u);
  }
  return moundHeight(track, s, lat);
}
