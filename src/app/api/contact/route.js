import { NextResponse, after } from "next/server";
import { z } from "zod";
import { VALEURS } from "@/lib/formProjet";
import { limiterParIp } from "@/lib/ratelimit";
import { envoyerNotification, envoyerConfirmation } from "@/lib/emails";

// Envoi d'emails => toujours dynamique, jamais mis en cache.
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const dans = (champ) => z.string().refine((v) => VALEURS[champ].includes(v), {
  message: `Valeur invalide pour ${champ}`,
});

const Schema = z.object({
  // Questions à choix (obligatoires)
  profil: dans("profil"),
  type: dans("type"),
  taille: dans("taille"),
  relief: dans("relief"),
  acces: dans("acces"),
  stade: dans("stade"),
  foncier: dans("foncier"),
  budget: dans("budget"),
  echeance: dans("echeance"),
  creneau: dans("creneau"),
  // Coordonnées
  prenom: z.string().trim().min(1).max(80),
  nom: z.string().trim().min(1).max(80),
  email: z.string().trim().regex(EMAIL_RE).max(160),
  commune: z.string().trim().min(1).max(120),
  // Facultatifs
  orga: z.string().trim().max(120).optional().default(""),
  fonction: z.string().trim().max(120).optional().default(""),
  tel: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().max(4000).optional().default(""),
  // Honeypot
  site: z.string().optional().default(""),
});

function ipDe(request) {
  const xff = request.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  // Piège à robots : on répond OK sans rien envoyer.
  if (body && body.site) {
    return NextResponse.json({ ok: true });
  }

  // Limitation par IP (best effort ; ne bloque pas si la base est indisponible).
  const { ok } = await limiterParIp(ipDe(request), { limite: 5, fenetreSecondes: 3600 });
  if (!ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans un moment." },
      { status: 429 }
    );
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire incomplet ou invalide." }, { status: 400 });
  }
  const data = parsed.data;

  // Envoi des emails APRÈS la réponse : le visiteur n'attend pas, et une erreur
  // d'envoi est journalisée sans être visible côté client.
  after(async () => {
    try {
      await envoyerNotification(data);
    } catch (err) {
      console.error("[contact] échec notification:", err?.message || err);
    }
    try {
      await envoyerConfirmation(data);
    } catch (err) {
      console.error("[contact] échec confirmation:", err?.message || err);
    }
  });

  return NextResponse.json({ ok: true });
}
