// Page du jeu "Roule la piste" : le jeu (build statique dans public/jeu-app/)
// s'affiche en plein ecran par-dessus le header et le footer du site.

export const metadata = {
  title: "Roule la piste : le jeu de Dual VTT",
  description:
    "Roule la piste, le jeu de Dual VTT de Kabare Riders : affronte nos riders sur les vraies pistes que nous avons construites, en commençant par le Dual du plan d'eau d'Apt. Jouable sur mobile et ordinateur.",
  openGraph: {
    title: "Roule la piste | Le jeu de Dual VTT Kabare Riders",
    description: "Pump, tire, envoie un backflip et bats Christian Cayol sur le Dual d'Apt.",
    images: ["/images/jeu/dual-apt-drone.jpg"],
  },
};

export default function JeuPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-marron">
      <iframe
        src="/jeu-app/index.html"
        title="Roule la piste - jeu de Dual VTT"
        className="h-full w-full border-0"
        allow="fullscreen; autoplay; screen-wake-lock"
        allowFullScreen
      />
    </div>
  );
}
