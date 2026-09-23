"use client";

import { useEffect, useState } from "react";

/**
 * Widget Calendly affiché UNIQUEMENT sur l'écran de confirmation.
 * Le script externe n'est chargé qu'au montage de ce composant (donc jamais
 * au chargement de la page de contact). Lien de repli si le widget ne charge pas.
 */
export default function CalendlyConfirmation() {
  const url = process.env.NEXT_PUBLIC_CALENDLY_URL || "";
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!url) return;
    const existant = document.querySelector(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    );
    if (existant) return;
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onerror = () => setErreur(true);
    document.body.appendChild(script);
  }, [url]);

  if (!url || erreur) {
    return (
      <div className="rounded-2xl border border-marron/15 bg-white/60 p-6 text-center">
        <h3 className="font-title text-xl text-marron">Réservez votre appel</h3>
        <p className="mt-2 text-sm text-marron/80">
          Choisissez directement un créneau, c'est le plus rapide.
        </p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-ocre px-8 py-3 font-title text-lg text-beige transition-transform hover:scale-[1.02]"
          >
            Choisir un créneau
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className="calendly-inline-widget overflow-hidden rounded-2xl border border-marron/15"
      data-url={url}
      style={{ minWidth: "320px", height: "660px" }}
    />
  );
}
