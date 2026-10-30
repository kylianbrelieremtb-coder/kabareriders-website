import type { TrackDef } from "../types";

// Kabare Enduro (Luberon), d'apres les videos embarquees et la description de Kylian.
// Single en foret sur un tapis de feuilles : virages releves, cassures (marches tres raides
// qu'on peut presque rouler), grosse marche en pierre, enchainement de virages, fin le long de la route.
// Distances un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart a plat | 2 virage releve gauche 90 | 3 petit saut (40 cm), virage releve gauche des la reception (4)
//  5-7 long virage droite a plat (140) avec une cassure de 1 m au milieu | 8 bout droit
//  9 cassure dans un virage gauche 90 (un seul virage) | 11 legerement a droite
//  12 grosse marche en pierre de 1,42 m, longue descente qui part a droite | 13 un seul gros virage releve gauche
//  16 passage caillouteux | 18-23 virages releves droite / gauche bien inclines, le dernier long
//  24 le long de la route (a gauche) | 25 derniere descente a gauche | 26 arrivee a cote de la route
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
    /* 1 */ { type: "straight", length: 1, slope: 0.02 },
    /* 2 */ { type: "berm", angle: 90, radius: 8, bank: 1.6, slope: 0.04 },
    /* 3 */ {
      type: "kicker",
      height: 0.4,
      length: 2,
      gap: 0.8,
      landing: { height: 0.4, up: 0.3, top: 0.4, down: 7.5 },
    },
    /* 4 */ { type: "berm", angle: 50, radius: 9, bank: 1.4, slope: 0.04 },
    /* 5 */ { type: "berm", angle: -70, radius: 12, bank: 0.2, slope: 0.05 },
    /* 6 */ { type: "drop", height: 1.0, deck: 1, landing: 10, landingDrop: 1.6, turn: -30 },
    /* 7 */ { type: "berm", angle: -40, radius: 12, bank: 0.2, slope: 0.05 },
    /* 8 */ { type: "straight", length: 2.6, slope: 0.04 },
    /* 9 */ { type: "drop", height: 0.9, deck: 0.8, landing: 10, landingDrop: 1.6, turn: 90 },
    /* 10 */ { type: "straight", length: 1, slope: 0.04 },
    /* 11 */ { type: "berm", angle: -20, radius: 20, bank: 0, slope: 0.04 },
    /* 12 */ { type: "drop", height: 1.42, deck: 2, landing: 13, landingDrop: 4, turn: -25 },
    /* 13 */ { type: "berm", angle: 60, radius: 16, bank: 2.6, slope: 0.04 },
    /* 14 */ { type: "straight", length: 0.5, slope: 0.04 },
    /* 15 */ { type: "straight", length: 0.5, slope: 0.04 },
    /* 16 */ { type: "rollers", count: 3, height: 0.25, spacing: 2.6, slope: 0.04 },
    /* 17 */ { type: "straight", length: 5, slope: 0.1 },
    /* 18 */ { type: "berm", angle: -75, radius: 7.5, bank: 2.0, slope: 0.07 },
    /* 19 */ { type: "straight", length: 2, slope: 0.06 },
    /* 20 */ { type: "berm", angle: 75, radius: 7.5, bank: 2.0, slope: 0.07 },
    /* 21 */ { type: "berm", angle: -75, radius: 7.5, bank: 2.0, slope: 0.07 },
    /* 22 */ { type: "berm", angle: 75, radius: 7.5, bank: 2.0, slope: 0.07 },
    /* 23 */ { type: "berm", angle: -85, radius: 11, bank: 2.2, slope: 0.06 },
    /* 24 */ { type: "straight", length: 22, slope: 0.025 },
    /* 25 */ { type: "berm", angle: 25, radius: 15, bank: 0, slope: 0.12 },
    /* 26 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.4 },
    { fromModule: 12, toModule: 12, side: 0, density: 0.6 },
    { fromModule: 25, toModule: 26, side: 1, density: 1 },
  ],
  decor: {
    palette: { lane: ["#6e4a30", "#644329"], top: "#5e4b31", gravelL: "#655437", gravelR: "#574830" },
    landmarks: [
      // Foret dense de chenes et d'arbres couverts de lierre, des deux cotes tout du long
      ...[0, 1, 2, 4, 5, 7, 8, 10, 11, 13, 15, 16, 17, 18, 20, 21].flatMap((m, i) => [
        { kind: (i % 3 === 0 ? "poplar" : "round") as "poplar" | "round", nearModule: m, along: 2, side: -1 as const, distance: 1.5 + (i % 3), s: 1.1 + (i % 4) * 0.08 },
        { kind: (i % 2 === 0 ? "round" : "poplar") as "poplar" | "round", nearModule: m, along: 4, side: 1 as const, distance: 1.5 + ((i + 1) % 3), s: 1.15 },
        { kind: "bush" as const, nearModule: m, along: 1, side: (i % 2 ? 1 : -1) as 1 | -1, distance: 0.8 },
      ]),
      // Marche en pierre : rochers moussus
      { kind: "bush", nearModule: 12, along: 1.5, side: -1, distance: 0.5, s: 1.3 },
      { kind: "bush", nearModule: 12, along: 1.5, side: 1, distance: 0.5, s: 1.3 },
      // Fin le long de la route : camionnettes garees
      { kind: "van", nearModule: 24, along: 4, side: 1, distance: 5 },
      { kind: "van", nearModule: 24, along: 14, side: 1, distance: 5 },
      { kind: "round", nearModule: 24, along: 9, side: 1, distance: 3, s: 1.2 },
      { kind: "round", nearModule: 23, along: 4, side: 1, distance: 2.5, s: 1.2 },
      { kind: "poplar", nearModule: 23, along: 9, side: 1, distance: 3, s: 1.2 },
    ],
    road: { fromModule: 23, side: -1, distance: 1.5, width: 6 },
    sky: { top: "#5d8fc4", horizon: "#dfe8ef" },
  },
  map: { x: 0.24, y: 0.45, grass: "#5f7a34" },
};
