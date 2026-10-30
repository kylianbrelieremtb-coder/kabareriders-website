import type { TrackDef } from "../types";

// Dual du Cran'Kabare (Luberon), d'apres les videos embarquees et la description de Kylian.
// Piste en terre rouge dans le sous-bois, entre les vignes ; gros modules enchaines.
// Distances un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart en foret | 1 legerement a droite | 2 marche de 1,20 m, reception qui tourne a gauche (40)
//  4 step down 5 m (cailloux, un arbre de chaque cote), 7 m apres | 6 virage releve gauche (40)
//  7 gros roller (1,20 m) | 9 table 1,5 m | 11 virage 180 | 13 canadienne en bois
//  15 roller, trou, roller | 16-17 roller + virage gauche 90 court | 18 legere descente | 19 deux hoops
//  21 petite marche de 50 cm (gap) | 23 kick 60 cm et hip a gauche (45) | 24 arrivee
export const crankabare: TrackDef = {
  id: "crankabare",
  name: "Dual du Cran'Kabare",
  place: "Luberon (84)",
  laneWidth: 2.8,
  laneSpacing: 4.8,
  hypeToFill: 90,
  terrain: "slope",
  modules: [
    /* 0 */ { type: "start", length: 14, drop: 3.2 },
    /* 1 */ { type: "berm", angle: -10, radius: 45, bank: 0, slope: 0.08 },
    /* 2 */ { type: "drop", height: 1.2, deck: 2.5, landing: 9, landingDrop: 1.6, turn: 40 },
    /* 3 */ { type: "straight", length: 7, slope: 0.04 },
    /* 4 */ {
      type: "kicker",
      height: 1.0,
      length: 2.8,
      gap: 4.6,
      landing: { height: 0.25, up: 0.3, top: 0.5, down: 5.5 },
    },
    /* 5 */ { type: "straight", length: 4, slope: 0.03 },
    /* 6 */ { type: "berm", angle: 40, radius: 11, bank: 1.4, slope: 0.03 },
    /* 7 */ { type: "rollers", count: 1, height: 1.2, spacing: 9, slope: 0.03 },
    /* 8 */ { type: "straight", length: 4, slope: 0.02 },
    /* 9 */ { type: "table", height: 1.5, up: 3.6, top: 5, down: 3.5 },
    /* 10 */ { type: "straight", length: 2, slope: 0.04 },
    /* 11 */ { type: "berm", angle: -180, radius: 9, bank: 2.2, slope: 0.07 },
    /* 12 */ { type: "straight", length: 4, slope: 0.03 },
    /* 13 */ {
      type: "kicker",
      material: "wood",
      height: 1.0,
      length: 2.6,
      gap: 2.2,
      landing: { height: 0.9, up: 0.6, top: 0.6, down: 6 },
    },
    /* 14 */ { type: "straight", length: 4, slope: 0.03 },
    /* 15 */ { type: "rollers", count: 2, height: 0.8, spacing: 6.2, slope: 0.025 },
    /* 16 */ { type: "rollers", count: 0.5, height: 0.8, spacing: 8, slope: 0.025 },
    /* 17 */ { type: "berm", angle: 90, radius: 7.5, bank: 1.8, slope: 0.03, rollerIn: { height: 0.8, spacing: 8 } },
    /* 18 */ { type: "straight", length: 6, slope: 0.17 },
    /* 19 */ { type: "rollers", count: 2, height: 0.6, spacing: 6.2, slope: 0.02 },
    /* 20 */ { type: "straight", length: 4, slope: 0.02 },
    /* 21 */ { type: "drop", height: 0.5, deck: 5, landing: 6, landingDrop: 0.4 },
    /* 22 */ { type: "straight", length: 3, slope: 0.02 },
    /* 23 */ {
      type: "kicker",
      height: 0.6,
      length: 2.2,
      gap: 3.5,
      landing: { height: 0.5, up: 0.4, top: 0.6, down: 6 },
      turn: 45,
    },
    /* 24 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.4 },
    { fromModule: 9, toModule: 9, side: 0, density: 0.6 },
    { fromModule: 23, toModule: 24, side: 0, density: 1 },
  ],
  decor: {
    palette: { lane: ["#9c5a38", "#8f5233"], top: "#7d6a3e", gravelL: "#8a7a4a", gravelR: "#76683e" },
    landmarks: [
      // Sous-bois : chenes et arbres nus couverts de lierre
      { kind: "round", nearModule: 0, along: 3, side: -1, distance: 2, s: 1.2 },
      { kind: "poplar", nearModule: 0, along: 8, side: 1, distance: 2.5, s: 1.2 },
      { kind: "round", nearModule: 1, along: 4, side: 1, distance: 3 },
      { kind: "poplar", nearModule: 1, along: 10, side: -1, distance: 2, s: 1.3 },
      { kind: "round", nearModule: 2, along: 4, side: -1, distance: 3, s: 1.1 },
      // Step down : un arbre de chaque cote
      { kind: "poplar", nearModule: 4, along: 3.5, side: -1, distance: 0.6, s: 1.2 },
      { kind: "poplar", nearModule: 4, along: 3.5, side: 1, distance: 0.6, s: 1.2 },
      { kind: "bush", nearModule: 4, along: 5, side: 1, distance: 3 },
      { kind: "round", nearModule: 6, along: 6, side: 1, distance: 5, s: 1.3 },
      { kind: "poplar", nearModule: 7, along: 2, side: -1, distance: 4, s: 1.2 },
      { kind: "round", nearModule: 11, along: 10, side: 1, distance: 6, s: 1.2 },
      { kind: "poplar", nearModule: 13, along: 2, side: -1, distance: 3, s: 1.3 },
      { kind: "round", nearModule: 15, along: 4, side: 1, distance: 4 },
      // Camionnettes garees le long de la fin de piste
      { kind: "van", nearModule: 18, along: 2, side: -1, distance: 6 },
      { kind: "van", nearModule: 19, along: 4, side: -1, distance: 7 },
      { kind: "van", nearModule: 21, along: 2, side: -1, distance: 8 },
      { kind: "poplar", nearModule: 19, along: 2, side: 1, distance: 3, s: 1.2 },
      { kind: "round", nearModule: 23, along: 4, side: 1, distance: 4, s: 1.2 },
      { kind: "poplar", nearModule: 24, along: 6, side: 1, distance: 5, s: 1.2 },
    ],
    sky: { top: "#3b86d6", horizon: "#d9ebf5" },
  },
  map: { x: 0.84, y: 0.17, grass: "#8a9a48" },
};
