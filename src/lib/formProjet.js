/**
 * Source unique du formulaire de qualification (page Contact).
 * Partagé par le composant client (rendu) et la route API (validation + emails),
 * pour que les questions, options et libellés restent cohérents des deux côtés.
 *
 * Aucun prix, aucun pourcentage, aucune promesse d'éligibilité ici : les tranches
 * d'enveloppe sont des CHOIX de l'utilisateur, pas des tarifs affichés.
 */

// --- Choix à boutons radio (value = ce qu'on enregistre, hint = sous-texte) ---

export const PROFILS = [
  { value: "Collectivité", hint: "Commune, communauté de communes, département" },
  { value: "Station ou bike park", hint: "Domaine, remontées mécaniques, office de tourisme" },
  { value: "Club ou association", hint: "Club VTT, comité départemental" },
  { value: "Entreprise ou marque", hint: "Camping, domaine privé, marque sport" },
];

export const TYPES = [
  { value: "Pumptrack", hint: "Boucle de bosses et virages, tous âges" },
  { value: "Piste de dual ou 4X", hint: "Tracés parallèles, virages relevés et sauts" },
  { value: "Descente ou enduro", hint: "Tracé en pente, naturel ou façonné" },
  { value: "Cross-country", hint: "Boucle roulante, montées et descentes" },
  { value: "Zone d'initiation", hint: "Pour les enfants et les débutants" },
  { value: "Bike park complet", hint: "Plusieurs pistes et niveaux sur un même site" },
  { value: "Événement ou show", hint: "Course, démonstration, initiation airbag" },
  { value: "Encore à définir", hint: "On en discute et on vous oriente" },
];

// L'unité de la question « taille » change selon le type de projet.
export const TAILLES = {
  surface: [
    { value: "Moins de 500 m²", hint: "L'équivalent d'un petit terrain de sport" },
    { value: "500 à 1 500 m²", hint: "La taille la plus courante" },
    { value: "1 500 à 3 000 m²", hint: "Un vrai site de pratique" },
    { value: "Plus de 3 000 m²", hint: "Un site d'envergure" },
    { value: "Surface inconnue", hint: "Je ne sais pas encore" },
  ],
  longueur: [
    { value: "Moins de 200 m", hint: "Un tracé court" },
    { value: "200 à 500 m", hint: "La longueur la plus courante" },
    { value: "500 m à 1 km", hint: "Une descente complète" },
    { value: "Plus d'1 km", hint: "Un grand tracé ou plusieurs pistes" },
    { value: "Longueur inconnue", hint: "Je ne sais pas encore" },
  ],
  public: [
    { value: "Moins de 200 personnes", hint: "Animation locale" },
    { value: "200 à 1 000 personnes", hint: "Événement de village ou de station" },
    { value: "1 000 à 3 000 personnes", hint: "Gros événement" },
    { value: "Plus de 3 000 personnes", hint: "Événement majeur" },
    { value: "Affluence inconnue", hint: "Je ne sais pas encore" },
  ],
};

export const RELIEFS = [
  { value: "Pente naturelle existante", hint: "Colline, forêt, front de neige" },
  { value: "Terrain plat", hint: "Tout le relief est à créer" },
  { value: "Site non défini", hint: "On peut vous aider à le choisir" },
];

export const ACCES = [
  { value: "Accès dégagé", hint: "" },
  { value: "Accès difficile", hint: "Sentier étroit, forte pente, zone protégée" },
  { value: "Accès à vérifier", hint: "" },
];

export const STADES = [
  { value: "Idée à explorer", hint: "Rien n'est arbitré" },
  { value: "Projet cadré, budget non voté", hint: "On cherche à chiffrer pour le présenter" },
  { value: "Budget voté", hint: "On cherche un prestataire" },
  { value: "Consultation ou marché en cours", hint: "On répond à une procédure" },
];

export const FONCIERS = [
  { value: "Terrain disponible", hint: "" },
  { value: "Terrain en discussion", hint: "" },
  { value: "Foncier non traité", hint: "" },
];

export const BUDGETS = [
  { value: "Moins de 20 000 €", hint: "" },
  { value: "20 000 à 50 000 €", hint: "" },
  { value: "50 000 à 100 000 €", hint: "" },
  { value: "Plus de 100 000 €", hint: "" },
  { value: "Pas encore d'enveloppe", hint: "On en discute lors de l'appel" },
];

export const ECHEANCES = [
  { value: "Dans les 6 mois", hint: "" },
  { value: "Cette année", hint: "" },
  { value: "L'an prochain", hint: "" },
  { value: "Pas de date", hint: "" },
];

export const CRENEAUX = [
  { value: "8h – 12h", hint: "" },
  { value: "12h – 14h", hint: "" },
  { value: "14h – 17h", hint: "" },
  { value: "17h – 19h", hint: "" },
];

// --- Libellés affichés (récap + email), dans l'ordre de lecture ---
export const ETIQUETTES = {
  profil: "Structure",
  type: "Type de projet",
  taille: "Dimensions",
  relief: "Terrain",
  acces: "Accès",
  stade: "Stade du projet",
  foncier: "Foncier",
  budget: "Enveloppe",
  echeance: "Échéance",
  creneau: "Créneau d'appel souhaité",
};

// Champs radio obligatoires (toutes les questions à choix).
export const CHAMPS_RADIO = [
  "profil",
  "type",
  "taille",
  "relief",
  "acces",
  "stade",
  "foncier",
  "budget",
  "echeance",
  "creneau",
];

/** Mode de la question « taille » selon le type de projet. */
export function modeTaille(type) {
  if (type === "Événement ou show") return "public";
  if (type === "Descente ou enduro" || type === "Cross-country") return "longueur";
  return "surface";
}

/** Intitulé de la question « taille » selon le mode. */
export function legendeTaille(mode) {
  if (mode === "public") return "Quelle affluence attendez-vous ?";
  if (mode === "longueur") return "Quelle longueur de tracé ?";
  return "Quelle surface avez-vous ?";
}

/** Toutes les valeurs de taille possibles (pour la validation serveur). */
export const TOUTES_TAILLES = [
  ...TAILLES.surface,
  ...TAILLES.longueur,
  ...TAILLES.public,
].map((o) => o.value);

/** Valeurs autorisées par champ radio (pour la validation serveur). */
export const VALEURS = {
  profil: PROFILS.map((o) => o.value),
  type: TYPES.map((o) => o.value),
  taille: TOUTES_TAILLES,
  relief: RELIEFS.map((o) => o.value),
  acces: ACCES.map((o) => o.value),
  stade: STADES.map((o) => o.value),
  foncier: FONCIERS.map((o) => o.value),
  budget: BUDGETS.map((o) => o.value),
  echeance: ECHEANCES.map((o) => o.value),
  creneau: CRENEAUX.map((o) => o.value),
};
