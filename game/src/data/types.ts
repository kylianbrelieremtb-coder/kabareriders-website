// Types des donnees de jeu : pistes, riders, adversaires.

/** Atterrissage d'un kicker : bosse avec face montante, plateau, face de reception. */
export interface LandingDef {
  height: number;
  up: number;
  top: number;
  down: number;
}

/**
 * Un module de piste. Les modules sont places dans l'ordre, l'un apres l'autre.
 * `slope` (optionnel) = denivele de la ligne de base en m par m (positif = descend, negatif = monte).
 */
export type ModuleDef =
  | { type: "start"; length: number; drop: number }
  | { type: "straight"; length: number; slope?: number }
  | { type: "rollers"; count: number; height: number; spacing: number; slope?: number }
  | { type: "berm"; angle: number; radius: number; bank: number; slope?: number }
  | { type: "table"; height: number; up: number; top: number; down: number; slope?: number }
  | {
      type: "kicker";
      height: number;
      length: number;
      gap: number;
      landing: LandingDef;
      material?: "wood" | "dirt";
    }
  | { type: "finish"; length: number; slope?: number };

export type ModuleType = ModuleDef["type"];

export interface CrowdZone {
  /** Index des modules (inclus) */
  fromModule: number;
  toModule: number;
  /** -1 = gauche, 1 = droite, 0 = les deux */
  side: -1 | 0 | 1;
  density?: number;
}

export interface TrackDef {
  id: string;
  name: string;
  place: string;
  /** Largeur d'une ligne (m) */
  laneWidth: number;
  /** Distance entre les centres des deux lignes (m) */
  laneSpacing: number;
  /** Points de hype pour remplir la barre (plus de sauts = plus haut) */
  hypeToFill: number;
  modules: ModuleDef[];
  crowd: CrowdZone[];
  decor: {
    pylon?: { nearModule: number; side: -1 | 1; distance: number };
    lake?: { x: number; z: number; w: number; d: number };
    trees: { x: number; z: number; s?: number }[];
    sky: { top: string; horizon: string };
    grass: string;
    dirt: string;
  };
}

export interface Outfit {
  jersey: string;
  pants: string;
  helmet: string;
  skin: string;
  bike: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  model: "suit-laptop" | "rider";
  bike: "trail" | "enduro";
  outfit: Outfit;
}

export interface OpponentDef extends CharacterDef {
  /** Part d'executions parfaites a atteindre pour le battre (0..1). Jamais affichee. */
  successRate: number;
  /** Signature de vitesse : multiplicateurs le long du parcours (0 = depart, 1 = arrivee) */
  speedProfile: { at: number; mult: number }[];
}
