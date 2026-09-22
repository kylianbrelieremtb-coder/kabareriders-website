import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

/**
 * Stockage du contenu editable (videos / liens / evenements / logo).
 *
 * Deux sources possibles :
 *  1. Une base Redis Upstash (quand les variables d'environnement sont presentes) :
 *     c'est le cas EN LIGNE sur Vercel. L'espace admin peut alors enregistrer,
 *     car on ecrit dans la base (et non dans les fichiers, en lecture seule sur Vercel).
 *     Le contenu est du texte (quelques Ko) => aucun souci de bande passante.
 *  2. Le fichier data/content.json du depot : utilise EN LOCAL (npm run dev) et
 *     comme contenu par defaut tant que la base est vide.
 *
 * Les videos ne sont PLUS hebergees ici : liens Cloudinary (fonds) ou YouTube.
 */

const CONTENT_PATH = path.join(process.cwd(), "data", "content.json");
const KV_KEY = "kabare:content";

/** Renvoie un client Redis si les variables d'env sont configurees, sinon null. */
function getRedis() {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Lit le contenu du fichier du depot (contenu par defaut). */
function readFile() {
  try {
    return fs.readFileSync(CONTENT_PATH, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Renvoie le contenu brut (chaine JSON) ou null.
 * Priorite a la base Redis ; repli sur le fichier du depot si la base est vide.
 */
export async function readRaw() {
  const redis = getRedis();
  if (redis) {
    try {
      const value = await redis.get(KV_KEY);
      if (value) {
        // Upstash peut renvoyer un objet deja deserialise : on renormalise en JSON.
        return typeof value === "string" ? value : JSON.stringify(value);
      }
    } catch {
      // En cas de souci avec la base, on retombe sur le fichier ci-dessous.
    }
  }
  return readFile();
}

/**
 * Ecrit le contenu.
 *  - En ligne (base configuree) : ecrit dans Redis => l'admin persiste.
 *  - En local (pas de base) : ecrit dans data/content.json.
 */
export async function writeRaw(str) {
  const redis = getRedis();
  if (redis) {
    await redis.set(KV_KEY, str);
    return;
  }
  fs.writeFileSync(CONTENT_PATH, str, "utf-8");
}

/**
 * Enregistre une image (logo, poster) dans public/images/ et renvoie son chemin.
 * Fonctionne EN LOCAL uniquement. En ligne, le systeme de fichiers est en lecture
 * seule : pour changer le logo/poster, deposer l'image dans public/images/ via le
 * depot (elle est alors servie par le CDN de Vercel, sans bande passante).
 */
export async function putAsset(filename, data) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const imagesDir = path.join(process.cwd(), "public", "images");
  fs.mkdirSync(imagesDir, { recursive: true });
  const unique = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(imagesDir, unique), Buffer.from(data));
  return `/images/${unique}`;
}
