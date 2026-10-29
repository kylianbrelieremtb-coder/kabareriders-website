import type { OpponentDef } from "./types";

// Adversaires du tournoi : a chaque tour, un des deux pilotes du tour au hasard.
// successRate : part d'executions parfaites necessaire pour le battre (jamais affichee).
// Elle monte d'environ 20 points a chaque tour : 30 % en 16es ... 100 % en finale.
// speedProfile : signature de vitesse le long du parcours (renormalisee automatiquement).
// On les voit peu en course : seuls le nom et les couleurs changent.

type Profile = OpponentDef["speedProfile"];

// Gros velo d'enduro : rapide dans la descente du depart et les virages, plus lourd dans les rollers
const ENDURO: Profile = [
  { at: 0, mult: 1.1 }, { at: 0.15, mult: 1.05 }, { at: 0.25, mult: 0.92 }, { at: 0.4, mult: 1.08 },
  { at: 0.6, mult: 1.02 }, { at: 0.72, mult: 0.9 }, { at: 0.85, mult: 1.0 }, { at: 1, mult: 1.05 },
];
// Dirt / slopestyle : a l'aise dans les sauts et les rollers, moins dans les virages
const DIRT: Profile = [
  { at: 0, mult: 0.96 }, { at: 0.2, mult: 1.06 }, { at: 0.35, mult: 0.95 }, { at: 0.5, mult: 0.96 },
  { at: 0.65, mult: 1.08 }, { at: 0.85, mult: 1.04 }, { at: 1, mult: 1.0 },
];
// Electrique : regulier partout, relance tres fort
const EBIKE: Profile = [
  { at: 0, mult: 1.08 }, { at: 0.3, mult: 1.02 }, { at: 0.6, mult: 1.05 }, { at: 1, mult: 0.98 },
];
// Enfant en 20 pouces : petit braquet, regulier
const KID: Profile = [
  { at: 0, mult: 0.92 }, { at: 0.3, mult: 1.04 }, { at: 0.7, mult: 1.03 }, { at: 1, mult: 0.98 },
];

function opp(
  id: string,
  name: string,
  round: number,
  successRate: number,
  bikeLabel: string,
  bike: OpponentDef["bike"],
  jersey: string,
  helmet: string,
  speedProfile: Profile,
): OpponentDef {
  return {
    id,
    name,
    model: "rider",
    bike,
    round,
    bikeLabel,
    successRate,
    outfit: { jersey, pants: "#222222", helmet, skin: "#e7b98f", bike: "#2a2a2a" },
    speedProfile,
  };
}

export const OPPONENTS: OpponentDef[] = [
  // 16es de finale : tres facile
  opp("mael-sodaval", "Maël Sodaval", 0, 0.3, "Vélo 20 pouces", "trail", "#4cb3e6", "#f9d423", KID),
  opp("christian-cayol", "Christian Cayol", 0, 0.3, "Gros enduro", "enduro", "#2e6db4", "#e8e8e8", ENDURO),
  // 8es de finale
  opp("thomas-gossein", "Thomas Gossein", 1, 0.5, "Grand vélo électrique", "enduro", "#3c9a5f", "#222222", EBIKE),
  opp("papaz", "Papaz", 1, 0.5, "Vélo de slopestyle", "trail", "#c62f22", "#ffffff", DIRT),
  // Quarts de finale
  opp("kevin-savary", "Kevin Savary", 2, 0.7, "Vélo de dirt", "trail", "#7b4bb5", "#111111", DIRT),
  opp("alexandre-godiniere", "Alexandre Godinière", 2, 0.7, "Enduro", "enduro", "#e38b1d", "#2a2a2a", ENDURO),
  // Demi-finales
  opp("gaetan-dupin", "Gaëtan Dupin", 3, 0.9, "Enduro", "enduro", "#1b1b1b", "#c62f22", ENDURO),
  opp("elie-robert", "Élie Robert", 3, 0.9, "Enduro", "enduro", "#d94f8a", "#1b1b1b", ENDURO),
  // Finale : quasi imbattables
  opp("jules-blondiaux", "Jules Blondiaux", 4, 1, "Vélo de dirt", "trail", "#f2f2f2", "#c76520", DIRT),
  opp("thibault-gassin", "Thibault Gassin", 4, 1, "Vélo de dirt", "trail", "#0f3d6e", "#f9d423", DIRT),
];

export const ROUND_NAMES = ["16es de finale", "8es de finale", "Quarts de finale", "Demi-finale", "Finale"];
