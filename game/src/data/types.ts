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
  | {
      type: "berm";
      angle: number;
      radius: number;
      bank: number;
      slope?: number;
      /** Roller dont la crete est pile au debut du virage : on finit sa descente en tournant
       *  (le module de rollers d'avant se termine sur une demi-bosse, ex. count: 3.5) */
      rollerIn?: { height: number; spacing: number };
      /** Shark fin : kick dans la sortie du virage (on decolle en tournant), puis trou et reception */
      exitKick?: { height: number; length: number; gap: number; landing: LandingDef };
    }
  | {
      type: "table";
      height: number;
      up: number;
      top: number;
      down: number;
      slope?: number;
      /** "wood" = kick en bois (profil plus raide en haut) et plancher en bois */
      material?: "wood" | "dirt";
      landingSurface?: "dirt" | "chips";
    }
  | {
      type: "kicker";
      height: number;
      length: number;
      gap: number;
      landing: LandingDef;
      material?: "wood" | "dirt";
      /** Surface de la reception (copeaux de bois = plus sombre) */
      landingSurface?: "dirt" | "chips";
      /** Hip : la reception part dans une autre direction (degres, + = gauche) */
      turn?: number;
    }
  | {
      /** Drop : plateau (deck) puis falaise de `height` m et longue reception en pente de `landing` m
       *  qui descend de `landingDrop` m en tournant de `turn` degres (+ = gauche) */
      type: "drop";
      height: number;
      deck: number;
      landing: number;
      landingDrop: number;
      turn?: number;
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
    /** Plan d'eau (position relative au centre de la piste) et nombre de structures gonflables */
    lake?: { x: number; z: number; w: number; d: number; inflatables?: number };
    /** Arbres, buissons, camionnette... places pres d'un module ou en absolu */
    landmarks: Landmark[];
    sky: { top: string; horizon: string };
    /** Montagnes a l'horizon (par defaut : collines du Luberon) */
    mountains?: { far: string; near: string; height: number; snow?: boolean };
    /** Couleurs de la piste (piste en herbe...) : lignes, entre-deux, bas-cotes */
    palette?: { lane: [string, string]; top: string; gravelL: string; gravelR: string };
    /** Position de l'arche KABARE du depart, en metres apres la ligne de depart (defaut : juste derriere) */
    startArchAt?: number;
    /** Arche gonflable KABARE RIDERS en plus, au debut de ce module */
    archAtModule?: number;
    /** Telecabine : cables + cabines au-dessus de la piste, pres de ce module */
    gondola?: { nearModule: number; side: -1 | 1; distance: number };
  };
  /** Les deux lignes se rejoignent en une seule sur les N derniers metres avant l'arrivee */
  mergeLast?: number;
  /** "slope" : piste sur un versant de montagne, le terrain autour suit la descente (sinon terrain plat) */
  terrain?: "flat" | "slope";
  /** Ile de la carte du monde (position 0..1 sur la carte, couleur de l'herbe) */
  map?: { x: number; y: number; grass: string };
}

export type LandmarkKind = "pine" | "poplar" | "round" | "willow" | "bush" | "van" | "chalet" | "flag" | "spruce";

export interface Landmark {
  kind: LandmarkKind;
  /** Placement relatif a un module : debut du module + `along` m, a `distance` m du bord, cote `side` */
  nearModule?: number;
  along?: number;
  side?: -1 | 1;
  distance?: number;
  /** Ou placement absolu, relatif au centre de la piste */
  x?: number;
  z?: number;
  /** Echelle */
  s?: number;
}

export interface Outfit {
  jersey: string;
  pants: string;
  helmet: string;
  skin: string;
  bike: string;
}

export type Pattern = "leopard" | "flowers" | "camo" | "grease" | "rainbow" | "pinstripe" | "pixel";

/** Apparence detaillee (ecran de choix "studio" et rider en course) */
export interface CharacterLook {
  /** Taille (m) */
  height: number;
  build: "slim" | "normal" | "curvy" | "broad";
  hair: { color: string; style: "messy" | "short" | "buzz" | "bald" | "medium" | "clown" };
  top: { kind: "suit" | "crop" | "shirt" | "tshirt" | "hoodie" | "overalls" | "jacket" | "coat" | "none"; color: string; accent?: string; pattern?: Pattern };
  bottom: { kind: "pants" | "shorts" | "hotpants" | "swim"; color: string; pattern?: Pattern };
  shoes: string;
  headwear?: { kind: "cap" | "beachhat" | "forestry"; color: string };
  glasses?: boolean;
  /** Objet en main */
  prop?: "briefcase" | "chainsaw" | "controller" | "phone" | "cocktail" | "camera" | "wrench" | "plan";
  /** Sacoche / sac porte (visible aussi en course, dans le dos) */
  bag?: { kind: "satchel" | "camerabag"; color: string };
  /** Objet pose a cote (studio) */
  beside?: "pc";
  /** Casque de course, dans le style de la tenue */
  helmet: { color: string; accent: string; pattern?: Pattern };
  /** « Stat » qui n'a aucun sens, juste pour rire : seule info affichee sur la fiche */
  tagline: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  model: "suit-laptop" | "rider";
  bike: "trail" | "enduro";
  outfit: Outfit;
  look?: CharacterLook;
}

export interface OpponentDef extends CharacterDef {
  /** Tour du tournoi ou on peut le croiser : 0 = 16es, 1 = 8es, 2 = quarts, 3 = demies, 4 = finale */
  round: number;
  /** Velo (affiche sur le tableau) */
  bikeLabel: string;
  /** Part d'executions parfaites a atteindre pour le battre (0..1). Jamais affichee. */
  successRate: number;
  /** Signature de vitesse : multiplicateurs le long du parcours (0 = depart, 1 = arrivee) */
  speedProfile: { at: number; mult: number }[];
}
