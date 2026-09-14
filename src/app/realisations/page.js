import VideoBlock from "@/components/VideoBlock";
import { getContent } from "@/lib/content";

// Rendu a la demande : les videos modifiees dans /admin s'affichent sans rebuild.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Realisations : pistes VTT construites dans le Luberon",
  description:
    "Decouvrez les pistes VTT construites par Kabare Riders : Loudenvielle, plan d'eau d'Apt, Bonnieux. Traces de dual, descente, pumptrack et plus, sur mesure selon le terrain.",
};

const REALISATIONS = [
  {
    id: "loudenvielle",
    titre: "Loudenvielle",
    videoKey: "loudenvielle",
    texte:
      "Piste rouge creee sur le front de neige du bike park, pensee pour accueillir une etape de coupe du monde. Aujourd'hui, c'est la piste la plus roulee du domaine : un tiers des utilisateurs terminent systematiquement leur descente par ce trace, et certains reviennent meme la rouler une fois le bike park ferme. Concue pour limiter l'entretien, elle se degrade beaucoup moins vite que les pistes classiques du bike park.",
  },
  {
    id: "apt",
    titre: "Plan d'eau a Apt",
    videoKey: "apt",
    texte:
      "Piste creee pour la communaute de communes du Pays d'Apt Luberon, en plein centre urbain, sans le moindre relief naturel a exploiter, contrairement a nos pistes en montagne ou en foret. Des centaines de tonnes de terre et de gravier ont ete apportees et faconnees pour creer un vrai denivele et un trace de dual slalom. Le resultat : un terrain de progression accessible aux clubs des alentours qui viennent s'entrainer, et aux debutants des 7 ans qui decouvrent leurs premieres sensations en VTT. La piste reste praticable par tous en niveau bleu, avec un dernier module plus engage, securise par des copeaux, qui permet aux riders confirmes d'enchainer des figures sans risque.",
  },
  {
    id: "bonnieux1",
    titre: "Bonnieux - Piste 1 (foret, flow naturel)",
    videoKey: "bonnieux1",
    texte:
      "Notre premiere realisation, une piste tracee en foret a Bonnieux. Le terrain naturel a ete exploite au maximum : virages releves au bon endroit, sections techniques naturelles, petits sauts integres au terrain, pour offrir un flow et un grip qui donnent envie de rouler toute la journee sans s'arreter. C'est la piste qui a lance Kabare Riders, et elle reste aujourd'hui l'une des preferees des riders qui la connaissent.",
  },
  {
    id: "bonnieux2",
    titre: "Bonnieux - Piste 2 (vue degagee)",
    videoKey: "bonnieux2",
    texte:
      "Notre deuxieme realisation a Bonnieux, une piste plus ouverte qui permet au public de suivre toute la descente du premier virage au dernier saut. Sur un terrain limite, on a su exploiter chaque metre disponible pour creer la piste la plus longue et la plus fun possible, en combinant virages releves, virages naturels et sauts, pour offrir toutes les sensations du VTT a tous les niveaux.",
  },
];

export default async function RealisationsPage() {
  const { videos, realisationLinks } = await getContent();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-title text-4xl text-marron md:text-6xl">Nos realisations</h1>

      {/* Phrase d'intro importante */}
      <p className="mt-6 rounded-2xl bg-white/60 p-6 text-lg leading-relaxed text-marron/90 ring-1 ring-marron/10">
        Nos realisations actuelles portent sur des pistes de dual, une discipline
        technique et exigeante qui necessite une maitrise fine du terrain, mais
        notre expertise couvre l'ensemble des types de traces VTT : descente,
        enduro, cross-country, pumptrack, bike parks complets et traces
        d'initiation pour les plus jeunes, adaptes a chaque projet et a chaque
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
                <p className="text-sm font-semibold uppercase tracking-wide text-vert">A voir aussi</p>
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
