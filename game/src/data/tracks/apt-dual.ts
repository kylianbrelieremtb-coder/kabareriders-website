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
      gap: 1.4,
      landing: { height: 0.7, up: 0.8, top: 1.2, down: 4.0 },
    },
    /* 3 */ { type: "straight", length: 4 },
    /* 4 */ { type: "rollers", count: 4, height: 0.55, spacing: 4.4, slope: 0.025 },
    /* 5 */ { type: "berm", angle: 75, radius: 8.5, bank: 1.3 },
    /* 6 */ { type: "rollers", count: 2, height: 0.5, spacing: 4.2 },
    /* 7 */ { type: "berm", angle: -100, radius: 8.5, bank: 1.4 },
    /* 8 */ { type: "rollers", count: 2, height: 0.5, spacing: 4.2 },
    /* 9 */ { type: "berm", angle: 100, radius: 8.5, bank: 1.4 },
    /* 10 */ { type: "rollers", count: 2, height: 0.5, spacing: 4.2 },
    /* 11 */ { type: "berm", angle: -75, radius: 9, bank: 1.3 },
    /* 12 */ { type: "straight", length: 4 },
    /* 13 */ { type: "table", height: 0.8, up: 2.2, top: 2.0, down: 3.5, slope: -0.03 },
    /* 14 */ { type: "rollers", count: 2, height: 0.55, spacing: 4.4, slope: -0.03 },
    /* 15 */ { type: "table", height: 0.9, up: 2.3, top: 2.0, down: 3.6, slope: -0.03 },
    /* 16 */ { type: "rollers", count: 1, height: 0.5, spacing: 4.4, slope: -0.02 },
    /* 17 */ { type: "straight", length: 7, slope: 0.01 },
    /* 18 */ {
      type: "kicker",
      material: "wood",
      height: 2.2,
      length: 5.2,
      gap: 2.2,
      landing: { height: 1.9, up: 0.8, top: 1.0, down: 3.2 },
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
    pylon: { nearModule: 4, side: -1, distance: 11 },
    lake: { x: -40, z: -260, w: 220, d: 90 },
    trees: [
      { x: -18, z: 10 }, { x: 16, z: 6, s: 1.3 }, { x: -24, z: -30 }, { x: 22, z: -48, s: 1.2 },
      { x: -30, z: -90, s: 1.4 }, { x: 35, z: -110 }, { x: -40, z: -150 }, { x: 30, z: -170, s: 1.5 },
      { x: -60, z: -40, s: 1.6 }, { x: 60, z: -80, s: 1.3 }, { x: -12, z: -200 }, { x: 45, z: -210, s: 1.2 },
      { x: 28, z: 60, s: 1.4 }, { x: -26, z: 70 }, { x: 40, z: 30, s: 1.1 }, { x: -45, z: 20, s: 1.3 },
      { x: 18, z: -15 }, { x: -20, z: -60, s: 1.2 }, { x: 70, z: 0, s: 1.6 }, { x: -70, z: -110, s: 1.5 },
    ],
    sky: { top: "#5d9bd6", horizon: "#f6d9a8" },
    grass: "#6f9a3c",
    dirt: "#c9925a",
  },
};
