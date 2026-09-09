import { parseVideoSource, youtubeEmbedUrl, vimeoEmbedUrl } from "@/lib/video";

/**
 * Bloc video avec controles, utilise sur les pages Realisations et Services.
 * Accepte un lien YouTube, un lien Vimeo, ou un fichier .mp4 (chemin/URL).
 * Si aucune source n'est definie, affiche un emplacement (placeholder).
 */
export default function VideoBlock({ video, className = "" }) {
  const parsed = parseVideoSource(video?.src);
  const poster = video?.poster?.trim();

  if (parsed.type === "none") {
    return (
      <div
        className={`flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-marron/30 bg-beige/60 ${className}`}
      >
        <div className="px-6 text-center">
          <p className="font-title text-2xl text-ocre">Emplacement video</p>
          <p className="mt-1 text-sm text-marron/70">
            {video?.label || "A ajouter depuis l'espace admin"}
          </p>
        </div>
      </div>
    );
  }

  if (parsed.type === "youtube" || parsed.type === "vimeo") {
    const embed =
      parsed.type === "youtube"
        ? youtubeEmbedUrl(parsed.id)
        : vimeoEmbedUrl(parsed.id);
    return (
      <div className={`aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
        <iframe
          className="h-full w-full"
          src={embed}
          title={video?.label || "Video Kabare Riders"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // Fichier video direct
  return (
    <video
      className={`aspect-video w-full rounded-2xl bg-black object-cover shadow-lg ${className}`}
      controls
      playsInline
      preload="metadata"
      poster={poster || undefined}
    >
      <source src={parsed.src} />
      Votre navigateur ne supporte pas la lecture video.
    </video>
  );
}
