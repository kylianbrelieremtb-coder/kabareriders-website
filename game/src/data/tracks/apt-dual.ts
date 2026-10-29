import type { TrackDef } from "../types";

// Dual du plan d'eau d'Apt (reference : references/IMG_9639.jpeg)
// Les modules se suivent dans l'ordre. Indices utiles pour le public / decor :
//  0 depart | 2 petits kickers bois | 4 rollers | 5..11 virages + rollers
//  13..16 tables qui montent | 18 gros kicker bois 2,6 m | 19 arrivee
export const aptDual: TrackDef = {
  id: "apt-dual",
  name: "Dual du plan d'eau",
  place: "Apt (84)",
  laneWidth: 2.8,
  laneSpacing: 4.8,
  hypeToFill: 90,
  modules: [
    /* 0 */ { type: "start", length: 20, drop: 4.2 },
    /* 1 */ { type: "straight", length: 6 },
    /* 2 */ {
      type: "kicker",
      material: "wood",
      height: 1.0,
      length: 2.8,
      gap: 2.8,
      landing: { height: 1.1, up: 1.0, top: 2.0, down: 6.4 },
    },
    /* 3 */ { type: "straight", length: 5 },
    /* 4 */ { type: "rollers", count: 4, height: 0.9, spacing: 7.2, slope: 0.025 },
    /* 5 */ { type: "berm", angle: 75, radius: 11, bank: 1.9 },
    /* 6 */ { type: "rollers", count: 2, height: 0.85, spacing: 7 },
    /* 7 */ { type: "berm", angle: -100, radius: 11, bank: 2.0 },
    /* 8 */ { type: "rollers", count: 2, height: 0.85, spacing: 7 },
    /* 9 */ { type: "berm", angle: 100, radius: 11, bank: 2.0 },
    /* 10 */ { type: "rollers", count: 2, height: 0.85, spacing: 7 },
    /* 11 */ { type: "berm", angle: -75, radius: 11.5, bank: 1.9 },
    /* 12 */ { type: "straight", length: 5 },
    /* 13 */ { type: "table", height: 1.4, up: 3.4, top: 5.9, down: 8.4, slope: -0.03 },
    /* 14 */ { type: "rollers", count: 2, height: 0.9, spacing: 7.2, slope: -0.03 },
    /* 15 */ { type: "table", height: 1.5, up: 3.6, top: 6.2, down: 8.8, slope: -0.03 },
    /* 16 */ { type: "rollers", count: 1, height: 0.85, spacing: 7.2, slope: -0.02 },
    /* 17 */ { type: "straight", length: 9, slope: 0.01 },
    /* 18 */ {
      type: "kicker",
      material: "wood",
      height: 2.6,
      length: 6.4,
      gap: 4.9,
      landing: { height: 2.5, up: 1.2, top: 2.2, down: 9.2 },
    },
    /* 19 */ { type: "finish", length: 25, slope: 0.02 },
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
