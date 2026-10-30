import type { TrackDef } from "../types";

// Kabare Enduro (Luberon), d'apres les videos embarquees et la description de Kylian.
// Single en foret sur un tapis de feuilles : virages releves, cassures (marches tres raides
// qu'on peut presque rouler), grosse marche en pierre, enchainement de virages, fin le long de la route.
// Distances un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart a plat | 2 virage releve gauche 90 | 3 petit saut (40 cm) | 5 virage releve gauche
//  6-8 long virage droite a plat (140) avec une cassure de 1 m au milieu | 9 bout droit
//  10 cassure dans un virage gauche 90, petit releve en bas (11) | 12 legerement a droite
//  13 grosse marche en pierre de 1,42 m, longue descente qui part a droite | 14 gros virage releve gauche
//  15 passage caillouteux | 17-22 virages releves droite / gauche, le dernier long
//  23 le long de la route | 24 derniere descente a gauche | 25 arrivee
export const kabareEnduro: TrackDef = {
  id: "kabare-enduro",
  name: "Kabare Enduro",
  place: "Luberon (84)",
  laneWidth: 2.5,
  laneSpacing: 4.4,
  hypeToFill: 90,
  terrain: "slope",
  modules: [
    /* 0 */ { type: "start", length: 12, drop: 1.6 },
    /* 1 */ { type: "straight", length: 5, slope: 0.02 },
    /* 2 */ { type: "berm", angle: 90, radius: 8, bank: 1.6, slope: 0.04 },
    /* 3 */ {
      type: "kicker",
      height: 0.4,
      length: 2,
      gap: 0.8,
      landing: { height: 0.4, up: 0.3, top: 0.4, down: 7.5 },
    },
    /* 4 */ { type: "straight", length: 1.5, slope: 0.03 },
    /* 5 */ { type: "berm", angle: 50, radius: 9, bank: 1.4, slope: 0.04 },
    /* 6 */ { type: "berm", angle: -70, radius: 14, bank: 0.2, slope: 0.05 },
    /* 7 */ { type: "drop", height: 1.0, deck: 1, landing: 10, landingDrop: 1.6, turn: -30 },
    /* 8 */ { type: "berm", angle: -40, radius: 14, bank: 0.2, slope: 0.05 },
    /* 9 */ { type: "straight", length: 5, slope: 0.04 },
    /* 10 */ { type: "drop", height: 0.9, deck: 0.8, landing: 10, landingDrop: 1.6, turn: 50 },
    /* 11 */ { type: "berm", angle: 40, radius: 7, bank: 1.0, slope: 0.04 },
    /* 12 */ { type: "berm", angle: -20, radius: 20, bank: 0, slope: 0.04 },
    /* 13 */ { type: "drop", height: 1.42, deck: 2, landing: 13, landingDrop: 4, turn: -25 },
    /* 14 */ { type: "berm", angle: 55, radius: 10, bank: 2.2, slope: 0.04 },
    /* 15 */ { type: "rollers", count: 4, height: 0.25, spacing: 3, slope: 0.04 },
    /* 16 */ { type: "straight", length: 5, slope: 0.1 },
    /* 17 */ { type: "berm", angle: -45, radius: 8, bank: 1.4, slope: 0.07 },
    /* 18 */ { type: "straight", length: 4, slope: 0.06 },
    /* 19 */ { type: "berm", angle: 45, radius: 8, bank: 1.4, slope: 0.07 },
    /* 20 */ { type: "berm", angle: -45, radius: 8, bank: 1.4, slope: 0.07 },
    /* 21 */ { type: "berm", angle: 45, radius: 8, bank: 1.4, slope: 0.07 },
    /* 22 */ { type: "berm", angle: -50, radius: 14, bank: 1.6, slope: 0.06 },
    /* 23 */ { type: "straight", length: 22, slope: 0.025 },
    /* 24 */ { type: "berm", angle: 25, radius: 15, bank: 0, slope: 0.12 },
    /* 25 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.4 },
    { fromModule: 13, toModule: 13, side: 0, density: 0.6 },
    { fromModule: 24, toModule: 25, side: 0, density: 1 },
  ],
  decor: {
    palette: { lane: ["#6e4a30", "#644329"], top: "#5e4b31", gravelL: "#655437", gravelR: "#574830" },
    landmarks: [
      // Foret dense de chenes et d'arbres couverts de lierre, des deux cotes tout du long
      ...[0, 1, 2, 4, 5, 6, 8, 9, 11, 12, 14, 15, 16, 17, 19, 20, 22].flatMap((m, i) => [
        { kind: (i % 3 === 0 ? "poplar" : "round") as "poplar" | "round", nearModule: m, along: 2, side: -1 as const, distance: 1.5 + (i % 3), s: 1.1 + (i % 4) * 0.08 },
        { kind: (i % 2 === 0 ? "round" : "poplar") as "poplar" | "round", nearModule: m, along: 4, side: 1 as const, distance: 1.5 + ((i + 1) % 3), s: 1.15 },
        { kind: "bush" as const, nearModule: m, along: 1, side: (i % 2 ? 1 : -1) as 1 | -1, distance: 0.8 },
      ]),
      // Marche en pierre : rochers moussus
      { kind: "bush", nearModule: 13, along: 1.5, side: -1, distance: 0.5, s: 1.3 },
      { kind: "bush", nearModule: 13, along: 1.5, side: 1, distance: 0.5, s: 1.3 },
      // Fin le long de la route : camionnettes garees
      { kind: "van", nearModule: 23, along: 4, side: 1, distance: 5 },
      { kind: "van", nearModule: 23, along: 14, side: 1, distance: 5 },
      { kind: "round", nearModule: 23, along: 9, side: -1, distance: 3, s: 1.2 },
    ],
    sky: { top: "#5d8fc4", horizon: "#dfe8ef" },
  },
  map: { x: 0.24, y: 0.45, grass: "#5f7a34" },
};
