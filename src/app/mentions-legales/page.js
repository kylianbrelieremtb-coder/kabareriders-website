import Link from "next/link";

export const metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site Kabare Riders : éditeur (SAS KABARE), hébergeur et informations juridiques.",
  robots: { index: true, follow: true },
};

function Bloc({ titre, children }) {
  return (
    <section className="mt-10">
    <h2 className="font-title text-2xl text-ocre md:text-3xl">{titre}</h2>
  <div className="mt-3 space-y-2 text-marron/90">{children}</div>
    </section>
  );
}

export default function MentionsLegalesPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@kabareriders.com";

return (
  <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
  <h1 className="font-title text-4xl text-marron md:text-6xl">Mentions légales</h1>
  <p className="mt-4 text-marron/70">Dernière mise à jour : 18 novembre 2026</p>

<Bloc titre="Éditeur du site">
  <p>Le présent site est édité par :</p>
  <ul className="list-none space-y-1">
  <li><strong>SAS KABARE</strong> (marque commerciale « Kabare Riders »)</li>
  <li>Société par actions simplifiée (SAS) au capital de 1 000 €</li>
  <li>Siège social : 366 Chemin des Chênes Blancs, 84490 Saint-Saturnin-lès-Apt, France</li>
  <li>RCS Avignon 131 310 989</li>
  <li>SIRET (siège) : 131 310 989 00010</li>
  <li>N° de TVA intracommunautaire : FR71131310989</li>
  <li>Code APE/NAF : 41.20B — Construction d'autres bâtiments</li>
  <li>
  Courriel :{" "}
  <a href={`mailto:${email}`} className="text-ocre hover:underline">
{email}
  </a>
  </li>
  </ul>
  </Bloc>

<Bloc titre="Directeur de la publication">
  <p>Monsieur Kylian Brelière, en qualité de Président de la SAS KABARE.</p>
  </Bloc>

<Bloc titre="Hébergeur">
  <p>Le site est hébergé par :</p>
<ul className="list-none space-y-1">
  <li><strong>Vercel Inc.</strong></li>
  <li>340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
<li>
  Site web :{" "}
<a
href="https://vercel.com"
target="_blank"
rel="noopener noreferrer"
className="text-ocre hover:underline"
>
  vercel.com
  </a>
  </li>
  </ul>
  </Bloc>

<Bloc titre="Propriété intellectuelle">
  <p>
  L'ensemble des contenus présents sur ce site (textes, photographies, vidéos,
  logos, marque « Kabare Riders », graphismes et éléments de mise en page) est la
propriété exclusive de la SAS KABARE ou de ses partenaires, et est protégé par le
droit de la propriété intellectuelle.
  </p>
<p>
  Toute reproduction, représentation, modification ou exploitation, totale ou
partielle, sans l'autorisation écrite préalable de la SAS KABARE, est interdite et
  susceptible de constituer une contrefaçon.
  </p>
  </Bloc>

<Bloc titre="Responsabilité">
  <p>
  La SAS KABARE s'efforce d'assurer l'exactitude et la mise à jour des informations
  diffusées sur ce site, sans toutefois pouvoir en garantir l'exhaustivité. Ce site
  est un site vitrine : il ne permet aucune vente ni paiement en ligne.
  </p>
<p>
  Le site peut contenir des liens vers des sites tiers ; la SAS KABARE n'exerce aucun
  contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
  </p>
  </Bloc>

<Bloc titre="Données personnelles">
  <p>
  Les données transmises via le formulaire de contact font l'objet d'un traitement
décrit dans notre{" "}
<Link href="/confidentialite" className="text-ocre hover:underline">
  politique de confidentialité
  </Link>
. Conformément au RGPD, vous disposez de droits d'accès, de rectification et de
  suppression de vos données, exerçables à l'adresse{" "}
  <a href={`mailto:${email}`} className="text-ocre hover:underline">
{email}
  </a>
.
  </p>
  </Bloc>

<Bloc titre="Droit applicable">
  <p>
  Les présentes mentions légales sont régies par le droit français. Tout litige
relatif à l'utilisation du site relève de la compétence des tribunaux français.
  </p>
  </Bloc>
  </div>
);
}
