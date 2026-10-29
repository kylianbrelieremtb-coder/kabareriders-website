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
    /** Vitesse au "GO" (m/s) : on part quasi arrete, en pedalant */
    start: 2.5,
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
    /** Vitesse plancher (m/s), appliquee une fois lance (apres minAfter s de course) */
    min: 3,
    minAfter: 2,
    max: 17.5,
    /** Compteur : km/h affiches = m/s * 3.6 * displayScale */
    displayScale: 0.4,
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
    driftGain: 0.32,
    /** En haut du virage releve, le mur retient une partie du deport (fraction gardee) */
    driftHighLine: 1,
    /** Duree (s) pendant laquelle le deport s'estompe en sortie de virage */
    exitFade: 0.15,
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

  // --------------------------------------------------------------- Bunny up
  hop: {
    /** Bunny up = pomper (bas) puis extension (haut) rapidement : vitesse verticale (m/s) */
    vy: 3.4,
    /** Delai max entre la compression (bas) et l'extension (haut) pour decoller (s) */
    popWindow: 0.35,
    /** Extension sur la face montante d'une bosse : le pompage suivant est plus efficace */
    extensionPump: 1.35,
    /** Pres d'une levre (en secondes avant), haut = tirer le saut, pas de bunny up */
    lipGuard: 0.6,
    /** Bas en l'air : plaque le velo au sol (gravite en plus, fraction) */
    pushGravity: 1.1,
    /** Reception d'un bunny up dans une descente : gain de vitesse ; sur une montee : perte */
    backsideBoost: 0.5,
    frontLoss: 0.8,
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
      frontflip: { label: "FRONTFLIP", duration: 0.85, hype: 45, boost: 2.2 },
      backflip: { label: "BACKFLIP", duration: 0.85, hype: 40, boost: 2.2 },
      threesixty: { label: "360", duration: 0.75, hype: 35, boost: 1.9 },
      threesixtyL: { label: "360", duration: 0.75, hype: 35, boost: 1.9 },
      tailwhip: { label: "TAILWHIP", duration: 0.55, hype: 22, boost: 1.5 },
      suicide: { label: "SUICIDE NO HANDER", duration: 0.6, hype: 15, boost: 1.0 },
      tabletop: { label: "TABLE TOP", duration: 0.55, hype: 14, boost: 1.0 },
      tbog: { label: "T-BOG", duration: 0.55, hype: 13, boost: 1.0 },
      superman: { label: "SUPERMAN", duration: 0.65, hype: 18, boost: 1.1 },
      nofootcan: { label: "NO FOOT CAN", duration: 0.55, hype: 14, boost: 1.0 },
    },
  },

  // ------------------------------------------------------------------- Hype
  hype: {
    /** Mini-turbo apres une figure posee (facon Mario Kart) : chaque figure ajoute
     *  sa valeur `boost` (m/s, dans trick.list) puis pousse encore pendant `boostDuration` s */
    boostDuration: 0.9,
    boostAccel: 1.5,
  },

  // ------------------------------------------- Joystick : poids avant et schralp
  lean: {
    /** Diagonale haute : poids sur l'avant, un peu plus de vitesse... */
    accel: 0.6,
    /** ...mais au bout de N secondes dans cette position : OTB (soleil par-dessus le guidon) */
    otbTime: 3,
  },
  schralp: {
    /** Schralp : arriver tres vite, couper d'un coup tout a la corde en poussant en bas vers
     *  l'interieur. Position mini dans la ligne (-1 = tout a l'interieur) */
    deepLine: -0.45,
    /** Coup de guidon : vitesse laterale vers l'interieur (m/s) atteinte dans les dernieres... */
    flickSpeed: 2.6,
    /** ...N secondes */
    flickWindow: 0.8,
    hold: 0.12,
    boost: 0.9,
  },

  // -------------------------------------------------------- Choix de ligne
  lines: {
    /** Dans les virages : interieur = plus court, mais adherence limitee ; exterieur (haut du
     *  virage releve) = plus long, mais on garde toute sa vitesse et on peut pomper le mur.
     *  Allongement du trajet selon la position dans la ligne (1 = geometrie reelle) */
    pathFactor: 1.2,
    /** Adherence laterale a plat (m/s²) : demande = vitesse² x courbure de la trajectoire.
     *  Une courbe reguliere reste sous la limite ; un angle serre ou trop de vitesse a la corde la depasse */
    grip: 13.5,
    /** Adherence en plus par metre de devers sous les roues (le haut du mur tient mieux) */
    bankGrip: 7,
    /** Au-dela de l'adherence : perte de vitesse et poussee vers l'exterieur, par m/s² d'exces */
    lossGain: 0.15,
    pushGain: 0.6,
    pushMax: 2.5,
    /** Derapage franc (popup) quand la demande depasse l'adherence de ce facteur */
    skidRatio: 1.3,
    /** Poids des coups de guidon dans la courbure de trajectoire (braquer d'un coup = angle serre) */
    sharpness: 3,
    /** Lissage de la courbure de trajectoire (s) */
    curvSmooth: 0.12,
    /** Pomper le haut du virage (bas maintenu sur la ligne exterieure) */
    bankPump: 1.2,
    /** Rollers sautes en double : bonus a la reception dans la descente */
    doubleBoost: 1.2,
  },

  // ---------------------------------------------------------------- Direction
  steer: {
    /** Vitesse laterale max (m/s) = base + parV * vitesse : plus on va vite, plus le guidon repond */
    speed: 4.2,
    speedBase: 1.6,
    speedPerV: 0.3,
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
export const FLIP_TRICKS: TrickId[] = ["frontflip", "backflip", "threesixty", "threesixtyL"];
/** Tricks aleatoires (appui sur le joystick en l'air) */
export const STYLE_TRICKS: TrickId[] = ["suicide", "tabletop", "tbog", "superman", "nofootcan", "tailwhip"];
