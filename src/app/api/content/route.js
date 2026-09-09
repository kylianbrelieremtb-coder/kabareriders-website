import { NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";

// Le contenu (videos/liens) est deja public sur le site, donc GET est ouvert.
export async function GET() {
  return NextResponse.json(await getContent());
}

// La sauvegarde exige le mot de passe admin.
export async function POST(request) {
  const password = request.headers.get("x-admin-password") || "";
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD n'est pas configure sur le serveur." },
      { status: 500 }
    );
  }
  if (password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }

  try {
    const saved = await saveContent(body);
    return NextResponse.json({ ok: true, content: saved });
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer le contenu (stockage indisponible)." },
      { status: 500 }
    );
  }
}
