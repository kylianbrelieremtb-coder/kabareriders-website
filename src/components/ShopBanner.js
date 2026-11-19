"use client";

import { useShop } from "@/components/ShopOverlay";

/**
 * Banniere "KABARE SHOP — bientot" placee tout en bas de l'accueil,
 * juste sous le bloc "On vous commissionne". Au clic, elle ouvre le
 * grand layer coming soon (overlay partage).
 */
export default function ShopBanner() {
  const { openShop } = useShop();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <button
        type="button"
        onClick={openShop}
        className="group relative flex w-full flex-col items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-ocre via-[#bd5a1d] to-vert px-6 py-9 text-left text-beige shadow-xl ring-1 ring-marron/20 transition-transform hover:-translate-y-0.5 sm:flex-row sm:justify-between sm:px-10 sm:py-10"
      >
        {/* Lignes de piste decoratives, facon reste du site */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-15"
          fill="none"
          strokeWidth="3"
        >
          <path d="M0 95 C80 95 100 40 160 40 S240 95 300 95 S380 30 440 30 S540 90 600 90" className="stroke-marron" />
          <path d="M0 110 C80 110 100 55 160 55 S240 110 300 110 S380 45 440 45 S540 105 600 105" className="stroke-beige" />
        </svg>

        <div className="relative text-center sm:text-left">
          <span className="inline-block rounded-full bg-marron/85 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-beige">
            Bientôt · boutique
          </span>
          <h2 className="mt-3 font-title text-4xl uppercase leading-none [text-shadow:0_2px_10px_rgba(112,73,22,0.45)] sm:text-5xl">
            KABARE SHOP
          </h2>
          <p className="mt-2 max-w-md text-sm text-beige/90">
            Textile, pièces et goodies Kabare. La boutique arrive&nbsp;— laisse ton mail et
            sois prévenu au lancement.
          </p>
        </div>

        <span className="relative shrink-0 rounded-full bg-marron px-7 py-3 font-title text-xl uppercase text-beige shadow-md transition-transform group-hover:scale-105">
          Découvrir &rarr;
        </span>
      </button>
    </section>
  );
}
