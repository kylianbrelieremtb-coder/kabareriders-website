/**
 * Detecte le type d'une source video et renvoie l'URL d'embed adaptee.
 * Accepte : liens YouTube, liens Vimeo, ou chemins/URL de fichiers .mp4.
 */
export function parseVideoSource(rawSrc) {
  const src = (rawSrc || "").trim();
  if (!src) return { type: "none", src: "" };

  // YouTube (watch?v=, youtu.be/, /embed/, /shorts/)
  const yt =
    src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) {
    return { type: "youtube", id: yt[1], src };
  }

  // Vimeo
  const vimeo = src.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return { type: "vimeo", id: vimeo[1], src };
  }

  // Fichier video direct (.mp4, .webm, .mov) ou chemin local
  return { type: "file", src };
}

export function youtubeEmbedUrl(id, { background = false } = {}) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (background) {
    params.set("autoplay", "1");
    params.set("mute", "1");
    params.set("controls", "0");
    params.set("loop", "1");
    params.set("playlist", id); // requis pour boucler
    params.set("showinfo", "0");
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function vimeoEmbedUrl(id, { background = false } = {}) {
  const params = new URLSearchParams();
  if (background) {
    params.set("background", "1");
    params.set("autoplay", "1");
    params.set("muted", "1");
    params.set("loop", "1");
  }
  const qs = params.toString();
  return `https://player.vimeo.com/video/${id}${qs ? `?${qs}` : ""}`;
}
