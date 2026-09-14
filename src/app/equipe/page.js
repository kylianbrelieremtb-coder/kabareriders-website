export const metadata = {
  title: "Notre équipe : riders, coachs, experts chantier VTT",
  description:
    "L'équipe Kabare Riders rassemble riders professionnels, coachs, ingénieurs, designers et experts chantier pour concevoir, construire et faire vivre des projets VTT de A à Z.",
};

const MEMBRES = [
  "Bastien Ereau",
  "Kylian Breliere",
  "Robin Picca-Mansuy",
  "Louika Kolesnychenko",
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
      <h1 className="font-title text-4xl text-marron md:text-6xl">Notre équipe</h1>

      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-marron/90">
        Notre équipe rassemble des profils complémentaires : riders
        professionnels, coachs, experts chantier, ingénieurs, designers,
        spécialistes en communication et en gestion. Cette diversité nous permet
        de concevoir, construire et faire vivre un projet de A à Z, en mobilisant
        à chaque fois les bonnes compétences selon les besoins.
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

      {/* Bloc experts chantier mis en avant */}
      <div className="mt-14 rounded-2xl bg-marron p-8 text-beige shadow-lg md:p-10">
        <span className="inline-block rounded-full bg-vert px-3 py-1 text-xs font-semibold uppercase tracking-wide text-marron">
          Nos experts chantier
        </span>
        <h2 className="mt-4 font-title text-3xl text-ocre md:text-4xl">
          Des références reconnues sur le terrain
        </h2>
        <p className="mt-4 leading-relaxed text-beige/90">
          Sur nos chantiers, on travaille avec des experts reconnus du secteur.{" "}
          <strong className="text-beige">Élie Robert</strong>, rider
          professionnel, apporte plus de dix ans d'expérience dans la création de
          pistes et de pumptracks.{" "}
          <strong className="text-beige">Mathieu Papazian</strong> met à profit
          une expertise similaire acquise sur des chantiers de bike parks et de
          trails exigeants.
        </p>
      </div>
    </div>
  );
}
