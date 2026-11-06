import { existsSync } from "fs";
import path from "path";
import Link from "next/link";

export const metadata = {
  title: "Roule la piste, le jeu de Dual VTT",
  description:
    "Roule la piste : le jeu de Dual VTT gratuit de Kabare Riders. Affronte un adversaire sur nos vraies pistes, du 16e de finale à la finale.",
};

// Le jeu est un build statique copie dans public/jeu/ (index.html + assets).
const GAME_SRC = "/jeu/index.html";

export default function JeuPage() {
  const gameReady = existsSync(path.join(process.cwd(), "public", "jeu", "index.html"));

  return (
    <section className="bg-marron">
      {gameReady ? (
        <iframe
          src={GAME_SRC}
          title="Roule la piste, jeu de Dual VTT"
          className="block h-[calc(100svh-4.25rem)] w-full border-0 md:h-[calc(100svh-5rem)]"
          allow="fullscreen; autoplay; gamepad"
          allowFullScreen
        />
      ) : (
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center text-beige">
          <h1 className="font-title text-5xl">Roule la piste</h1>
          <p className="mt-4 text-lg text-beige/85">
            Le jeu arrive très bientôt. Reviens dans quelques jours pour rouler nos pistes en Dual.
          </p>
          <Link
            href="/realisations"
            className="mt-8 rounded-full bg-ocre px-8 py-3 font-title text-xl shadow-lg transition-transform hover:scale-105"
          >
            En attendant, voir nos pistes
          </Link>
        </div>
      )}
    </section>
  );
}
