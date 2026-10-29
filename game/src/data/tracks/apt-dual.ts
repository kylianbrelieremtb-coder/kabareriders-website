import type { TrackDef } from "../types";

// Dual du plan d'eau d'Apt (reference : references/IMG_9639.jpeg)
// Les modules se suivent dans l'ordre. Indices utiles pour le public / decor :
//  0 depart | 2 petits kickers bois | 4 rollers | 5..11 virages + rollers
//  13..16 tables qui montent | 18 gros kicker bois 2,2 m | 19 arrivee
export const aptDual: TrackDef = {
  id: "apt-dual",
  name: "Dual du plan d'eau",
  place: "Apt (84)",
  laneWidth: 2.4,
  laneSpacing: 4.2,
  hypeToFill: 90,
  modules: [
    /* 0 */ { type: "start", length: 16, drop: 3.4 },
    /* 1 */ { type: "straight", length: 5 },
    /* 2 */ {
      type: "kicker",
      material: "wood",
      height: 0.7,
      length: 2.2,
      gap: 2.0,
      landing: { height: 0.8, up: 0.8, top: 1.4, down: 4.6 },
    },
    /* 3 */ { type: "straight", length: 4 },
    /* 4 */ { type: "rollers", count: 4, height: 0.7, spacing: 5.6, slope: 0.025 },
    /* 5 */ { type: "berm", angle: 75, radius: 8.5, bank: 1.3 },
    /* 6 */ { type: "rollers", count: 2, height: 0.65, spacing: 5.4 },
    /* 7 */ { type: "berm", angle: -100, radius: 8.5, bank: 1.4 },
    /* 8 */ { type: "rollers", count: 2, height: 0.65, spacing: 5.4 },
    /* 9 */ { type: "berm", angle: 100, radius: 8.5, bank: 1.4 },
    /* 10 */ { type: "rollers", count: 2, height: 0.65, spacing: 5.4 },
    /* 11 */ { type: "berm", angle: -75, radius: 9, bank: 1.3 },
    /* 12 */ { type: "straight", length: 4 },
    /* 13 */ { type: "table", height: 1.0, up: 2.6, top: 3.8, down: 5.4, slope: -0.03 },
    /* 14 */ { type: "rollers", count: 2, height: 0.7, spacing: 5.6, slope: -0.03 },
    /* 15 */ { type: "table", height: 1.1, up: 2.8, top: 4.0, down: 5.6, slope: -0.03 },
    /* 16 */ { type: "rollers", count: 1, height: 0.65, spacing: 5.6, slope: -0.02 },
    /* 17 */ { type: "straight", length: 7, slope: 0.01 },
    /* 18 */ {
      type: "kicker",
      material: "wood",
      height: 2.2,
      length: 5.6,
      gap: 3.5,
      landing: { height: 2.1, up: 1.0, top: 1.6, down: 5.8 },
    },
    /* 19 */ { type: "finish", length: 22, slope: 0.02 },
  ],
  crowd: [
    { fromModule: 0, toModule: 2, side: 0, density: 0.8 },
    { fromModule: 5, toModule: 5, side: 0, density: 0.5 },
    { fromModule: 9, toModule: 9, side: 0, density: 0.5 },
    { fromModule: 15, toModule: 19, side: 0, density: 1 },
  ],
  decor: {
    pylon: { nearModule: 7, side: -1, distance: 9 },
    lake: { x: 30, z: -190, w: 260, d: 110, inflatables: 9 },
    landmarks: [
      // Pin parasol emblematique derriere le gros kicker
      { kind: "pine", nearModule: 19, along: 6, side: 1, distance: 4, s: 1.25 },
      { kind: "poplar", nearModule: 18, along: 0, side: -1, distance: 7, s: 1.1 },
      { kind: "pine", nearModule: 17, along: 2, side: -1, distance: 12 },
      { kind: "poplar", nearModule: 15, along: 2, side: 1, distance: 9 },
      { kind: "round", nearModule: 13, along: 3, side: 1, distance: 10 },
      { kind: "bush", nearModule: 14, along: 2, side: -1, distance: 4 },
      // Virages pres du pylone, camionnette
      { kind: "van", nearModule: 9, along: 4, side: 1, distance: 9 },
      { kind: "round", nearModule: 8, along: 0, side: 1, distance: 16, s: 1.3 },
      { kind: "poplar", nearModule: 6, along: 0, side: 1, distance: 18, s: 1.2 },
      { kind: "bush", nearModule: 10, along: 1, side: -1, distance: 5 },
      // Depart sur la butte d'herbe : saule et arbres
      { kind: "willow", nearModule: 1, along: 0, side: 1, distance: 6, s: 1.2 },
      { kind: "round", nearModule: 0, along: 2, side: -1, distance: 9 },
      { kind: "willow", nearModule: 3, along: 2, side: -1, distance: 8 },
      { kind: "bush", nearModule: 4, along: 6, side: 1, distance: 4 },
      { kind: "pine", nearModule: 4, along: 12, side: -1, distance: 14, s: 1.1 },
      // Rive du lac
      { kind: "poplar", x: -40, z: -128, s: 1.3 }, { kind: "poplar", x: -55, z: -126 },
      { kind: "pine", x: 70, z: -124, s: 1.3 }, { kind: "round", x: 95, z: -127 },
      { kind: "bush", x: -20, z: -122 }, { kind: "bush", x: 10, z: -121 }, { kind: "bush", x: 45, z: -122 },
      { kind: "round", x: -70, z: -60, s: 1.4 }, { kind: "pine", x: -60, z: 10, s: 1.2 },
      { kind: "poplar", x: 60, z: 30, s: 1.2 }, { kind: "round", x: 40, z: 55 },
    ],
    sky: { top: "#2a78d2", horizon: "#cfe7f6" },
  },
};
