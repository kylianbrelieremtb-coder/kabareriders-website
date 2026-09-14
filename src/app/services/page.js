import Link from "next/link";
import VideoBlock from "@/components/VideoBlock";
import { getContent } from "@/lib/content";

// Rendu a la demande : les videos modifiees dans /admin s'affichent sans rebuild.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Services : création de pistes VTT, événements et shows",
  description:
    "Nos prestations : création de pistes VTT (dual, descente, enduro, cross-country, pumptrack, bike parks), organisation d'événements, shows et initiations, communication intégrée.",
};

const SERVICES = [
  {
    id: "pistes",
    numero: "01",
    titre: "Création de pistes",
    videoKey: "service-pistes",
    texte:
      "Tous types de tracés : dual, descente, enduro, cross-country, pumptrack, bike parks complets, et tracés d'initiation pour les plus jeunes, adaptés au terrain et au public visé.",
  },
  {
    id: "evenements",
    numero: "02",
    titre: "Organisation d'événements",
    videoKey: "service-evenements",
    texte: "Courses, compétitions, animations sportives autour du VTT.",
  },
  {
    id: "shows",
    numero: "03",
    titre: "Shows et initiations",
    videoKey: "service-shows",
    texte:
      "Démonstrations et initiations avec nos modules airbag, pour faire découvrir les sensations du VTT en toute sécurité.",
  },
  {
    id: "communication",
    numero: "04",
    titre: "Communication et valorisation intégrée",
    videoKey: "service-communication",
    texte:
      "On documente et on communique sur chaque projet pour offrir une visibilité immédiate à nos partenaires.",
  },
];

export default async function ServicesPage() {
  const { videos } = await getContent();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
      <h1 className="font-title text-4xl text-marron md:text-6xl">Nos services</h1>
      <p className="mt-4 max-w-3xl text-lg text-marron/90">
        Kabare Riders intervient sur l'ensemble du cycle d'un projet VTT : de la
        conception d'une piste jusqu'à son animation et sa mise en valeur. Chaque
        prestation est réalisée de manière professionnelle pour les collectivités
        et les partenaires.
      </p>

      <div className="mt-14 space-y-16">
        {SERVICES.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            className={`grid scroll-mt-24 items-center gap-8 md:grid-cols-2 ${
              i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <VideoBlock video={videos[s.videoKey]} square background className="mx-auto max-w-md" />
            <div>
              <span className="font-title text-5xl text-vert/60">{s.numero}</span>
              <h2 className="mt-1 font-title text-3xl text-ocre md:text-4xl">{s.titre}</h2>
              <p className="mt-3 leading-relaxed text-marron/90">{s.texte}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Financement / subventions */}
      <div className="mt-16 rounded-2xl bg-vert/20 p-8 ring-1 ring-vert md:p-10">
        <span className="inline-block rounded-full bg-vert px-4 py-1 text-sm font-semibold uppercase tracking-wide text-marron">
          Financement
        </span>
        <h2 className="mt-4 font-title text-3xl text-marron md:text-4xl">
          Des projets subventionnables jusqu'à 80 %
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-marron/90">
          La plupart de nos projets sont financés grâce à des aides publiques.
          Plusieurs dispositifs de subvention (État, Région, Département,
          fédération) permettent de financer jusqu'à 80 % d'un projet
          d'infrastructure. Nous vous accompagnons pour identifier les
          dispositifs adaptés à votre collectivité et à votre projet.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-marron p-8 text-center text-beige md:p-12">
        <h2 className="font-title text-3xl md:text-4xl">Un projet de piste ou d'événement ?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-beige/90">
          Discutons ensemble de vos besoins et de votre territoire. Nous
          construisons une proposition sur mesure.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full bg-ocre px-8 py-3 font-title text-xl text-beige transition-transform hover:scale-105"
        >
          Réserver un appel
        </Link>
      </div>
    </div>
  );
}
