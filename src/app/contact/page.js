import ContactForm from "@/components/ContactForm";
import CalendlyEmbed from "@/components/CalendlyEmbed";
import { SOCIALS } from "@/lib/socials";

export const metadata = {
  title: "Contact : votre projet de piste VTT ou d'evenement",
  description:
    "Contactez Kabare Riders pour votre projet de creation de piste VTT, d'evenement ou de show. Formulaire, reservation d'appel en ligne et coordonnees directes.",
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@kabareriders.com";
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
      <h1 className="font-title text-4xl text-marron md:text-6xl">Contact</h1>
      <p className="mt-4 max-w-2xl text-lg text-marron/90">
        Une piste, un evenement, un show en tete ? Ecrivez-nous ou reservez
        directement un appel.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        {/* Formulaire */}
        <div>
          <h2 className="font-title text-2xl text-ocre">Envoyez-nous un message</h2>
          <div className="mt-5">
            <ContactForm />
          </div>

          {/* Coordonnees directes */}
          <div className="mt-10">
            <h3 className="font-title text-xl text-marron">Nos coordonnees</h3>
            <ul className="mt-3 space-y-2 text-marron/90">
              <li>
                Email : <a href={`mailto:${email}`} className="text-ocre link-underline">{email}</a>
              </li>
              {phone && (
                <li>
                  Telephone : <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-ocre link-underline">{phone}</a>
                </li>
              )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-4">
              {SOCIALS.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="text-ocre link-underline">
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Reservation d'appel Calendly */}
        <div>
          <h2 className="font-title text-2xl text-ocre">
            Un projet en tete ? Reservez un appel avec nous
          </h2>
          <p className="mt-2 text-marron/90">
            Discutons de votre projet de piste ou d'evenement, choisissez un
            creneau qui vous convient.
          </p>
          <div className="mt-5">
            <CalendlyEmbed />
          </div>
        </div>
      </div>
    </div>
  );
}
