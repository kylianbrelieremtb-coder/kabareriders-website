import fs from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

/**
 * Couche de stockage du contenu editable (videos / liens / evenements).
 *
 * - En LOCAL (npm run dev) ou sur un hebergeur a disque persistant :
 *   lecture/ecriture dans le fichier data/content.json.
 * - EN LIGNE sur Vercel (systeme de fichiers en lecture seule) :
 *   lecture/ecriture via Vercel Blob, active des que la variable
 *   BLOB_READ_WRITE_TOKEN est presente (injectee par Vercel quand un
 *   store Blob est connecte au projet - voir GUIDE.md).
 */

const CONTENT_PATH = path.join(process.cwd(), "data", "content.json");
const BLOB_KEY = "content.json";

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

function readFileSafe() {
  try {
    return fs.readFileSync(CONTENT_PATH, "utf-8");
  } catch {
    return null;
  }
}

/** Renvoie le contenu brut (chaine JSON) ou null. */
export async function readRaw() {
  if (useBlob()) {
    try {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      const blob = blobs.find((b) => b.pathname === BLOB_KEY) || blobs[0];
      if (blob) {
        const res = await fetch(blob.url, { cache: "no-store" });
        if (res.ok) return await res.text();
      }
    } catch {
      // ignore et retombe sur le fichier livre par defaut
    }
    // Aucun blob encore enregistre : on sert le contenu par defaut du depot.
    return readFileSafe();
  }
  return readFileSafe();
}

/** Ecrit le contenu brut (chaine JSON). */
export async function writeRaw(str) {
  if (useBlob()) {
    await put(BLOB_KEY, str, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  fs.writeFileSync(CONTENT_PATH, str, "utf-8");
}

/**
 * Enregistre un fichier (image du logo, etc.) et renvoie son URL publique.
 * - En ligne (Vercel Blob) : stocke le fichier dans le Blob et renvoie son URL.
 * - En local : ecrit dans public/images/ et renvoie /images/<nom>.
 */
export async function putAsset(filename, data, contentType) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (useBlob()) {
    const { url } = await put(`assets/${safe}`, data, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return url;
  }
  const imagesDir = path.join(process.cwd(), "public", "images");
  fs.mkdirSync(imagesDir, { recursive: true });
  const unique = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(imagesDir, unique), Buffer.from(data));
  return `/images/${unique}`;
}
