import type { OpponentDef } from "./types";

// Adversaires : meme modele 3D, seuls nom et couleurs changent. 10 prevus a terme.
// successRate : part d'executions parfaites necessaire pour le battre (jamais affichee).
// speedProfile : signature de vitesse le long du parcours (renormalisee automatiquement).
export const OPPONENTS: OpponentDef[] = [
  {
    id: "christian-cayol",
    name: "Christian Cayol",
    model: "rider",
    bike: "enduro",
    successRate: 0.1,
    outfit: {
      jersey: "#2e6db4",
      pants: "#222222",
      helmet: "#e8e8e8",
      skin: "#e7b98f",
      bike: "#222222",
    },
    // Gros velo d'enduro : rapide dans la descente du depart et les virages,
    // plus lourd dans les rollers et la montee vers le gros kicker.
    speedProfile: [
      { at: 0, mult: 1.1 },
      { at: 0.15, mult: 1.05 },
      { at: 0.25, mult: 0.92 },
      { at: 0.4, mult: 1.08 },
      { at: 0.6, mult: 1.02 },
      { at: 0.72, mult: 0.9 },
      { at: 0.85, mult: 1.0 },
      { at: 1, mult: 1.05 },
    ],
  },
];
