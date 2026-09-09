/**
 * Recuperation automatique des infos d'un evenement HelloAsso a partir de son
 * lien public, via l'API officielle HelloAsso (v5).
 *
 * A partir du lien colle dans l'admin (ex.
 *   https://www.helloasso.com/associations/mon-asso/evenements/ma-course-2026 )
 * on extrait l'organisation et le formulaire, puis on interroge l'API pour
 * obtenir le nom, la date et le lieu.
 *
 * Necessite deux variables d'environnement (identifiants API HelloAsso) :
 *   HELLOASSO_CLIENT_ID
 *   HELLOASSO_CLIENT_SECRET
 * (voir GUIDE.md, section HelloAsso, pour les creer en 2 minutes).
 */

const TOKEN_URL = "https://api.helloasso.com/oauth2/token";
const API_BASE = "https://api.helloasso.com/v5";

// Mot du chemin d'URL -> type de formulaire HelloAsso
const TYPE_MAP = {
  evenements: "Event",
  adhesions: "Membership",
  collectes: "CrowdFunding",
  boutiques: "Shop",
  formulaires: "Donation",
};

// Cache du jeton en memoire (evite de le redemander a chaque requete)
let tokenCache = { value: null, expiresAt: 0 };

/**
 * Analyse un lien HelloAsso et renvoie { orgSlug, formType, formSlug }.
 * Renvoie null si le lien n'est pas reconnu.
 */
export function parseHelloAssoUrl(rawUrl) {
  const url = (rawUrl || "").trim();
  if (!url) return null;
  const m = url.match(/helloasso\.com\/associations\/([^/]+)\/([^/]+)\/([^/?#]+)/i);
  if (!m) return null;
  const [, orgSlug, typeWord, formSlug] = m;
  const formType = TYPE_MAP[typeWord.toLowerCase()] || "Event";
  return { orgSlug, formType, formSlug };
}

async function getToken() {
  const clientId = process.env.HELLOASSO_CLIENT_ID;
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("missing-credentials");
  }

  // Jeton encore valide en cache ?
  if (tokenCache.value && Date.now() < tokenCache.expiresAt - 30000) {
    return tokenCache.value;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`token-http-${res.status}`);

  const json = await res.json();
  tokenCache = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in || 1800) * 1000,
  };
  return tokenCache.value;
}

/**
 * Recupere les infos publiques d'un evenement HelloAsso.
 * Renvoie toujours un objet ; en cas de souci, `error` est renseigne et les
 * autres champs sont null (la page affichera un repli avec le bouton d'inscription).
 */
export async function fetchHelloAssoEvent(rawUrl) {
  const parsed = parseHelloAssoUrl(rawUrl);
  if (!parsed) return null;

  const base = {
    url: rawUrl.trim(),
    title: null,
    startDate: null,
    endDate: null,
    place: null,
    error: null,
  };

  try {
    const token = await getToken();
    const { orgSlug, formType, formSlug } = parsed;
    const endpoint = `${API_BASE}/organizations/${encodeURIComponent(
      orgSlug
    )}/forms/${formType}/${encodeURIComponent(formSlug)}/public`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      // Cache cote serveur 30 min : les infos d'un evenement changent rarement.
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { ...base, error: `api-http-${res.status}` };

    const data = await res.json();
    const place = data.place
      ? {
          name: data.place.name || null,
          address: data.place.address || null,
          city: data.place.city || null,
          zipCode: data.place.zipCode || null,
        }
      : null;

    return {
      ...base,
      title: data.title || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      place,
    };
  } catch (err) {
    return { ...base, error: err.message || "fetch-failed" };
  }
}

/** Formate une plage de dates en francais pour l'affichage. */
export function formatEventDate(startDate, endDate) {
  if (!startDate) return null;
  try {
    const start = new Date(startDate);
    const dateFmt = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeFmt = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    let out = dateFmt.format(start);
    // Ajoute l'heure de debut si elle n'est pas minuit pile
    if (start.getHours() !== 0 || start.getMinutes() !== 0) {
      out += ` a ${timeFmt.format(start)}`;
    }
    return out.charAt(0).toUpperCase() + out.slice(1);
  } catch {
    return null;
  }
}

/** Construit une chaine lisible pour le lieu. */
export function formatEventPlace(place) {
  if (!place) return null;
  const parts = [place.name, place.address, [place.zipCode, place.city].filter(Boolean).join(" ")];
  return parts.filter(Boolean).join(", ") || null;
}
