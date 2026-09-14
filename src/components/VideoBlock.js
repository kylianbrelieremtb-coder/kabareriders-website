import { parseVideoSource, youtubeEmbedUrl, vimeoEmbedUrl } from "@/lib/video";

/**
 * Bloc video.
 * Props :
 *  - square : true => format carre (1:1), sinon 16:9
 *  - background : true => lecture auto, en boucle, muet, sans controles (comme le hero) ;
 *                 false => lecteur classique avec controles (clic pour lancer, avec son)
 */
export default function VideoBlock({ video, className = "", square = false, background = false }) {
  const parsed = parseVideoSource(video?.src);
  const poster = video?.poster?.trim();
  const aspect = square ? "aspect-square" : "aspect-video";

  // Aucune source : emplacement (placeholder)
  if (parsed.type === "none") {
    return (
      <div
        className={`flex ${aspect} w-full items-center justify-center rounded-2xl border-2 border-dashed border-marron/30 bg-beige/60 ${className}`}
      >
        <div className="px-6 text-center">
          <p className="font-title text-2xl text-ocre">Emplacement vidéo</p>
          <p className="mt-1 text-sm text-marron/70">
            {video?.label || "À ajouter depuis l'espace admin"}
          </p>
        </div>
      </div>
    );
  }

  // YouTube / Vimeo
  if (parsed.type === "youtube" || parsed.type === "vimeo") {
    const embed =
      parsed.type === "youtube"
        ? youtubeEmbedUrl(parsed.id, { background })
        : vimeoEmbedUrl(parsed.id, { background });

    if (background) {
      // Recouvre le cadre (crop) pour eviter les bandes noires, sans controles
      const cover = square
        ? "h-full w-[178%] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 absolute"
        : "inset-0 h-full w-full absolute";
      return (
        <div className={`relative ${aspect} w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
          <iframe
            className={`pointer-events-none ${cover}`}
            src={embed}
            title={video?.label || "Vidéo Kabare Riders"}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        </div>
      );
    }

    return (
      <div className={`${aspect} w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
        <iframe
          className="h-full w-full"
          src={embed}
          title={video?.label || "Vidéo Kabare Riders"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // Fichier video direct (.mp4...)
  if (background) {
    return (
      <div className={`${aspect} w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster={poster || undefined}
        >
          <source src={parsed.src} />
        </video>
      </div>
    );
  }

  return (
    <video
      className={`${aspect} w-full rounded-2xl bg-black object-cover shadow-lg ${className}`}
      controls
      playsInline
      preload="metadata"
      poster={poster || undefined}
    >
      <source src={parsed.src} />
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
}
