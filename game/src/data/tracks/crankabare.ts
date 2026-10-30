import type { TrackDef } from "../types";

// Dual du Cran'Kabare (Luberon), d'apres les videos embarquees et la description de Kylian.
// Piste en terre rouge dans le sous-bois, entre les vignes ; gros modules enchaines.
// Distances un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart en foret | 1 virage droite | 2 marche de 1,20 m qui tourne a gauche (40)
//  3 step down 5 m (cailloux, un arbre de chaque cote) | 4 virage releve gauche haut (40)
//  5 gros roller (1,20 m) | 6 table 1,5 m | 7 virage 180 qui commence dans la reception
//  8 canadienne en bois | 9 roller, trou, roller | 10-11 roller + virage gauche 90 court
//  12 legere descente | 13 deux hoops | 14 petite marche de 50 cm (gap) | 15 kick 60 cm et hip a gauche (45)
//  16 arrivee
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
    /* 1 */ { type: "berm", angle: -30, radius: 14, bank: 0.6, slope: 0.08 },
    /* 2 */ { type: "drop", height: 1.2, deck: 2.5, landing: 9, landingDrop: 1.6, turn: 40 },
    /* 3 */ {
      type: "kicker",
      height: 1.0,
      length: 2.8,
      gap: 4.6,
      landing: { height: 0.25, up: 0.3, top: 0.5, down: 5.5 },
    },
    /* 4 */ { type: "berm", angle: 40, radius: 11, bank: 2.6, slope: 0.03 },
    /* 5 */ { type: "rollers", count: 1, height: 1.2, spacing: 9, slope: 0.03 },
    /* 6 */ { type: "table", height: 1.5, up: 3.6, top: 5, down: 3.5 },
    /* 7 */ { type: "berm", angle: -180, radius: 9, bank: 2.4, slope: 0.07 },
    /* 8 */ {
      type: "kicker",
      material: "wood",
      height: 1.0,
      length: 2.6,
      gap: 2.2,
      landing: { height: 0.9, up: 0.6, top: 0.6, down: 6 },
    },
    /* 9 */ { type: "rollers", count: 2, height: 0.8, spacing: 5.2, slope: 0.025 },
    /* 10 */ { type: "rollers", count: 0.5, height: 0.8, spacing: 7.2, slope: 0.025 },
    /* 11 */ { type: "berm", angle: 90, radius: 7, bank: 1.8, slope: 0.03, rollerIn: { height: 0.8, spacing: 7.2 } },
    /* 12 */ { type: "straight", length: 5, slope: 0.2 },
    /* 13 */ { type: "rollers", count: 2, height: 0.6, spacing: 5.2, slope: 0.02 },
    /* 14 */ { type: "drop", height: 0.5, deck: 5, landing: 6, landingDrop: 0.4 },
    /* 15 */ {
      type: "kicker",
      height: 0.6,
      length: 2.2,
      gap: 3.5,
      landing: { height: 0.5, up: 0.4, top: 0.6, down: 6 },
      turn: 45,
    },
    /* 16 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.4 },
    { fromModule: 6, toModule: 6, side: 0, density: 0.6 },
    { fromModule: 15, toModule: 16, side: 0, density: 1 },
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
      { kind: "poplar", nearModule: 3, along: 3.5, side: -1, distance: 0.6, s: 1.2 },
      { kind: "poplar", nearModule: 3, along: 3.5, side: 1, distance: 0.6, s: 1.2 },
      { kind: "bush", nearModule: 3, along: 5, side: 1, distance: 3 },
      { kind: "round", nearModule: 4, along: 6, side: 1, distance: 5, s: 1.3 },
      { kind: "poplar", nearModule: 5, along: 2, side: -1, distance: 4, s: 1.2 },
      { kind: "round", nearModule: 7, along: 10, side: 1, distance: 6, s: 1.2 },
      { kind: "poplar", nearModule: 8, along: 2, side: -1, distance: 3, s: 1.3 },
      { kind: "round", nearModule: 9, along: 4, side: 1, distance: 4 },
      // Camionnettes garees le long de la fin de piste
      { kind: "van", nearModule: 12, along: 2, side: -1, distance: 6 },
      { kind: "van", nearModule: 13, along: 4, side: -1, distance: 7 },
      { kind: "van", nearModule: 14, along: 2, side: -1, distance: 8 },
      { kind: "poplar", nearModule: 13, along: 2, side: 1, distance: 3, s: 1.2 },
      { kind: "round", nearModule: 15, along: 4, side: 1, distance: 4, s: 1.2 },
      { kind: "poplar", nearModule: 16, along: 6, side: 1, distance: 5, s: 1.2 },
    ],
    sky: { top: "#3b86d6", horizon: "#d9ebf5" },
  },
  map: { x: 0.84, y: 0.17, grass: "#8a9a48" },
};
