import { getContent } from "@/lib/content";
import {
  fetchHelloAssoEvent,
  formatEventDate,
  formatEventPlace,
} from "@/lib/helloasso";

// Rendu a la demande : le lien HelloAsso et les evenements passes sont lus a chaque visite.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Événements VTT : courses, compétitions et résultats",
  description:
    "Prochain événement VTT organisé par Kabare Riders, inscriptions en ligne, et résultats de nos courses passées dans le Luberon et le Vaucluse.",
};

export default async function EvenementsPage() {
  const { events } = await getContent();
  const upcoming = events.lien_helloasso
    ? await fetchHelloAssoEvent(events.lien_helloasso)
    : null;

  const dateStr = upcoming ? formatEventDate(upcoming.startDate, upcoming.endDate) : null;
  const placeStr = upcoming ? formatEventPlace(upcoming.place) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-title text-4xl text-marron md:text-6xl">Événements</h1>
      <p className="mt-4 max-w-2xl text-lg text-marron/90">
        Nos courses et compétitions VTT. Inscrivez-vous au prochain événement et
        retrouvez les résultats des éditions passées.
      </p>

      {/* ---------- Prochain evenement ---------- */}
      <section className="mt-12">
        <h2 className="font-title text-2xl text-ocre">Prochain événement</h2>

        {!upcoming && (
          <div className="mt-4 flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed border-marron/30 bg-white/60 p-6 text-center">
            <p className="text-marron/70">
              Aucun événement à venir pour le moment. Revenez bientôt !
            </p>
          </div>
        )}

        {upcoming && (
          <div className="mt-4 overflow-hidden rounded-2xl bg-marron text-beige shadow-lg">
            <div className="bg-gradient-to-br from-ocre to-vert px-6 py-8 md:px-10">
              <span className="inline-block rounded-full bg-marron/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-beige">
                Inscriptions ouvertes
              </span>
              <h3 className="mt-3 font-title text-3xl text-beige md:text-4xl">
                {upcoming.title || "Notre prochaine course"}
              </h3>
            </div>

            <div className="px-6 py-6 md:px-10">
              <dl className="grid gap-4 sm:grid-cols-2">
                {dateStr && (
                  <div>
                    <dt className="text-sm uppercase tracking-wide text-vert">Date</dt>
                    <dd className="mt-1 text-lg text-beige">{dateStr}</dd>
                  </div>
                )}
                {placeStr && (
                  <div>
                    <dt className="text-sm uppercase tracking-wide text-vert">Lieu</dt>
                    <dd className="mt-1 text-lg text-beige">{placeStr}</dd>
                  </div>
                )}
              </dl>

              {upcoming.error && (
                <p className="mt-4 rounded-lg bg-beige/10 p-3 text-sm text-beige/80">
                  Les détails de l'événement seront bientôt disponibles. Vous
                  pouvez déjà vous inscrire via HelloAsso ci-dessous.
                </p>
              )}

              <a
                href={upcoming.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full bg-ocre px-8 py-3 font-title text-xl text-beige transition-transform hover:scale-105"
              >
                S'inscrire sur HelloAsso
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Evenements passes ---------- */}
      <section className="mt-16">
        <h2 className="font-title text-2xl text-ocre">Événements passés</h2>
        <p className="mt-1 text-marron/70">Retrouvez les résultats de nos éditions précédentes.</p>

        {events.passes.length === 0 ? (
          <p className="mt-4 text-marron/50">Les résultats des prochaines éditions apparaîtront ici.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {events.passes.map((ev, i) => (
              <li key={ev.id || i}>
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-white/70 px-5 py-4 shadow-sm ring-1 ring-marron/10 transition-colors hover:bg-white"
                >
                  <span className="font-title text-xl text-marron">{ev.label}</span>
                  <span className="font-title text-vert">Résultats &rarr;</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
