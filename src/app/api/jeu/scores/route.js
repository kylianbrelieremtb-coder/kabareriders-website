import { Redis } from "@upstash/redis";
import { limiterParIp } from "@/lib/ratelimit";

/**
 * Classement du jeu « Roule la piste » : meilleur temps de chaque joueur, par piste.
 *
 *  GET  /api/jeu/scores?piste=<id>&nom=<prenom>  -> top 10 + rang du joueur
 *  POST /api/jeu/scores  { piste, nom, temps }    -> enregistre le temps s'il bat le precedent
 *
 * Stockage dans la base Redis Upstash du site :
 *  - jeu:classement:<piste>  ensemble trie (membre = prenom normalise, score = temps en s)
 *  - jeu:noms                prenom normalise -> prenom tel qu'il a ete ecrit
 * En local sans base configuree : 503, le jeu masque alors le classement.
 */

export const dynamic = "force-dynamic";

const PISTES = ["apt-dual", "loudenvielle", "peisey-vallandry", "crankabare", "kabare-enduro", "courchevel"];
const NOM_RE = /^[\p{L}\p{N}][\p{L}\p{N} '.\-]{0,15}$/u;
const TEMPS_MIN = 8;
const TEMPS_MAX = 300;
const TOP = 10;

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function ipDe(request) {
  const xff = request.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
}

/** Prenom affiche : espaces resserres, 16 caracteres max. null si invalide. */
function nettoyerNom(nom) {
  if (typeof nom !== "string") return null;
  const n = nom.trim().replace(/\s+/g, " ");
  return NOM_RE.test(n) ? n : null;
}

/** Cle du joueur : minuscules, sans accents (« Élodie » et « elodie » = meme joueur). */
function cleDe(nom) {
  return nom.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const erreur = (message, status) => Response.json({ error: message }, { status });

/** Top 10 de la piste, nombre de joueurs et place du joueur `cle` (si fournie). */
async function classement(redis, piste, cle) {
  const k = `jeu:classement:${piste}`;
  const [top, total] = await Promise.all([redis.zrange(k, 0, TOP - 1, { withScores: true }), redis.zcard(k)]);
  const membres = [];
  for (let i = 0; i < top.length; i += 2) membres.push({ cle: String(top[i]), temps: Number(top[i + 1]) });
  const noms = membres.length ? await redis.hmget("jeu:noms", ...membres.map((m) => m.cle)) : {};
  const liste = membres.map((m, i) => ({ rang: i + 1, nom: String(noms?.[m.cle] ?? m.cle), temps: m.temps, moi: m.cle === cle }));
  let moi = null;
  if (cle) {
    const [rang, temps] = await Promise.all([redis.zrank(k, cle), redis.zscore(k, cle)]);
    if (rang !== null && temps !== null) moi = { rang: rang + 1, temps: Number(temps) };
  }
  return { piste, total, top: liste, moi };
}

export async function GET(request) {
  const redis = getRedis();
  if (!redis) return erreur("Classement indisponible", 503);
  const params = request.nextUrl.searchParams;
  const piste = params.get("piste");
  if (!PISTES.includes(piste)) return erreur("Piste inconnue", 400);
  const nom = nettoyerNom(params.get("nom") ?? "");
  try {
    return Response.json(await classement(redis, piste, nom ? cleDe(nom) : null));
  } catch {
    return erreur("Classement indisponible", 503);
  }
}

export async function POST(request) {
  const redis = getRedis();
  if (!redis) return erreur("Classement indisponible", 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return erreur("Requete invalide", 400);
  }
  const piste = body?.piste;
  const nom = nettoyerNom(body?.nom);
  const temps = Math.round(Number(body?.temps) * 100) / 100;
  if (!PISTES.includes(piste)) return erreur("Piste inconnue", 400);
  if (!nom) return erreur("Prénom invalide", 400);
  if (!(temps >= TEMPS_MIN && temps <= TEMPS_MAX)) return erreur("Temps invalide", 400);

  const { ok } = await limiterParIp(ipDe(request), { limite: 60, fenetreSecondes: 3600, espace: "jeu" });
  if (!ok) return erreur("Trop d'envois, réessaie plus tard", 429);

  const cle = cleDe(nom);
  try {
    // lt : on ne garde que le meilleur temps du joueur (un nouveau joueur est toujours ajoute)
    await Promise.all([
      redis.zadd(`jeu:classement:${piste}`, { lt: true }, { score: temps, member: cle }),
      redis.hset("jeu:noms", { [cle]: nom }),
    ]);
    return Response.json(await classement(redis, piste, cle));
  } catch {
    return erreur("Classement indisponible", 503);
  }
}
