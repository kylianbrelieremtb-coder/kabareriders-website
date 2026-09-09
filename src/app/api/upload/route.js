import { NextResponse } from "next/server";
import { putAsset } from "@/lib/store";

// Upload d'un fichier (logo, image) - protege par le mot de passe admin.
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

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Aucun fichier recu." }, { status: 400 });
  }

  // Limite de taille (5 Mo) et type image
  const MAX = 5 * 1024 * 1024;
  if (file.size > MAX) {
    return NextResponse.json({ error: "Fichier trop lourd (max 5 Mo)." }, { status: 400 });
  }
  const type = file.type || "application/octet-stream";
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit etre une image." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const url = await putAsset(file.name || "logo.png", buffer, type);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: "Echec de l'enregistrement du fichier." },
      { status: 500 }
    );
  }
}
