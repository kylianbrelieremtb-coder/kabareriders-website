"use client";

import { useEffect } from "react";

/**
 * Integration Calendly (plan gratuit).
 * Renseignez NEXT_PUBLIC_CALENDLY_URL dans .env.local.
 */
export default function CalendlyEmbed() {
  const url = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

  useEffect(() => {
    if (!url) return;
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [url]);

  if (!url) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border-2 border-dashed border-marron/30 bg-white/60 p-6 text-center">
        <p className="text-marron/70">
          Integration Calendly a configurer.<br />
          Ajoutez votre lien dans <code className="rounded bg-marron/10 px-1">NEXT_PUBLIC_CALENDLY_URL</code>.
        </p>
      </div>
    );
  }

  return (
    <div
      className="calendly-inline-widget overflow-hidden rounded-2xl"
      data-url={url}
      style={{ minWidth: "320px", height: "660px" }}
    />
  );
}
