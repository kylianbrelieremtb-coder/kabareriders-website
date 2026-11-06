import Link from "next/link";

/**
 * Bandeau paysage compact place juste sous la video hero de l'accueil.
 * Il renvoie vers la page /jeu ou se trouve « Roule la piste ».
 */
export default function GameBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
      <Link
        href="/jeu"
        className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl bg-marron px-6 py-5 text-beige shadow-lg ring-2 ring-ocre/60 transition-transform hover:-translate-y-0.5 sm:flex-row sm:justify-between sm:px-10 sm:py-6"
      >
        {/* Lignes de piste en fond, purement decoratives */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          fill="none"
          strokeWidth="3"
        >
          <path d="M0 95 C80 95 100 40 160 40 S240 95 300 95 S380 30 440 30 S540 90 600 90" className="stroke-ocre" />
          <path d="M0 110 C80 110 100 55 160 55 S240 110 300 110 S380 45 440 45 S540 105 600 105" className="stroke-vert" />
        </svg>

        <div className="relative text-center uppercase sm:text-left">
          <span className="inline-block rounded-full bg-vert px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-marron">
            Nouveau · jeu gratuit
          </span>
          <h2 className="mt-2 font-title text-3xl leading-none sm:text-4xl">
            Roule nos pistes de Dual
          </h2>
          <p className="mt-1 text-sm text-beige/85">
            Affronte un adversaire sur nos vraies réalisations, du 16e de finale à la finale.
          </p>
        </div>

        <span className="relative shrink-0 rounded-full bg-ocre px-7 py-2.5 font-title text-xl uppercase shadow-md transition-transform group-hover:scale-105">
          Roule la piste &rarr;
        </span>
      </Link>
    </section>
  );
}
