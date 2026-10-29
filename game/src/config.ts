// =============================================================================
//  ROULE LA PISTE - Reglages de gameplay
//  Toutes les valeurs a ajuster sont ici. Unites : metres, secondes, m/s.
//  (1 m/s = 3,6 km/h)
// =============================================================================

export const CONFIG = {
  /** Vitesse globale du jeu (1 = normal, 0.8 = tout va 20 % moins vite) */
  timeScale: 0.9,

  // ---------------------------------------------------------------- Vitesse
  speed: {
    /** Vitesse au "GO" (m/s) */
    start: 5,
    /** Vitesse de croisiere : au-dessus, la vitesse redescend doucement vers elle */
    cruise: 10.5,
    /** Force du retour vers la croisiere (par seconde). Petit = les gains durent longtemps */
    dragToCruise: 0.12,
    /** En dessous de cette vitesse, le rider pedale */
    pedalTarget: 8,
    /** Acceleration en pedalant (m/s²) */
    pedalAccel: 2.6,
    /** Part de la gravite appliquee dans les pentes (1 = realiste) */
    slopeGain: 0.75,
    gravity: 9.81,
    min: 3,
    max: 17.5,
  },

  // ------------------------------------------------------- Perfect & enchainement
  perfect: {
    /** Gain de vitesse d'un perfect (m/s) */
    boost: 0.3,
    /** Bonus par perfect enchaine : boost * (1 + streak * streakBonus) */
    streakBonus: 0.15,
    /** Plafond du multiplicateur d'enchainement */
    streakMaxMult: 1.6,
  },

  // ------------------------------------------------------------------ Bosses
  pump: {
    /** Pomper = MAINTENIR bas dans les descentes des bosses, LACHER dans les montees.
     *  Part du temps de descente passee a pomper pour un perfect / un pump correct */
    perfectRatio: 0.6,
    okRatio: 0.15,
    /** Part maximale du temps de montee passee bouton appuye pour garder le perfect */
    maxWrongRatio: 0.45,
    /** Acceleration quand on pompe une descente (m/s²) */
    accel: 1.1,
    /** Perte de vitesse si on ne pompe pas du tout une bosse (m/s) */
    lossNoPump: 0.35,
  },

  // --------------------------------------------------------- Virages releves
  berm: {
    /** Dans les virages, seulement gauche / droite : on contre le deport vers l'exterieur.
     *  Perfect si on reste pres du centre de la ligne (fraction de la largeur) */
    perfectDeviation: 0.32,
    /** Deport vers l'exterieur dans les virages */
    driftGain: 0.15,
    /** Probabilite de schralp sur un virage parfait en tenant la direction vers l'interieur */
    schralpChance: 0.1,
    schralpBoost: 0.9,
    schralpHype: 15,
  },

  // ------------------------------------------------------------------ Sauts
  jump: {
    /** En dessous de cette vitesse on ne decolle pas (on roule le module) */
    minLaunchSpeed: 5,
    /** Tirer (haut) : multiplie la vitesse verticale et horizontale au decollage */
    pullVy: 1.28,
    pullVx: 1.06,
    /** Raser (bas) au decollage : reduit la vitesse verticale */
    scrubVy: 0.5,
    scrubVx: 0.9,
    /** Haut/bas pris en compte s'ils ont ete appuyes moins de N s avant la levre */
    actionWindow: 0.45,
    /** Gravite en l'air (un peu plus forte que la realite = plus nerveux) */
    gravity: 14,
    /** Reception, en fraction de la face de reception (0 = haut de la pente, 1 = bas).
     *  Perfect entre perfectMin et perfectMax, ok entre okMin et okMax,
     *  trop court = case (chute sur un gros saut), trop long au-dela de longMax = chute. */
    perfectMin: 0.08,
    perfectMax: 0.78,
    okMin: -0.3,
    okMax: 1.15,
    longMax: 1.5,
    /** Hauteur a partir de laquelle un saut case = chute */
    caseCrashHeight: 1.4,
    lossOk: 0.15,
    lossBad: 1.0,
  },

  // ------------------------------------------------------------------ Tricks
  trick: {
    /** Zone avant la levre ou lancer un trick = trop tot (m) */
    approachZone: 9,
    /** Fenetre de lancement d'un flip / 360 avant la levre (secondes) */
    takeoffWindow: 0.5,
    /** Delai pour detecter "Tricks + gauche" apres un appui Tricks en l'air */
    styleDelay: 0.12,
    /** Un trick est considere fini a partir de cette progression */
    landTolerance: 0.8,
    /** Hauteur minimale du module pour les flips et le 360 (m) */
    minFlipHeight: 1.5,
    /** Durees (s) et points de hype */
    list: {
      frontflip: { label: "FRONTFLIP", duration: 0.85, hype: 45 },
      backflip: { label: "BACKFLIP", duration: 0.85, hype: 40 },
      threesixty: { label: "360", duration: 0.75, hype: 35 },
      tailwhip: { label: "TAILWHIP", duration: 0.55, hype: 22 },
      suicide: { label: "SUICIDE NO HANDER", duration: 0.6, hype: 15 },
      tbog: { label: "T-BOG", duration: 0.5, hype: 12 },
      superman: { label: "SUPERMAN", duration: 0.65, hype: 18 },
      nofootcan: { label: "NO FOOT CAN", duration: 0.55, hype: 14 },
    },
  },

  // ------------------------------------------------------------------- Hype
  hype: {
    /** Duree du boost quand la barre est pleine (s) */
    boostDuration: 3.5,
    /** Acceleration pendant le boost (m/s²) */
    boostAccel: 1.8,
  },

  // ---------------------------------------------------------------- Direction
  steer: {
    /** Vitesse laterale max (m/s) */
    speed: 4.2,
    /** Tolerance hors piste avant la chute (m au-dela du bord) */
    offTrackTolerance: 0.3,
    /** Direction en l'air (fraction) */
    airControl: 0.25,
  },

  // --------------------------------------------------------------- Adversaire
  opponent: {
    /** Nombre de runs simules pour calibrer le temps de l'adversaire */
    calibrationRuns: 40,
    /** Multiplicateur global du temps de l'adversaire (>1 = plus lent) */
    timeFactor: 1.0,
    /** Proba que l'adversaire fasse un trick sur un gros saut (visuel) */
    trickChance: 0.5,
  },

  // ------------------------------------------------------------------- Camera
  camera: {
    distance: 5.6,
    height: 3.8,
    lookAhead: 8,
    /** Champ de vision horizontal (degres), adapte automatiquement a l'ecran vertical */
    fovBase: 76,
    minVerticalFov: 55,
    maxVerticalFov: 92,
    fovSpeedGain: 2.4, // degres de FOV en plus par m/s au-dessus de la croisiere
    smoothing: 6,
  },

  // ------------------------------------------------------------- Interface
  ui: {
    /** Petites fleches d'aide avant les sauts (haut = tirer, bas = raser) */
    jumpHints: true,
    /** Le bouton bas s'allume dans les descentes des bosses (aide au pompage) */
    pumpHints: true,
    countdownStep: 0.8,
  },

  // ----------------------------------------------------------------- Mobile
  input: {
    /** Distance de swipe (px) */
    swipeThreshold: 28,
    /** Distance du pouce gauche pour braquer a fond (px) */
    steerRange: 55,
  },
} as const;

export type TrickId = keyof typeof CONFIG.trick.list;
export const FLIP_TRICKS: TrickId[] = ["frontflip", "backflip", "threesixty"];
export const STYLE_TRICKS: TrickId[] = ["suicide", "tbog", "superman", "nofootcan"];
