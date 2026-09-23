import ContactChoice from "@/components/ContactChoice";

const DESCRIPTION =
  "Réservez directement un appel avec l'équipe Kabare Riders, ou décrivez-nous votre projet de piste VTT ou d'événement en quelques questions. On vous rappelle sous 48 h.";

export const metadata = {
  title: "Contact : parlons de votre projet de piste VTT",
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/contact",
    siteName: "Kabare Riders",
    title: "Contact : parlons de votre projet de piste VTT | Kabare Riders",
    description: DESCRIPTION,
    images: [{ url: "/images/logo.png", width: 512, height: 512, alt: "Kabare Riders" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact : parlons de votre projet de piste VTT | Kabare Riders",
    description: DESCRIPTION,
    images: ["/images/logo.png"],
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-title text-4xl text-marron md:text-6xl">Parlons de votre projet</h1>
        <p className="mt-4 text-lg text-marron/80">
          Réservez directement un appel, ou décrivez-nous votre projet en deux minutes —
          comme vous préférez. On vous rappelle en connaissant déjà votre terrain, votre
          calendrier et vos contraintes.
        </p>
      </header>

      <div className="mt-10">
        <ContactChoice />
      </div>
    </div>
  );
}
