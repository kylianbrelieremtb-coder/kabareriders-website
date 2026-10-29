import type { TrackDef } from "../types";

// Dual de Loudenvielle (Peyragudes, 65), d'apres les videos embarquees et la description de Kylian.
// Depart en foret, gros virages releves a 180 degres sous la telecabine, canadienne en bois,
// arche KABARE RIDERS puis drop de 1,5 m, virage du bas et slalom entre les piquets jusqu'a l'arrivee.
// Hauteurs reelles ; distances horizontales un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart en foret | 1 pente | 2 virage droite 180 en shark fin (kick dans la sortie, 3 m de trou)
//  3 quatre rollers 70 cm | 4 virage gauche 170 | 5 canadienne (kick bois, trou de 5 m)
//  6 trois rollers | 7 enorme virage releve 180 en descente | 8 arche KABARE | 9 drop 1,5 m
//  10 virage 90 du bas | 11-13 slalom entre trois piquets | 14 arrivee
export const loudenvielle: TrackDef = {
  id: "loudenvielle",
  name: "Dual de Loudenvielle",
  place: "Peyragudes (65)",
  laneWidth: 2.8,
  laneSpacing: 4.8,
  hypeToFill: 90,
  terrain: "slope",
  modules: [
    /* 0 */ { type: "start", length: 18, drop: 4.4 },
    /* 1 */ { type: "straight", length: 7, slope: 0.07 },
    /* 2 */ {
      type: "berm",
      angle: -180,
      radius: 10,
      bank: 2.2,
      slope: 0.03,
      exitKick: { height: 0.9, length: 2.8, gap: 3.6, landing: { height: 0.6, up: 0.5, top: 1.0, down: 6.5 } },
    },
    /* 3 */ { type: "rollers", count: 4, height: 0.7, spacing: 5.8, slope: 0.02 },
    /* 4 */ { type: "berm", angle: 170, radius: 9.5, bank: 2.2, slope: 0.02 },
    /* 5 */ {
      type: "kicker",
      material: "wood",
      height: 1.4,
      length: 3.2,
      gap: 5,
      landing: { height: 1.2, up: 0.8, top: 1.0, down: 6 },
    },
    /* 6 */ { type: "rollers", count: 3, height: 0.7, spacing: 5.8, slope: 0.02 },
    /* 7 */ { type: "berm", angle: -180, radius: 9, bank: 3.0, slope: 0.06 },
    /* 8 */ { type: "straight", length: 5, slope: 0.02 },
    /* 9 */ { type: "drop", height: 1.5, deck: 3, landing: 18, landingDrop: 5.4, turn: 20 },
    /* 10 */ { type: "berm", angle: -90, radius: 6.5, bank: 1.5 },
    /* 11 */ { type: "berm", angle: 20, radius: 16, bank: 0.25, slope: 0.01 },
    /* 12 */ { type: "berm", angle: -20, radius: 16, bank: 0.25, slope: 0.01 },
    /* 13 */ { type: "berm", angle: 20, radius: 16, bank: 0.25, slope: 0.01 },
    /* 14 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 1, side: 0, density: 0.6 },
    { fromModule: 7, toModule: 7, side: 0, density: 0.5 },
    { fromModule: 8, toModule: 14, side: 0, density: 1 },
  ],
  decor: {
    gondola: { nearModule: 7, side: 1, distance: 14 },
    archAtModule: 8,
    mountains: { far: "#8c9aa6", near: "#5d7a4a", height: 1.9, snow: true },
    landmarks: [
      // Depart en foret : grands feuillus et sapins des deux cotes
      { kind: "round", nearModule: 0, along: 2, side: -1, distance: 3, s: 1.3 },
      { kind: "poplar", nearModule: 0, along: 6, side: 1, distance: 3, s: 1.3 },
      { kind: "spruce", nearModule: 0, along: 10, side: -1, distance: 5, s: 1.2 },
      { kind: "round", nearModule: 0, along: 14, side: 1, distance: 2.5, s: 1.2 },
      { kind: "poplar", nearModule: 1, along: 1, side: -1, distance: 2.5, s: 1.4 },
      { kind: "spruce", nearModule: 1, along: 4, side: 1, distance: 4, s: 1.3 },
      { kind: "round", nearModule: 1, along: 6, side: -1, distance: 6, s: 1.1 },
      { kind: "poplar", nearModule: 2, along: 4, side: 1, distance: 3, s: 1.3 },
      { kind: "spruce", nearModule: 2, along: 12, side: -1, distance: 4, s: 1.2 },
      { kind: "round", nearModule: 2, along: 20, side: 1, distance: 5, s: 1.3 },
      { kind: "poplar", nearModule: 2, along: 28, side: -1, distance: 3, s: 1.2 },
      { kind: "spruce", nearModule: 3, along: 6, side: 1, distance: 5 },
      { kind: "round", nearModule: 3, along: 14, side: -1, distance: 4, s: 1.2 },
      { kind: "poplar", nearModule: 4, along: 8, side: 1, distance: 6, s: 1.2 },
      { kind: "spruce", nearModule: 4, along: 18, side: -1, distance: 5, s: 1.3 },
      { kind: "round", nearModule: 5, along: 4, side: -1, distance: 4, s: 1.2 },
      { kind: "bush", nearModule: 5, along: 8, side: 1, distance: 2 },
      { kind: "spruce", nearModule: 6, along: 6, side: -1, distance: 6 },
      // Chalets du village en contrebas
      { kind: "chalet", nearModule: 7, along: 6, side: 1, distance: 18, s: 1.2 },
      { kind: "chalet", nearModule: 9, along: 4, side: -1, distance: 16, s: 1.3 },
      { kind: "chalet", nearModule: 10, along: 2, side: 1, distance: 20, s: 1.1 },
      { kind: "chalet", nearModule: 12, along: 0, side: -1, distance: 22 },
      { kind: "round", nearModule: 9, along: 10, side: 1, distance: 6, s: 1.2 },
      // Drapeaux du slalom et de l'arrivee
      { kind: "flag", nearModule: 11, along: 2, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 12, along: 2, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 13, along: 2, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 14, along: 1, side: 1, distance: 0.6 },
      { kind: "flag", nearModule: 14, along: 1, side: -1, distance: 0.6 },
    ],
    sky: { top: "#3b8ad9", horizon: "#d6ecf7" },
  },
  map: { x: 0.68, y: 0.38, grass: "#6e9a3a" },
};
