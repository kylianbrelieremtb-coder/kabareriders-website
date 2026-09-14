import VideoBlock from "@/components/VideoBlock";
import { getContent } from "@/lib/content";

// Rendu a la demande : les videos modifiees dans /admin s'affichent sans rebuild.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Réalisations : pistes VTT construites dans le Luberon",
  description:
    "Découvrez les pistes VTT construites par Kabare Riders : Loudenvielle, plan d'eau d'Apt, Bonnieux. Tracés de dual, descente, pumptrack et plus, sur mesure selon le terrain.",
};

const REALISATIONS = [
  {
    id: "loudenvielle",
    titre: "Loudenvielle",
    videoKey: "loudenvielle",
    texte:
      "Piste rouge créée sur le front de neige du bike park, pensée pour accueillir une étape de coupe du monde. Aujourd'hui, c'est la piste la plus roulée du domaine : un tiers des utilisateurs terminent systématiquement leur descente par ce tracé, et certains reviennent même la rouler une fois le bike park fermé. Conçue pour limiter l'entretien, elle se dégrade beaucoup moins vite que les pistes classiques du bike park.",
  },
  {
    id: "apt",
    titre: "Plan d'eau à Apt",
    videoKey: "apt",
    texte:
      "Piste créée pour la communauté de communes du Pays d'Apt Luberon, en plein centre urbain, sans le moindre relief naturel à exploiter, contrairement à nos pistes en montagne ou en forêt. Des centaines de tonnes de terre et de gravier ont été apportées et façonnées pour créer un vrai dénivelé et un tracé de dual slalom. Le résultat : un terrain de progression accessible aux clubs des alentours qui viennent s'entraîner, et aux débutants dès 7 ans qui découvrent leurs premières sensations en VTT. La piste reste praticable par tous en niveau bleu, avec un dernier module plus engagé, sécurisé par des copeaux, qui permet aux riders confirmés d'enchaîner des figures sans risque.",
  },
  {
    id: "bonnieux1",
    titre: "Bonnieux piste enduro",
    videoKey: "bonnieux1",
    texte:
      "Notre première réalisation, une piste tracée en forêt à Bonnieux. Le terrain naturel a été exploité au maximum : virages relevés au bon endroit, sections techniques naturelles, petits sauts intégrés au terrain, pour offrir un flow et un grip qui donnent envie de rouler toute la journée sans s'arrêter. C'est la piste qui a lancé Kabare Riders, et elle reste aujourd'hui l'une des préférées des riders qui la connaissent.",
  },
  {
    id: "bonnieux2",
    titre: "Bonnieux piste dual",
    videoKey: "bonnieux2",
    texte:
      "Notre deuxième réalisation à Bonnieux, une piste plus ouverte qui permet au public de suivre toute la descente du premier virage au dernier saut. Sur un terrain limité, on a su exploiter chaque mètre disponible pour créer la piste la plus longue et la plus fun possible, en combinant virages relevés, virages naturels et sauts, pour offrir toutes les sensations du VTT à tous les niveaux.",
  },
];

export default async function RealisationsPage() {
  const { videos, realisationLinks } = await getContent();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-title text-4xl text-marron md:text-6xl">Nos réalisations</h1>

      {/* Phrase d'intro importante */}
      <p className="mt-6 rounded-2xl bg-white/60 p-6 text-lg leading-relaxed text-marron/90 ring-1 ring-marron/10">
        Nos réalisations actuelles portent sur des pistes de dual, une discipline
        technique et exigeante qui nécessite une maîtrise fine du terrain, mais
        notre expertise couvre l'ensemble des types de tracés VTT : descente,
        enduro, cross-country, pumptrack, bike parks complets et tracés
        d'initiation pour les plus jeunes, adaptés à chaque projet et à chaque
        territoire.
      </p>

      <div className="mt-14 space-y-20">
        {REALISATIONS.map((r) => (
          <article key={r.id} id={r.id} className="scroll-mt-24">
            <VideoBlock video={videos[r.videoKey]} />
            <h2 className="mt-6 font-title text-3xl text-ocre md:text-4xl">{r.titre}</h2>
            <p className="mt-3 leading-relaxed text-marron/90">{r.texte}</p>
            {(realisationLinks?.[r.id] || []).length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-vert">À voir aussi</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {realisationLinks[r.id].map((l, i) => (
                    <a
                      key={l.id || i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-marron px-5 py-2 text-sm font-semibold text-beige transition-transform hover:scale-105"
                    >
                      {l.label} &rarr;
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
