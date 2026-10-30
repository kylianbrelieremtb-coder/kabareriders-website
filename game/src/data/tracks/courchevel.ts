import type { TrackDef } from "../types";

// Courchevel - The Cycling Event (Savoie, 73) : dual slalom, d'apres les photos et la description de Kylian.
// Terre beige tres seche dans l'herbe grillee, rubalise, piquets bleus et rouges, public, lac et
// grandes montagnes au fond, telesiege, foret de sapins a droite.
// Distances un peu allongees (x1,3) pour la vitesse du jeu.
//  0 depart | 2 virage gauche 90, 1 m apres le depart | 4 virage droite 45 | 5 long virage releve droite (100)
//  6 grosse descente dans un virage releve gauche 90 (10 m) | 7 canadienne en bois, longue reception a plat
//  8 virage releve droite 90 | 10 virage releve gauche 90 mi-long | 11 double de 5 m (deux rollers)
//  13 virage releve droite 90 (5 m) | 14 mini descente : marche de 1 m, reception droite de 6 m
//  15-16 deux piquets a plat, gauche puis droite, qui resserrent la fin | 18 arrivee
export const courchevel: TrackDef = {
  id: "courchevel",
  name: "Courchevel - The Cycling Event",
  place: "Savoie (73)",
  laneWidth: 2.8,
  laneSpacing: 4.8,
  hypeToFill: 90,
  terrain: "slope",
  mergeLast: 4,
  modules: [
    /* 0 */ { type: "start", length: 12, drop: 2 },
    /* 1 */ { type: "straight", length: 1.3, slope: 0.04 },
    /* 2 */ { type: "berm", angle: 90, radius: 6.5, bank: 1.4, slope: 0.05 },
    /* 3 */ { type: "straight", length: 2, slope: 0.05 },
    /* 4 */ { type: "berm", angle: -45, radius: 10, bank: 0.9, slope: 0.05 },
    /* 5 */ { type: "berm", angle: -100, radius: 11, bank: 2.2, slope: 0.05 },
    /* 6 */ { type: "berm", angle: 90, radius: 8.3, bank: 2.4, slope: 0.17 },
    /* 7 */ {
      type: "kicker",
      material: "wood",
      height: 1.0,
      length: 2.6,
      gap: 2,
      landing: { height: 0.9, up: 0.6, top: 0.6, down: 15 },
    },
    /* 8 */ { type: "berm", angle: -90, radius: 6.5, bank: 2, slope: 0.04 },
    /* 9 */ { type: "straight", length: 4.5, slope: 0.05 },
    /* 10 */ { type: "berm", angle: 90, radius: 8, bank: 2, slope: 0.05 },
    /* 11 */ {
      type: "kicker",
      height: 0.8,
      length: 2.2,
      gap: 2.6,
      landing: { height: 0.9, up: 0.6, top: 1.2, down: 8 },
    },
    /* 12 */ { type: "straight", length: 1.3, slope: 0.04 },
    /* 13 */ { type: "berm", angle: -90, radius: 5.5, bank: 2, slope: 0.05 },
    /* 14 */ { type: "drop", height: 1.0, deck: 1, landing: 9, landingDrop: 1.4 },
    /* 15 */ { type: "berm", angle: 50, radius: 9, bank: 0.2, slope: 0.03 },
    /* 16 */ { type: "berm", angle: -55, radius: 9, bank: 0.2, slope: 0.03 },
    /* 17 */ { type: "straight", length: 6, slope: 0.02 },
    /* 18 */ { type: "finish", length: 25, slope: 0.01 },
  ],
  crowd: [
    { fromModule: 0, toModule: 0, side: 0, density: 0.6 },
    { fromModule: 6, toModule: 7, side: 0, density: 0.7 },
    { fromModule: 14, toModule: 18, side: 0, density: 1 },
  ],
  decor: {
    palette: { lane: ["#cdb78e", "#c2ab82"], top: "#b8b06e", gravelL: "#bcae70", gravelR: "#a9a463" },
    mountains: { far: "#8794a3", near: "#6f8256", height: 2.1, snow: true },
    gondola: { nearModule: 8, side: -1, distance: 18 },
    lake: { x: 0, z: 0, w: 1, d: 1 },
    landmarks: [
      // Foret de sapins a droite, tout du long
      ...[0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17].flatMap((m, i) => [
        { kind: "spruce" as const, nearModule: m, along: 2, side: 1 as const, distance: 4 + (i % 3) * 1.5, s: 1.2 + (i % 4) * 0.1 },
        { kind: "spruce" as const, nearModule: m, along: 5, side: 1 as const, distance: 8 + (i % 2) * 2, s: 1.4 },
      ]),
      // A gauche : herbe seche, quelques sapins isoles et buissons
      { kind: "spruce", nearModule: 0, along: 6, side: -1, distance: 9, s: 1.2 },
      { kind: "bush", nearModule: 3, along: 1, side: -1, distance: 2 },
      { kind: "bush", nearModule: 9, along: 2, side: -1, distance: 2.5 },
      { kind: "spruce", nearModule: 9, along: 3, side: -1, distance: 12, s: 1.3 },
      { kind: "chalet", nearModule: 12, along: 0, side: -1, distance: 22, s: 2.2 },
      { kind: "chalet", nearModule: 17, along: 2, side: -1, distance: 26, s: 2.4 },
      // Piquets bleus et rouges du slalom et arrivee
      { kind: "flag", nearModule: 2, along: 3, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 8, along: 3, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 13, along: 3, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 15, along: 3, side: 1, distance: 0.3 },
      { kind: "flag", nearModule: 16, along: 3, side: -1, distance: 0.3 },
      { kind: "flag", nearModule: 18, along: 1, side: 1, distance: 0.6 },
      { kind: "flag", nearModule: 18, along: 1, side: -1, distance: 0.6 },
    ],
    sky: { top: "#3d86d6", horizon: "#dcecf6" },
  },
  map: { x: 0.5, y: 0.2, grass: "#b4ad62" },
};
