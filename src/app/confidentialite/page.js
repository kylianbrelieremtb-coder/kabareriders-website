import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Kabare Riders : données collectées via le formulaire de contact, finalités, durée de conservation et vos droits (RGPD).",
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

export default function ConfidentialitePage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@kabareriders.com";

return (
  <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
  <h1 className="font-title text-4xl text-marron md:text-6xl">
  Politique de confidentialité
  </h1>
  <p className="mt-4 text-marron/70">Dernière mise à jour : 18 novembre 2026</p>

<p className="mt-4 text-marron/90">
  La présente politique explique quelles données personnelles nous collectons lorsque
  vous nous contactez via ce site, pourquoi, combien de temps nous les conservons et
  quels sont vos droits. Ce site est un site vitrine : il ne réalise aucune vente ni
  aucun paiement en ligne.
    </p>

<Bloc titre="Responsable du traitement">
    <p>
    Le responsable du traitement des données est la <strong>SAS KABARE</strong>
  {" "}(« Kabare Riders »), 366 Chemin des Chênes Blancs, 84490 Saint-Saturnin-lès-Apt.
    Pour toute question relative à vos données :{" "}
  <a href={`mailto:${email}`} className="text-ocre hover:underline">
{email}
  </a>
.
  </p>
  </Bloc>

<Bloc titre="Données collectées et finalité">
  <p>
  Nous collectons uniquement les informations que vous nous transmettez via le
formulaire de contact, à savoir : votre <strong>nom</strong>, votre{" "}
<strong>adresse e-mail</strong> et toute information contenue dans votre{" "}
<strong>message</strong> (y compris, le cas échéant, un{" "}
<strong>numéro de téléphone</strong> que vous choisiriez de communiquer).
  </p>
<p>
  Ces données sont utilisées dans un seul but : <strong>traiter votre demande</strong>,
vous recontacter et assurer le suivi de nos échanges (demande d'information, devis,
  projet).
  </p>
<p>
  La base légale de ce traitement est votre démarche (mesures précontractuelles prises
à votre demande) et notre intérêt légitime à répondre aux messages reçus.
  </p>
  </Bloc>

<Bloc titre="Durée de conservation">
  <p>
  Nous conservons vos coordonnées (nom, e-mail et éventuel numéro de téléphone) le
temps nécessaire au traitement de votre demande, puis jusqu'à{" "}
  <strong>3 ans après notre dernier contact</strong>, afin de pouvoir poursuivre nos
échanges si besoin. Passé ce délai, elles sont supprimées. Vous pouvez à tout moment
demander leur suppression anticipée.
  </p>
  </Bloc>

<Bloc titre="Destinataires et sous-traitants">
  <p>
  Vos données sont destinées à la seule équipe de la SAS KABARE. Elles transitent par
nos prestataires techniques, strictement pour le fonctionnement du site et l'envoi
des messages :
</p>
<ul className="list-disc space-y-1 pl-5">
  <li>
  <strong>Vercel Inc.</strong> — hébergement du site (États-Unis) ;
  </li>
<li>
  <strong>Resend</strong> — acheminement des e-mails issus du formulaire de contact.
  </li>
  </ul>
<p>
  Certains de ces prestataires étant situés hors de l'Union européenne, les transferts
  éventuels sont encadrés par des garanties appropriées (clauses contractuelles types
de la Commission européenne). Nous ne vendons ni ne louons jamais vos données.
  </p>
  </Bloc>

<Bloc titre="Cookies">
  <p>
  Ce site n'utilise pas de cookies de mesure d'audience ni de traceurs publicitaires.
  Seuls des éléments techniques strictement nécessaires au bon fonctionnement du site
peuvent être utilisés.
  </p>
  </Bloc>

<Bloc titre="Vos droits">
  <p>
  Conformément au Règlement général sur la protection des données (RGPD) et à la loi
« Informatique et Libertés », vous disposez des droits suivants sur vos données :
droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de
  portabilité.
  </p>
<p>
  Pour exercer ces droits, écrivez-nous à{" "}
<a href={`mailto:${email}`} className="text-ocre hover:underline">
{email}
  </a>
. Vous pouvez également introduire une réclamation auprès de la CNIL
(
  <a
href="https://www.cnil.fr"
target="_blank"
rel="noopener noreferrer"
className="text-ocre hover:underline"
>
  www.cnil.fr
  </a>
) si vous estimez que vos droits ne sont pas respectés.
  </p>
  </Bloc>

<Bloc titre="En savoir plus">
  <p>
  Les informations sur l'éditeur et l'hébergeur du site figurent dans nos{" "}
<Link href="/mentions-legales" className="text-ocre hover:underline">
  mentions légales
  </Link>
.
  </p>
  </Bloc>
  </div>
);
}
