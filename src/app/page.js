import Link from "next/link";
import Hero from "@/components/Hero";
import { getContent } from "@/lib/content";

// Rendu a la demande : les changements faits dans /admin s'affichent sans rebuild.
export const dynamic = "force-dynamic";

const PILIERS = [
  {
    titre: "Creation de pistes",
    texte: "Tous types de traces adaptes au terrain.",
    icone: "M4 20 L9 8 L13 14 L16 6 L20 20",
  },
  {
    titre: "Organisation d'evenements",
    texte: "Courses, competitions, animations VTT.",
    icone: "M12 2 L15 9 L22 9 L16 14 L18 21 L12 17 L6 21 L8 14 L2 9 L9 9 Z",
  },
  {
    titre: "Shows et initiations",
    texte: "Demonstrations et decouverte en toute securite.",
    icone: "M4 18 A8 8 0 0 1 20 18 M12 4 L12 10 M12 10 L16 13",
  },
];

const REALISATIONS = [
  {
    href: "/realisations#loudenvielle",
    titre: "Loudenvielle",
    texte:
      "La piste la plus roulee du bike park, plebiscitee par les riders meme apres la fermeture.",
  },
  {
    href: "/realisations#apt",
    titre: "Plan d'eau a Apt",
    texte:
      "Une piste construite de zero sur terrain plat, accessible des 7 ans, avec un module final pour les riders confirmes.",
  },
  {
    href: "/realisations#bonnieux1",
    titre: "Bonnieux - Piste 1 (foret)",
    texte:
      "Notre premiere piste, un trace naturel en foret qui donne envie de rouler toute la journee.",
  },
  {
    href: "/realisations#bonnieux2",
    titre: "Bonnieux - Piste 2 (vue degagee)",
    texte:
      "Une piste complete pour progresser en VTT, virages, sauts et sections naturelles, pensee pour tous les niveaux de riders.",
  },
];

export default async function HomePage() {
  const { videos } = await getContent();

  return (
    <>
      <Hero video={videos.hero} />

      {/* ---------- Section 4 piliers ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PILIERS.map((p) => (
            <div
              key={p.titre}
              className="flex flex-col rounded-2xl bg-white/60 p-6 shadow-sm ring-1 ring-marron/10 transition-transform hover:-translate-y-1"
            >
              <svg viewBox="0 0 24 24" className="h-10 w-10 stroke-ocre" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icone} />
              </svg>
              <h3 className="mt-4 font-title text-2xl text-marron">{p.titre}</h3>
              <p className="mt-2 text-sm text-marron/80">{p.texte}</p>
            </div>
          ))}

          {/* 4e pilier mis en valeur (argument differenciant) */}
          <div className="flex flex-col rounded-2xl bg-ocre p-6 text-beige shadow-lg ring-2 ring-vert transition-transform hover:-translate-y-1">
            <span className="inline-block w-fit rounded-full bg-vert px-3 py-1 text-xs font-semibold uppercase tracking-wide text-marron">
              Notre difference
            </span>
            <h3 className="mt-3 font-title text-2xl">Communication et valorisation integree</h3>
            <p className="mt-2 text-sm text-beige/90">
              On documente et on communique sur chaque projet pour offrir une
              visibilite immediate a nos partenaires.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Apercu realisations ---------- */}
      <section className="bg-white/40 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-title text-4xl text-marron md:text-5xl">Nos realisations</h2>
            <p className="mx-auto mt-3 max-w-2xl text-marron/80">
              Un apercu des pistes que nous avons concues, construites et fait vivre.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REALISATIONS.map((r) => (
              <Link
                key={r.titre}
                href={r.href}
                className="group flex flex-col overflow-hidden rounded-2xl bg-marron text-beige shadow-md transition-transform hover:-translate-y-1"
              >
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-ocre to-vert">
                  <span className="font-title text-2xl">{r.titre}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm text-beige/90">{r.texte}</p>
                  <span className="mt-4 font-title text-vert transition-colors group-hover:text-ocre">
                    Voir la piste &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/realisations"
              className="inline-block rounded-full bg-ocre px-8 py-3 font-title text-xl text-beige shadow-lg transition-transform hover:scale-105"
            >
              Voir toutes nos realisations
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Subventions / financement ---------- */}
      <section className="bg-vert/20 py-14">
        <div className="mx-auto max-w-5xl px-4 text-center md:px-8">
          <span className="inline-block rounded-full bg-vert px-4 py-1 text-sm font-semibold uppercase tracking-wide text-marron">
            Financement
          </span>
          <h2 className="mt-4 font-title text-3xl text-marron md:text-4xl">
            Un projet finançable jusqu'a 80 %
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-marron/90">
            Plusieurs dispositifs de subvention (Etat, Region, Departement,
            federation) permettent de financer jusqu'a 80 % d'un projet
            d'infrastructure. On vous aide a identifier les aides mobilisables
            pour votre territoire.
          </p>
        </div>
      </section>

      {/* ---------- Qui sommes-nous ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 flex h-full min-h-[300px] items-center justify-center rounded-2xl bg-gradient-to-br from-marron to-ocre p-8 text-center md:order-1">
            {/* Remplacez ce bloc par une photo equipe : /images/equipe.jpg */}
            <span className="font-title text-3xl text-beige">
              L'equipe Kabare Riders
            </span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-title text-4xl text-marron md:text-5xl">Qui sommes-nous</h2>
            <div className="mt-5 space-y-4 text-marron/90">
              <p>
                Kabare Riders est ne d'un groupe de potes passionnes de VTT, qui
                voulaient creer leurs propres pistes et organiser leurs
                evenements. Riders professionnels, coachs, videastes, designers,
                ingenieurs, experts en communication et en gestion, chacun a
                apporte sa pierre a l'edifice, et le collectif est devenu une
                structure complete, capable de concevoir, construire et faire
                vivre des projets VTT de A a Z.
              </p>
              <p>
                Aujourd'hui, Kabare Riders s'est structure en societe pour repondre
                professionnellement aux besoins de ses partenaires. On a envie
                d'aller plus loin et de mettre ce savoir-faire au service
                d'autres territoires.
              </p>
              <p className="font-title text-2xl text-ocre">
                Et si la prochaine piste, c'etait chez vous ?
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-vert px-8 py-3 font-title text-xl text-marron shadow transition-transform hover:scale-105"
            >
              Parlons de votre projet
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Apporteur de projet (commission) ---------- */}
      <section className="bg-marron py-16 text-beige">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <span className="inline-block rounded-full bg-ocre px-4 py-1 text-sm font-semibold uppercase tracking-wide text-beige">
            Recommandez un projet
          </span>
          <h2 className="mt-4 font-title text-3xl md:text-4xl">
            Vous nous apportez un projet ? On vous commissionne
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-beige/90">
            Evenement, chantier ou piste : pour toute personne qui nous met en
            relation avec un projet qui se concretise, nous versons une
            commission. Un simple contact peut suffire a tout lancer.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-ocre px-8 py-3 font-title text-xl text-beige transition-transform hover:scale-105"
          >
            Recommander un projet
          </Link>
        </div>
      </section>
    </>
  );
}
