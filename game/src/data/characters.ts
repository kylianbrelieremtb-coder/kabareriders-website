import type { CharacterDef } from "./types";

// Personnages jouables (Equipe Kabare). 10 prevus a terme.
export const CHARACTERS: CharacterDef[] = [
  {
    id: "kylian",
    name: "Kylian",
    model: "suit-laptop",
    bike: "trail",
    outfit: {
      jersey: "#1f2a44", // costard
      pants: "#1f2a44",
      helmet: "#3b2a1a", // cheveux
      skin: "#f0c8a0",
      bike: "#C76520",
    },
  },
];
