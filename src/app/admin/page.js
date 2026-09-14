"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [content, setContent] = useState({
    logo: "",
    videos: {},
    links: [],
    events: { lien_helloasso: "", passes: [] },
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [logoStatus, setLogoStatus] = useState("");

  // Charge le contenu actuel
  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        setContent({
          logo: data.logo || "",
          videos: data.videos || {},
          links: data.links || [],
          events: {
            lien_helloasso: data.events?.lien_helloasso || "",
            passes: Array.isArray(data.events?.passes) ? data.events.passes : [],
          },
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function uploadLogo(file) {
    if (!file) return;
    setLogoStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: fd,
      });
      if (!res.ok) {
        setLogoStatus("error");
        return;
      }
      const { url } = await res.json();
      setContent((c) => ({ ...c, logo: url }));
      setLogoStatus("uploaded");
    } catch {
      setLogoStatus("error");
    }
  }

  function updateHelloAsso(value) {
    setContent((c) => ({
      ...c,
      events: { ...c.events, lien_helloasso: value },
    }));
  }

  function updatePasse(index, field, value) {
    setContent((c) => {
      const passes = [...c.events.passes];
      passes[index] = { ...passes[index], [field]: value };
      return { ...c, events: { ...c.events, passes } };
    });
  }

  function addPasse() {
    setContent((c) => ({
      ...c,
      events: {
        ...c.events,
        passes: [...c.events.passes, { id: `ev-${Date.now()}`, label: "", url: "" }],
      },
    }));
  }

  function removePasse(index) {
    setContent((c) => ({
      ...c,
      events: { ...c.events, passes: c.events.passes.filter((_, i) => i !== index) },
    }));
  }

  const [videoUpload, setVideoUpload] = useState({}); // { [key]: "uploading"|"done"|"error" }
  const [posterUpload, setPosterUpload] = useState({}); // { [key]: "uploading"|"done"|"error" }

  async function uploadPoster(key, file) {
    if (!file) return;
    setPosterUpload((s) => ({ ...s, [key]: "uploading" }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: fd,
      });
      if (!res.ok) {
        setPosterUpload((s) => ({ ...s, [key]: "error" }));
        return;
      }
      const { url } = await res.json();
      updateVideo(key, "poster", url);
      setPosterUpload((s) => ({ ...s, [key]: "done" }));
    } catch {
      setPosterUpload((s) => ({ ...s, [key]: "error" }));
    }
  }

  async function uploadVideoFile(key, file) {
    if (!file) return;
    setVideoUpload((s) => ({ ...s, [key]: "uploading" }));
    try {
      const blob = await upload(`videos/${key}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload-video",
        clientPayload: password,
      });
      updateVideo(key, "src", blob.url);
      setVideoUpload((s) => ({ ...s, [key]: "done" }));
    } catch (err) {
      setVideoUpload((s) => ({ ...s, [key]: "error" }));
    }
  }

  function updateVideo(key, field, value) {
    setContent((c) => ({
      ...c,
      videos: {
        ...c.videos,
        [key]: { ...c.videos[key], [field]: value },
      },
    }));
  }

  function updateLink(index, field, value) {
    setContent((c) => {
      const links = [...c.links];
      links[index] = { ...links[index], [field]: value };
      return { ...c, links };
    });
  }

  function addLink() {
    setContent((c) => ({
      ...c,
      links: [...c.links, { id: `link-${Date.now()}`, label: "", url: "" }],
    }));
  }

  function removeLink(index) {
    setContent((c) => ({ ...c, links: c.links.filter((_, i) => i !== index) }));
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(content),
      });
      if (res.status === 401) {
        setStatus("bad-password");
        setUnlocked(false);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setStatus(j.error || "error");
        return;
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  // --- Ecran de connexion ---
  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-marron px-4">
        <div className="w-full max-w-sm rounded-2xl bg-beige p-8 shadow-xl">
          <h1 className="font-title text-3xl text-marron">Espace administrateur</h1>
          <p className="mt-2 text-sm text-marron/70">Kabare Riders - gestion du contenu</p>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password && setUnlocked(true)}
            className="mt-6 w-full rounded-lg border border-marron/20 bg-white px-4 py-2 outline-none focus:border-ocre focus:ring-2 focus:ring-ocre/30"
          />
          {status === "bad-password" && (
            <p className="mt-2 text-sm text-red-700">Mot de passe incorrect.</p>
          )}
          <button
            onClick={() => password && setUnlocked(true)}
            className="mt-4 w-full rounded-full bg-ocre px-6 py-3 font-title text-lg text-beige"
          >
            Entrer
          </button>
          <p className="mt-4 text-xs text-marron/60">
            Le mot de passe est verifie au moment de l'enregistrement.
          </p>
        </div>
      </div>
    );
  }

  // --- Interface d'administration ---
  return (
    <div className="min-h-screen bg-beige px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-title text-4xl text-marron">Administration</h1>
          <a href="/" className="text-sm text-ocre link-underline">Voir le site &rarr;</a>
        </div>

        {loading ? (
          <p className="mt-8 text-marron/70">Chargement...</p>
        ) : (
          <>
            {/* LOGO */}
            <section className="mt-8">
              <h2 className="font-title text-2xl text-ocre">Logo</h2>
              <p className="mt-1 text-sm text-marron/70">
                Choisissez l'image de votre logo (PNG a fond transparent conseille).
                Elle s'affiche en haut a gauche du site.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-marron/10">
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-marron p-2">
                  {content.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={content.logo} alt="Logo actuel" className="max-h-full max-w-full" />
                  ) : (
                    <span className="text-center text-xs text-beige/70">Aucun logo</span>
                  )}
                </div>
                <div>
                  <label className="inline-block cursor-pointer rounded-full bg-vert px-5 py-2 text-sm font-semibold text-marron">
                    Choisir une image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadLogo(e.target.files?.[0])}
                    />
                  </label>
                  <p className="mt-2 text-xs text-marron/60">
                    {logoStatus === "uploading" && "Envoi de l'image..."}
                    {logoStatus === "uploaded" && "Image chargee. Cliquez \"Enregistrer\" en bas pour valider."}
                    {logoStatus === "error" && "Echec de l'envoi (verifiez le mot de passe / la taille < 5 Mo)."}
                    {!logoStatus && "Formats image, 5 Mo max."}
                  </p>
                </div>
              </div>
            </section>

            {/* VIDEOS */}
            <section className="mt-8">
              <h2 className="font-title text-2xl text-ocre">Videos</h2>
              <p className="mt-1 text-sm text-marron/70">
                Collez un lien YouTube ou Vimeo (le plus simple), ou le chemin d'un
                fichier depose dans <code className="rounded bg-marron/10 px-1">public/videos/</code>{" "}
                (ex. <code className="rounded bg-marron/10 px-1">/videos/hero.mp4</code>).
              </p>

              <div className="mt-4 space-y-4">
                {Object.entries(content.videos).map(([key, v]) => (
                  <div key={key} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-marron/10">
                    <p className="font-semibold text-marron">{v.label || key}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-marron/80">
                        Source video
                        <input
                          type="text"
                          value={v.src || ""}
                          onChange={(e) => updateVideo(key, "src", e.target.value)}
                          placeholder="/videos/exemple.mp4"
                          className="mt-1 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                        />
                      </label>
                      <label className="text-sm text-marron/80">
                        Image d'apercu (poster, optionnel)
                        <input
                          type="text"
                          value={v.poster || ""}
                          onChange={(e) => updateVideo(key, "poster", e.target.value)}
                          placeholder="/images/exemple.jpg"
                          className="mt-1 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-block cursor-pointer rounded-full bg-vert px-4 py-2 text-sm font-semibold text-marron">
                        Uploader un fichier video (.mp4)
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => uploadVideoFile(key, e.target.files?.[0])}
                        />
                      </label>
                      <label className="inline-block cursor-pointer rounded-full bg-marron px-4 py-2 text-sm font-semibold text-beige">
                        Uploader une image (poster)
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadPoster(key, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                    <div className="mt-1 text-xs text-marron/60">
                      {videoUpload[key] === "uploading" && "Envoi de la video... (peut prendre 1-2 min) "}
                      {videoUpload[key] === "done" && "Video chargee. "}
                      {videoUpload[key] === "error" && "Echec video (mot de passe / format .mp4). "}
                      {posterUpload[key] === "uploading" && "Envoi de l'image... "}
                      {posterUpload[key] === "done" && "Image chargee. "}
                      {posterUpload[key] === "error" && "Echec image (mot de passe / 5 Mo max). "}
                      {(videoUpload[key] === "done" || posterUpload[key] === "done") && "Cliquez \"Enregistrer\" en bas pour valider."}
                      {!videoUpload[key] && !posterUpload[key] && "Le poster est l'image affichee avant lecture de la video."}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* EVENEMENTS */}
            <section className="mt-10">
              <h2 className="font-title text-2xl text-ocre">Evenements</h2>

              {/* Evenement a venir : un seul champ, le lien HelloAsso */}
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-marron/10">
                <p className="font-semibold text-marron">Evenement a venir (billetterie HelloAsso)</p>
                <p className="mt-1 text-sm text-marron/70">
                  Collez ici le lien HelloAsso de la course en cours d'inscription.
                  Le nom, la date et le lieu sont recuperes automatiquement. Un seul
                  evenement a venir a la fois : pour changer d'evenement, remplacez ce lien.
                </p>
                <input
                  type="text"
                  value={content.events.lien_helloasso}
                  onChange={(e) => updateHelloAsso(e.target.value)}
                  placeholder="https://www.helloasso.com/associations/.../evenements/..."
                  className="mt-3 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                />
                <p className="mt-2 text-xs text-marron/50">
                  Laissez vide s'il n'y a aucun evenement a venir (la section
                  "Prochain evenement" affichera alors un message d'attente).
                </p>
              </div>

              {/* Evenements passes : liste de liens vers les resultats */}
              <div className="mt-6 flex items-center justify-between">
                <h3 className="font-title text-xl text-marron">Evenements passes (resultats)</h3>
                <button onClick={addPasse} className="rounded-full bg-vert px-4 py-2 text-sm font-semibold text-marron">
                  + Ajouter un evenement passe
                </button>
              </div>
              <p className="mt-1 text-sm text-marron/70">
                Ajoutez autant d'anciennes courses que vous voulez : un titre + un lien
                vers les resultats. Ils s'accumulent sur la page Evenements.
              </p>

              <div className="mt-4 space-y-3">
                {content.events.passes.map((ev, i) => (
                  <div key={ev.id || i} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-marron/10 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm text-marron/80">
                      Titre (ex. "La KabaRace 2025")
                      <input
                        type="text"
                        value={ev.label || ""}
                        onChange={(e) => updatePasse(i, "label", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                      />
                    </label>
                    <label className="flex-1 text-sm text-marron/80">
                      Lien vers les resultats
                      <input
                        type="text"
                        value={ev.url || ""}
                        onChange={(e) => updatePasse(i, "url", e.target.value)}
                        placeholder="https://..."
                        className="mt-1 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                      />
                    </label>
                    <button
                      onClick={() => removePasse(i)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                {content.events.passes.length === 0 && (
                  <p className="text-sm text-marron/50">Aucun evenement passe pour le moment.</p>
                )}
              </div>
            </section>

            {/* LIENS */}
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-title text-2xl text-ocre">Liens</h2>
                <button onClick={addLink} className="rounded-full bg-vert px-4 py-2 text-sm font-semibold text-marron">
                  + Ajouter un lien
                </button>
              </div>
              <p className="mt-1 text-sm text-marron/70">
                Liens vers d'anciens evenements, futures pistes, videos externes...
              </p>

              <div className="mt-4 space-y-3">
                {content.links.map((link, i) => (
                  <div key={link.id || i} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-marron/10 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm text-marron/80">
                      Titre
                      <input
                        type="text"
                        value={link.label || ""}
                        onChange={(e) => updateLink(i, "label", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                      />
                    </label>
                    <label className="flex-1 text-sm text-marron/80">
                      URL
                      <input
                        type="text"
                        value={link.url || ""}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-marron/20 px-3 py-2 outline-none focus:border-ocre"
                      />
                    </label>
                    <button
                      onClick={() => removeLink(i)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                {content.links.length === 0 && (
                  <p className="text-sm text-marron/50">Aucun lien pour le moment.</p>
                )}
              </div>
            </section>

            {/* BARRE DE SAUVEGARDE */}
            <div className="sticky bottom-4 mt-10 flex items-center justify-between rounded-full bg-marron px-6 py-3 text-beige shadow-lg">
              <span className="text-sm">
                {status === "saved" && "Enregistre !"}
                {status === "saving" && "Enregistrement..."}
                {status === "error" && "Erreur lors de l'enregistrement."}
                {status === "bad-password" && "Mot de passe incorrect."}
                {typeof status === "string" && status.startsWith("Impossible") && status}
              </span>
              <button
                onClick={save}
                disabled={status === "saving"}
                className="rounded-full bg-ocre px-6 py-2 font-title text-lg text-beige disabled:opacity-60"
              >
                Enregistrer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
