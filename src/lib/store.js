import fs from "fs";
import path from "path";

/**
 * Stockage du contenu editable (videos / liens / evenements).
 *
 * Source de verite = le fichier data/content.json du depot (livre avec le site).
 * Avantages : aucune dependance a un stockage externe, aucune bande passante
 * consommee (le contenu fait partie du deploiement), jamais bloque.
 *
 * Les videos ne sont PLUS hebergees ici : on utilise des liens Vimeo (fonds)
 * ou YouTube (videos a cliquer). Le stockage ne sert donc qu'a du texte + de
 * petites images, servis par le CDN de Vercel.
 */

const CONTENT_PATH = path.join(process.cwd(), "data", "content.json");

/** Renvoie le contenu brut (chaine JSON) ou null. */
export async function readRaw() {
  try {
    return fs.readFileSync(CONTENT_PATH, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Ecrit le contenu. Fonctionne en local (fichier).
 * En ligne sur Vercel, le systeme de fichiers est en lecture seule :
 * les modifications se font en editant data/content.json puis en republiant
 * (via GitHub Desktop) - voir GUIDE.md.
 */
export async function writeRaw(str) {
  fs.writeFileSync(CONTENT_PATH, str, "utf-8");
}

/**
 * Enregistre une image (logo, poster) dans public/images/ et renvoie son chemin.
 * En local uniquement ; en ligne, deposer les images dans public/images/ via
 * le depot (elles sont alors servies par le CDN de Vercel, sans bande passante Blob).
 */
export async function putAsset(filename, data) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const imagesDir = path.join(process.cwd(), "public", "images");
  fs.mkdirSync(imagesDir, { recursive: true });
  const unique = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(imagesDir, unique), Buffer.from(data));
  return `/images/${unique}`;
}
