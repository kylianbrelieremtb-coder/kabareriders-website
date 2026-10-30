import type { TrackDef } from "../types";

// Dual de Peisey-Vallandry (Savoie, 73), d'apres les videos embarquees et la description de Kylian.
// Piste quasiment toute en herbe, large, ou ce sont les trajectoires qui comptent ; un seul saut
// (les deux canadiennes en bois) ; sur les 10 derniers metres les deux lignes n'en font qu'une.
// Distances un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart, arche KABARE 5 m apres | 1 plongee raide legerement a droite | 2 petit virage 90 en terre
//  3 devers plat | 4 virage droite au piquet | 5 canadiennes en bois (reception dans la pente)
//  6 long virage droite progressif a plat | 7 replat | 8-10 grande descente tres raide : gauche, droit, droite
//  11 mouvements de terrain | 12 virage droite | 13 les deux lignes se rejoignent, sprint final | 14 arrivee
export const peisey: TrackDef = {
  id: "peisey-vallandry",
  name: "Dual de Peisey-Vallandry",
  place: "Savoie (73)",
  laneWidth: 3.6,
  laneSpacing: 6.2,
  hypeToFill: 90,
  terrain: "slope",
  mergeLast: 10,
  modules: [
    /* 0 */ { type: "start", length: 12, drop: 2.2 },
    /* 1 */ { type: "berm", angle: -12, radius: 45, bank: 0, slope: 0.2 },
    /* 2 */ { type: "berm", angle: 90, radius: 7.5, bank: 0.9, slope: 0.04 },
    /* 3 */ { type: "straight", length: 13, slope: 0.015 },
    /* 4 */ { type: "berm", angle: -60, radius: 12, bank: 0.3, slope: 0.04 },
    /* 5 */ {
      type: "kicker",
      material: "wood",
      height: 1.0,
      length: 2.8,
      gap: 3.4,
      landing: { height: 0.6, up: 0.4, top: 0.4, down: 7 },
    },
    /* 6 */ { type: "berm", angle: -75, radius: 19, bank: 0.3, slope: 0.02 },
    /* 7 */ { type: "straight", length: 8, slope: 0 },
    /* 8 */ { type: "berm", angle: 35, radius: 15, bank: 0.2, slope: 0.36 },
    /* 9 */ { type: "straight", length: 7, slope: 0.38 },
    /* 10 */ { type: "berm", angle: -35, radius: 15, bank: 0.2, slope: 0.32 },
    /* 11 */ { type: "rollers", count: 2, height: 0.9, spacing: 9.5, slope: 0.03 },
    /* 12 */ { type: "berm", angle: -60, radius: 13, bank: 0.4, slope: 0.03 },
    /* 13 */ { type: "straight", length: 24, slope: 0.02 },
    /* 14 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.5 },
    { fromModule: 5, toModule: 5, side: 0, density: 0.6 },
    { fromModule: 13, toModule: 14, side: 0, density: 1 },
  ],
  decor: {
    startArchAt: 5,
    palette: { lane: ["#a9a15a", "#9d9852"], top: "#8fae49", gravelL: "#9bb550", gravelR: "#86a344" },
    mountains: { far: "#7f93a6", near: "#6a8a52", height: 1.6, snow: true },
    gondola: { nearModule: 13, side: 1, distance: 16 },
    landmarks: [
      // Residences de la station (grands chalets) au depart et le long de la piste
      { kind: "chalet", nearModule: 0, along: 4, side: -1, distance: 5, s: 2.2 },
      { kind: "chalet", nearModule: 2, along: 2, side: 1, distance: 12, s: 2.0 },
      { kind: "chalet", nearModule: 4, along: 4, side: -1, distance: 16, s: 2.4 },
      { kind: "chalet", nearModule: 6, along: 10, side: 1, distance: 18, s: 2.2 },
      { kind: "chalet", nearModule: 9, along: 2, side: -1, distance: 18, s: 2.0 },
      { kind: "chalet", nearModule: 12, along: 4, side: 1, distance: 16, s: 2.4 },
      { kind: "chalet", nearModule: 13, along: 8, side: -1, distance: 12, s: 1.8 },
      { kind: "chalet", nearModule: 14, along: 8, side: 1, distance: 10, s: 1.6 },
      { kind: "chalet", nearModule: 14, along: 16, side: -1, distance: 9, s: 1.7 },
      // Quelques sapins et un bouleau
      { kind: "spruce", nearModule: 3, along: 6, side: 1, distance: 12, s: 1.2 },
      { kind: "spruce", nearModule: 7, along: 2, side: -1, distance: 10 },
      { kind: "poplar", nearModule: 11, along: 4, side: -1, distance: 4, s: 0.9 },
      // Piquets de virage dans l'herbe et drapeaux d'arrivee
      { kind: "flag", nearModule: 4, along: 5, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 8, along: 3, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 8, along: 7, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 10, along: 5, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 14, along: 1, side: 1, distance: 0.6 },
      { kind: "flag", nearModule: 14, along: 1, side: -1, distance: 0.6 },
    ],
    sky: { top: "#3b8ad9", horizon: "#d6ecf7" },
  },
  map: { x: 0.78, y: 0.64, grass: "#8fae49" },
};
