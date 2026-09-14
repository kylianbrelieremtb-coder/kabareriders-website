export const metadata = {
  title: "Notre equipe : riders, coachs, experts chantier VTT",
  description:
    "L'equipe Kabare Riders rassemble riders professionnels, coachs, ingenieurs, designers et experts chantier pour concevoir, construire et faire vivre des projets VTT de A a Z.",
};

const MEMBRES = [
  "Bastien Ereau",
  "Kylian Breliere",
  "Robin Picamensui",
  "Loic Colnichensco",
  "Lucas Garreau",
  "Clara Trinchillo",
  "Baptiste Gaudin",
  "Axel Delaye",
  "Antoine Cote",
  "Enzo Cavard",
];

export default function EquipePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-title text-4xl text-marron md:text-6xl">Notre equipe</h1>

      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-marron/90">
        Notre equipe rassemble des profils complementaires : riders
        professionnels, coachs, experts chantier, ingenieurs, designers,
        specialistes en communication et en gestion. Cette diversite nous permet
        de concevoir, construire et faire vivre un projet de A a Z, en mobilisant
        a chaque fois les bonnes competences selon les besoins.
      </p>

      {/* Liste des membres (prenoms uniquement) */}
      <div className="mt-12">
        <h2 className="font-title text-2xl text-ocre">Le collectif</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {MEMBRES.map((m) => (
            <span
              key={m}
              className="rounded-full bg-white/70 px-5 py-2 text-marron shadow-sm ring-1 ring-marron/10"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Bloc experts chantier freelance mis en avant */}
      <div className="mt-14 rounded-2xl bg-marron p-8 text-beige shadow-lg md:p-10">
        <span className="inline-block rounded-full bg-vert px-3 py-1 text-xs font-semibold uppercase tracking-wide text-marron">
          Experts chantier freelance
        </span>
        <h2 className="mt-4 font-title text-3xl text-ocre md:text-4xl">
          Des references reconnues sur le terrain
        </h2>
        <p className="mt-4 leading-relaxed text-beige/90">
          Sur nos chantiers, on travaille avec des experts reconnus du secteur.{" "}
          <strong className="text-beige">Elie Robert</strong>, rider
          professionnel, apporte plus de dix ans d'experience dans la creation de
          pistes et de pumptracks.{" "}
          <strong className="text-beige">Mathieu Papassian</strong> met a profit
          une expertise similaire acquise sur des chantiers de bike parks et de
          trails exigeants.
        </p>
      </div>
    </div>
  );
}
