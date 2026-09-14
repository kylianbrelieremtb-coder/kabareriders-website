import { readRaw, writeRaw } from "@/lib/store";

const DEFAULT_CONTENT = {
  logo: "",
  videos: {},
  links: [],
  events: {
    // Un SEUL evenement a venir a la fois : il suffit de coller son lien HelloAsso.
    lien_helloasso: "",
    // Evenements termines : liste de { id, label, url } (liens vers les resultats).
    passes: [],
  },
  // Liens "A voir aussi" par realisation : { [cleRealisation]: [{ id, label, url }] }
  realisationLinks: {},
};

function normalizeEvents(events) {
  return {
    lien_helloasso: events?.lien_helloasso || "",
    passes: Array.isArray(events?.passes) ? events.passes : [],
  };
}

function normalizeRealisationLinks(obj) {
  const out = {};
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) out[key] = obj[key];
    }
  }
  return out;
}

/**
 * Lit le contenu editable (videos + liens + evenements).
 * Asynchrone : la source peut etre le fichier local ou Vercel Blob (voir store.js).
 * A utiliser cote serveur uniquement (Server Components / API routes) :
 *   const { videos, links, events } = await getContent();
 */
export async function getContent() {
  try {
    const raw = await readRaw();
    if (!raw) return DEFAULT_CONTENT;
    const parsed = JSON.parse(raw);
    return {
      logo: parsed.logo || "",
      videos: parsed.videos || {},
      links: parsed.links || [],
      events: normalizeEvents(parsed.events),
      realisationLinks: normalizeRealisationLinks(parsed.realisationLinks),
    };
  } catch (err) {
    return DEFAULT_CONTENT;
  }
}

/**
 * Ecrit le contenu (utilise par l'espace admin).
 * Fonctionne en local (fichier) et en ligne sur Vercel (Blob).
 */
export async function saveContent(next) {
  const data = {
    logo: next.logo || "",
    videos: next.videos || {},
    links: next.links || [],
    events: normalizeEvents(next.events),
    realisationLinks: normalizeRealisationLinks(next.realisationLinks),
  };
  await writeRaw(JSON.stringify(data, null, 2));
  return data;
}
