import { Redis } from "@upstash/redis";

/**
 * Limitation simple par IP (fenêtre fixe) sur la base Redis Upstash déjà branchée.
 * En local (pas de base configurée), aucune limite n'est appliquée.
 */

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * @param {string} ip        Adresse IP de l'appelant.
 * @param {object} options   { limite = 5, fenetreSecondes = 3600 }
 * @returns {Promise<{ok: boolean}>}
 */
export async function limiterParIp(ip, { limite = 5, fenetreSecondes = 3600 } = {}) {
  const redis = getRedis();
  if (!redis || !ip) return { ok: true };
  try {
    const cle = `rl:contact:${ip}`;
    const n = await redis.incr(cle);
    if (n === 1) await redis.expire(cle, fenetreSecondes);
    return { ok: n <= limite };
  } catch {
    // En cas de souci avec la base, on ne bloque pas l'envoi.
    return { ok: true };
  }
}
