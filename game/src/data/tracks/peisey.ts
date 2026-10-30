import type { TrackDef } from "../types";

// Dual de Peisey-Vallandry (Savoie, 73), d'apres les videos embarquees de Kylian.
// Piste quasiment toute en herbe, large, delimitee a la rubalise : ce sont les trajectoires qui
// comptent. Gros mouvements de terrain, un seul saut (kick en bois), et sur les 20 derniers metres
// en ligne droite les deux lignes se rejoignent en une seule jusqu'a l'arrivee, en bas de la station.
//  0 depart a cote de la residence | 1 pente | 2 courbe gauche | 3 grosses bosses de terrain
//  4 courbe droite | 6 kick en bois | 8 grande courbe gauche | 9 bosses | 10 courbe droite
//  11 gros dos d'ane | 12 courbe gauche | 13 ligne droite commune (les deux lignes se rejoignent) | 14 arrivee
export const peisey: TrackDef = {
  id: "peisey-vallandry",
  name: "Dual de Peisey-Vallandry",
  place: "Savoie (73)",
  laneWidth: 3.6,
  laneSpacing: 6.2,
  hypeToFill: 90,
  terrain: "slope",
  mergeLast: 20,
  modules: [
    /* 0 */ { type: "start", length: 16, drop: 3 },
    /* 1 */ { type: "straight", length: 10, slope: 0.12 },
    /* 2 */ { type: "berm", angle: 55, radius: 15, bank: 0.6, slope: 0.1 },
    /* 3 */ { type: "rollers", count: 2, height: 1.2, spacing: 13, slope: 0.09 },
    /* 4 */ { type: "berm", angle: -75, radius: 13, bank: 0.7, slope: 0.09 },
    /* 5 */ { type: "straight", length: 8, slope: 0.08 },
    /* 6 */ {
      type: "kicker",
      material: "wood",
      height: 1.1,
      length: 3,
      gap: 2.8,
      landing: { height: 0.9, up: 0.8, top: 1.0, down: 7 },
    },
    /* 7 */ { type: "straight", length: 6, slope: 0.06 },
    /* 8 */ { type: "berm", angle: 95, radius: 12, bank: 0.8, slope: 0.08 },
    /* 9 */ { type: "rollers", count: 3, height: 1.0, spacing: 12, slope: 0.07 },
    /* 10 */ { type: "berm", angle: -70, radius: 15, bank: 0.6, slope: 0.07 },
    /* 11 */ { type: "rollers", count: 1, height: 1.5, spacing: 15, slope: 0.05 },
    /* 12 */ { type: "berm", angle: 40, radius: 18, bank: 0.4, slope: 0.05 },
    /* 13 */ { type: "straight", length: 30, slope: 0.035 },
    /* 14 */ { type: "finish", length: 25, slope: 0.015 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.5 },
    { fromModule: 6, toModule: 6, side: 0, density: 0.6 },
    { fromModule: 13, toModule: 14, side: 0, density: 1 },
  ],
  decor: {
    palette: { lane: ["#a9a15a", "#9d9852"], top: "#8fae49", gravelL: "#9bb550", gravelR: "#86a344" },
    mountains: { far: "#7f93a6", near: "#6a8a52", height: 1.6, snow: true },
    gondola: { nearModule: 13, side: 1, distance: 16 },
    landmarks: [
      // Residences de la station (grands chalets) au depart et le long de la piste
      { kind: "chalet", nearModule: 0, along: 4, side: -1, distance: 5, s: 2.2 },
      { kind: "chalet", nearModule: 1, along: 6, side: -1, distance: 9, s: 2.0 },
      { kind: "chalet", nearModule: 4, along: 8, side: 1, distance: 18, s: 2.4 },
      { kind: "chalet", nearModule: 7, along: 2, side: -1, distance: 14, s: 2.2 },
      { kind: "chalet", nearModule: 9, along: 10, side: 1, distance: 20, s: 2.0 },
      { kind: "chalet", nearModule: 11, along: 6, side: -1, distance: 16, s: 2.4 },
      { kind: "chalet", nearModule: 13, along: 6, side: -1, distance: 12, s: 1.8 },
      { kind: "chalet", nearModule: 14, along: 8, side: 1, distance: 10, s: 1.6 },
      { kind: "chalet", nearModule: 14, along: 16, side: -1, distance: 9, s: 1.7 },
      // Quelques sapins et un bouleau
      { kind: "spruce", nearModule: 2, along: 8, side: 1, distance: 12, s: 1.2 },
      { kind: "spruce", nearModule: 5, along: 2, side: -1, distance: 10 },
      { kind: "poplar", nearModule: 10, along: 4, side: -1, distance: 4, s: 0.9 },
      { kind: "spruce", nearModule: 12, along: 10, side: 1, distance: 14, s: 1.2 },
      // Piquets / drapeaux le long du parcours et a l'arrivee
      { kind: "flag", nearModule: 2, along: 4, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 4, along: 6, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 8, along: 8, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 10, along: 6, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 14, along: 1, side: 1, distance: 0.6 },
      { kind: "flag", nearModule: 14, along: 1, side: -1, distance: 0.6 },
    ],
    sky: { top: "#3b8ad9", horizon: "#d6ecf7" },
  },
  map: { x: 0.78, y: 0.64, grass: "#8fae49" },
};
