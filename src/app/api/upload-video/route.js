import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Upload de fichiers volumineux (videos) via Vercel Blob "client upload".
 * Le navigateur envoie le fichier directement a Blob (pas de limite 4,5 Mo
 * des routes serveur). Cette route ne fait que : (1) verifier le mot de passe
 * admin, (2) delivrer un jeton d'upload.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const expected = process.env.ADMIN_PASSWORD || "";
        if (!expected || clientPayload !== expected) {
          throw new Error("Mot de passe incorrect.");
        }
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ],
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 Mo
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Rien a faire ici : le navigateur recupere l'URL directement.
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Echec de l'upload." },
      { status: 400 }
    );
  }
}
