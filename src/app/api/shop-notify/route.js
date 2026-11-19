import { NextResponse, after } from "next/server";
import { z } from "zod";
import { limiterParIp } from "@/lib/ratelimit";
import { envoyerAlerteShop } from "@/lib/emails";

// Envoi d'email => toujours dynamique, jamais mis en cache.
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const Schema = z.object({
  email: z.string().trim().regex(EMAIL_RE).max(160),
  // Honeypot anti-robots
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
  const { ok } = await limiterParIp(ipDe(request), {
    limite: 5,
    fenetreSecondes: 3600,
    espace: "shop",
  });
  if (!ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans un moment." },
      { status: 429 }
    );
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  // Envoi APRÈS la réponse : le visiteur n'attend pas, et une erreur d'envoi
  // est journalisée sans être visible côté client.
  after(async () => {
    try {
      await envoyerAlerteShop(parsed.data.email);
    } catch (err) {
      console.error("[shop-notify] échec alerte:", err?.message || err);
    }
  });

  return NextResponse.json({ ok: true });
}
