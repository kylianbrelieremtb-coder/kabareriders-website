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
};

function normalizeEvents(events) {
  return {
    lien_helloasso: events?.lien_helloasso || "",
    passes: Array.isArray(events?.passes) ? events.passes : [],
  };
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
  };
  await writeRaw(JSON.stringify(data, null, 2));
  return data;
}
