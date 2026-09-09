import Link from "next/link";
import { parseVideoSource, youtubeEmbedUrl, vimeoEmbedUrl } from "@/lib/video";

/**
 * Section d'ouverture plein ecran avec video de fond en boucle, son coupe.
 * Accepte un fichier .mp4 (ideal pour un fond) ou un lien YouTube/Vimeo.
 * Sans video, un degrade aux couleurs de la marque prend le relais.
 */
export default function Hero({ video }) {
  const parsed = parseVideoSource(video?.src);
  const poster = video?.poster?.trim();

  let background = null;
  if (parsed.type === "file") {
    background = (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={poster || undefined}
      >
        <source src={parsed.src} />
      </video>
    );
  } else if (parsed.type === "youtube" || parsed.type === "vimeo") {
    const embed =
      parsed.type === "youtube"
        ? youtubeEmbedUrl(parsed.id, { background: true })
        : vimeoEmbedUrl(parsed.id, { background: true });
    background = (
      <iframe
        className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        src={embed}
        title="Video de fond Kabare Riders"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
      />
    );
  } else {
    background = <div className="absolute inset-0 bg-gradient-to-br from-marron via-ocre to-vert" />;
  }

  return (
    <section className="relative flex h-[92vh] min-h-[560px] w-full items-center justify-center overflow-hidden">
      {background}

      {/* Voile sombre pour la lisibilite */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Contenu */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-beige">
        <h1 className="font-title text-4xl leading-tight drop-shadow-lg sm:text-6xl md:text-7xl">
          Kabare Riders, on construit et on fait vivre le VTT
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-beige/90 drop-shadow sm:text-xl">
          Creation de pistes, evenements et shows VTT dans le Luberon
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/realisations"
            className="rounded-full bg-ocre px-8 py-3 font-title text-xl text-beige shadow-lg transition-transform hover:scale-105"
          >
            Decouvrir nos realisations
          </Link>
          <Link
            href="/contact"
            className="rounded-full border-2 border-beige bg-transparent px-8 py-3 font-title text-xl text-beige transition-colors hover:bg-beige hover:text-marron"
          >
            Reserver un appel
          </Link>
        </div>
      </div>
    </section>
  );
}
