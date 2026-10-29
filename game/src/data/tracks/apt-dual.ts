import type { TrackDef } from "../types";

// Dual du plan d'eau d'Apt, d'apres les videos embarquees (references/) et la description de Kylian.
// Hauteurs reelles ; distances horizontales un peu allongees (x1,3 environ) pour la vitesse du jeu.
// Ordre des modules :
//  0 butte de depart | 2 canadienne (kick bois) + reception en pente | 4 deux rollers + roller d'entree
//  5 virage gauche 90 en shark fin (kick dans la sortie du virage) | 8 grosse table (plateau 4 m, reception 5 m) | 10 virage droite 90
//  11 rollers (sortie, milieu, entree) | 12 virage gauche 90 | 13 roller de sortie | 15 cinq rollers
//  17 gros roller, virage gauche dans sa descente (18) | 19 courte ligne droite en legere pente
//  20 bosse a tricks : kick bois 2,2 m, plancher bois, reception en copeaux | 21 arrivee vers le lac
export const aptDual: TrackDef = {
  id: "apt-dual",
  name: "Dual du plan d'eau",
  place: "Apt (84)",
  laneWidth: 2.8,
  laneSpacing: 4.8,
  hypeToFill: 90,
  modules: [
    /* 0 */ { type: "start", length: 20, drop: 4.2 },
    /* 1 */ { type: "straight", length: 4, slope: 0.03 },
    /* 2 */ {
      type: "kicker",
      material: "wood",
      height: 1.0,
      length: 2.8,
      gap: 2.6,
      landing: { height: 1.0, up: 0.9, top: 1.8, down: 6 },
    },
    /* 3 */ { type: "straight", length: 4, slope: 0.03 },
    /* 4 */ { type: "rollers", count: 3, height: 0.8, spacing: 5.8, slope: 0.02 },
    /* 5 */ {
      type: "berm",
      angle: 90,
      radius: 11,
      bank: 1.9,
      // Shark fin : on decolle dans la sortie du virage
      exitKick: { height: 0.7, length: 2.6, gap: 1.2, landing: { height: 0.6, up: 0.5, top: 1.4, down: 7 } },
    },
    /* 6 */ { type: "straight", length: 1, slope: 0.02 },
    /* 7 */ { type: "straight", length: 4, slope: 0.02 },
    /* 8 */ { type: "table", height: 1.5, up: 3.6, top: 4, down: 5 },
    /* 9 */ { type: "straight", length: 6, slope: 0.025 },
    /* 10 */ { type: "berm", angle: -90, radius: 11, bank: 1.9 },
    /* 11 */ { type: "rollers", count: 3, height: 0.75, spacing: 5.8 },
    /* 12 */ { type: "berm", angle: 90, radius: 11, bank: 1.9 },
    /* 13 */ { type: "rollers", count: 1, height: 0.75, spacing: 5.8 },
    /* 14 */ { type: "straight", length: 3 },
    /* 15 */ { type: "rollers", count: 5, height: 0.8, spacing: 5.8, slope: 0.01 },
    /* 16 */ { type: "straight", length: 4 },
    /* 17 */ { type: "rollers", count: 1, height: 1.3, spacing: 9 },
    /* 18 */ { type: "berm", angle: 40, radius: 12, bank: 1.4, slope: 0.03 },
    /* 19 */ { type: "straight", length: 9, slope: 0.012 },
    /* 20 */ {
      type: "table",
      material: "wood",
      height: 2.2,
      up: 5.2,
      top: 5.2,
      down: 8,
      landingSurface: "chips",
    },
    /* 21 */ { type: "finish", length: 25, slope: 0.02 },
  ],
  crowd: [
    { fromModule: 0, toModule: 2, side: 0, density: 0.8 },
    { fromModule: 8, toModule: 8, side: 0, density: 0.6 },
    { fromModule: 12, toModule: 12, side: 0, density: 0.4 },
    { fromModule: 19, toModule: 21, side: 0, density: 1 },
  ],
  decor: {
    // Pylone haute tension pres des virages du milieu, lac au bout (derriere l'arrivee)
    pylon: { nearModule: 11, side: -1, distance: 10 },
    lake: { x: -160, z: -150, w: 150, d: 90, inflatables: 9 },
    landmarks: [
      // Depart : saule a droite, arbres ronds, poteau
      { kind: "willow", nearModule: 1, along: 0, side: 1, distance: 6, s: 1.2 },
      { kind: "round", nearModule: 0, along: 4, side: -1, distance: 10, s: 1.2 },
      { kind: "poplar", nearModule: 3, along: 2, side: -1, distance: 14 },
      { kind: "van", nearModule: 4, along: 4, side: -1, distance: 14 },
      { kind: "bush", nearModule: 4, along: 10, side: 1, distance: 4 },
      // Saut virage et grosse table
      { kind: "round", nearModule: 6, along: 2, side: 1, distance: 9 },
      { kind: "poplar", nearModule: 8, along: 4, side: -1, distance: 10, s: 1.1 },
      { kind: "bush", nearModule: 9, along: 2, side: 1, distance: 4 },
      // Virages du pylone, palissade, camionnette
      { kind: "van", nearModule: 13, along: 2, side: 1, distance: 10 },
      { kind: "round", nearModule: 12, along: 0, side: 1, distance: 16, s: 1.3 },
      { kind: "poplar", nearModule: 10, along: 0, side: 1, distance: 15, s: 1.2 },
      { kind: "bush", nearModule: 11, along: 4, side: -1, distance: 5 },
      // Cinq rollers et gros roller : pins et peupliers
      { kind: "pine", nearModule: 15, along: 10, side: -1, distance: 12, s: 1.1 },
      { kind: "poplar", nearModule: 16, along: 0, side: 1, distance: 9, s: 1.2 },
      { kind: "pine", nearModule: 18, along: 2, side: -1, distance: 10 },
      { kind: "poplar", nearModule: 19, along: 6, side: -1, distance: 8, s: 1.2 },
      // Pin parasol emblematique a cote de la bosse a tricks
      { kind: "pine", nearModule: 20, along: 9, side: 1, distance: 4, s: 1.3 },
      { kind: "poplar", nearModule: 20, along: 0, side: -1, distance: 8, s: 1.1 },
      { kind: "pine", nearModule: 19, along: 8, side: -1, distance: 14 },
      // Rive du lac
      { kind: "poplar", x: -95, z: -110, s: 1.3 }, { kind: "bush", x: -88, z: -118 },
      { kind: "bush", x: -100, z: -100 }, { kind: "round", x: -110, z: -92, s: 1.2 },
      { kind: "pine", x: -120, z: -98, s: 1.2 }, { kind: "poplar", x: -150, z: -100 },
      { kind: "round", x: 20, z: 60, s: 1.4 }, { kind: "pine", x: 30, z: 0, s: 1.2 },
      { kind: "poplar", x: -20, z: 40, s: 1.2 }, { kind: "round", x: -60, z: 20 },
    ],
    sky: { top: "#2a78d2", horizon: "#cfe7f6" },
  },
};
