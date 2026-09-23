"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CalendlyConfirmation from "@/components/CalendlyConfirmation";
import {
  PROFILS,
  TYPES,
  TAILLES,
  RELIEFS,
  ACCES,
  STADES,
  FONCIERS,
  BUDGETS,
  ECHEANCES,
  CRENEAUX,
  ETIQUETTES,
  modeTaille,
  legendeTaille,
} from "@/lib/formProjet";

const TOTAL = 7;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Champs radio obligatoires par étape (index 0 → 6).
const RADIOS_PAR_ETAPE = [
  ["profil"],
  ["type"],
  ["taille"],
  ["relief", "acces"],
  ["stade", "foncier"],
  ["budget", "echeance"],
  ["creneau"],
];

const ETAT_INITIAL = {
  profil: "", type: "", taille: "", relief: "", acces: "", stade: "",
  foncier: "", budget: "", echeance: "", creneau: "",
  prenom: "", nom: "", orga: "", fonction: "", commune: "", tel: "",
  email: "", message: "", site: "",
};

/* -------------------------------------------------------------------------- */
/*  Sous-composants                                                           */
/* -------------------------------------------------------------------------- */

function Choix({ name, options, valeur, onChange, deux = false }) {
  return (
    <div className={`grid gap-3 ${deux ? "sm:grid-cols-2" : ""}`}>
      {options.map((o, i) => {
        const id = `${name}-${i}`;
        return (
          <div key={o.value} className="relative">
            <input
              type="radio"
              id={id}
              name={name}
              value={o.value}
              checked={valeur === o.value}
              onChange={() => onChange(name, o.value)}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className="block cursor-pointer rounded-xl border border-marron/15 bg-white px-4 py-3 font-medium text-marron transition-colors hover:border-marron/30 peer-checked:border-ocre peer-checked:bg-ocre/10 peer-checked:ring-1 peer-checked:ring-ocre peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ocre"
            >
              {o.value}
              {o.hint && (
                <span className="mt-0.5 block text-sm font-normal text-marron/60">
                  {o.hint}
                </span>
              )}
            </label>
          </div>
        );
      })}
    </div>
  );
}

function Champ({ id, label, type = "text", value, onChange, placeholder, facultatif, autoComplete, large }) {
  const Balise = type === "textarea" ? "textarea" : "input";
  return (
    <div className={large ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-marron">
        {label}{" "}
        {facultatif && <span className="font-normal text-marron/50">(facultatif)</span>}
      </label>
      <Balise
        id={id}
        name={id}
        type={type === "textarea" ? undefined : type}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        rows={type === "textarea" ? 4 : undefined}
        className="w-full rounded-lg border border-marron/20 bg-white px-4 py-2 text-marron outline-none focus:border-ocre focus:ring-2 focus:ring-ocre/30"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Indicateur de progression : un rider qui descend le tracé                 */
/* -------------------------------------------------------------------------- */

function Progression({ progres }) {
  const baseRef = useRef(null);
  const [len, setLen] = useState(0);
  const [rider, setRider] = useState({ x: 0, y: 44 });

  useEffect(() => {
    const path = baseRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    setLen(total);
    const pt = path.getPointAtLength(total * progres);
    setRider({ x: pt.x, y: pt.y });
  }, [progres]);

  return (
    <div aria-hidden="true" className="my-4">
      <svg viewBox="0 0 600 52" preserveAspectRatio="none" className="block h-[52px] w-full overflow-visible">
        <path
          ref={baseRef}
          d="M0,44 C60,44 70,18 120,18 C170,18 175,38 230,38 C280,38 285,12 340,12 C395,12 400,34 460,34 C520,34 520,8 600,8"
          fill="none"
          className="stroke-marron/25"
          strokeWidth="2.5"
        />
        <path
          d="M0,44 C60,44 70,18 120,18 C170,18 175,38 230,38 C280,38 285,12 340,12 C395,12 400,34 460,34 C520,34 520,8 600,8"
          fill="none"
          className="stroke-ocre [transition:stroke-dashoffset_.5s_ease] motion-reduce:[transition:none]"
          strokeWidth="3"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - progres)}
        />
        <circle cx={rider.x} cy={rider.y} r="5.5" className="fill-ocre" />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Formulaire                                                                */
/* -------------------------------------------------------------------------- */

export default function ProjetForm() {
  const [rep, setRep] = useState(ETAT_INITIAL);
  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  const titreEtapeRef = useRef(null);
  const confirmRef = useRef(null);

  const setField = (name, value) => {
    setErreur("");
    setRep((r) => {
      const next = { ...r, [name]: value };
      // Changer de type réinitialise la taille (les options changent d'unité).
      if (name === "type" && value !== r.type) next.taille = "";
      return next;
    });
  };

  const mode = modeTaille(rep.type);
  const optionsTaille = TAILLES[mode];

  // Focus + scroll à chaque changement d'étape / confirmation (accessibilité).
  useEffect(() => {
    if (envoye) {
      confirmRef.current?.focus();
    } else {
      titreEtapeRef.current?.focus();
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etape, envoye]);

  function validerEtape() {
    for (const champ of RADIOS_PAR_ETAPE[etape]) {
      if (!rep[champ]) {
        setErreur("Répondez à toutes les questions de cette étape pour continuer.");
        return false;
      }
    }
    if (etape === TOTAL - 1) {
      if (!rep.prenom.trim() || !rep.nom.trim()) {
        setErreur("Indiquez votre prénom et votre nom.");
        return false;
      }
      if (!EMAIL_RE.test(rep.email.trim())) {
        setErreur("Indiquez un email valide, c'est là qu'on vous répond.");
        return false;
      }
      if (!rep.commune.trim()) {
        setErreur("Indiquez la commune du projet, on en a besoin pour le préparer.");
        return false;
      }
    }
    setErreur("");
    return true;
  }

  function suivant() {
    if (!validerEtape()) return;
    if (etape === TOTAL - 1) return envoyer();
    setEtape((e) => e + 1);
  }

  function retour() {
    setErreur("");
    setEtape((e) => Math.max(0, e - 1));
  }

  function envoyer() {
    // Piège à robots : champ rempli => on n'envoie rien, mais on affiche la confirmation.
    if (rep.site) {
      setEnvoye(true);
      return;
    }
    // Nettoyage des champs texte.
    const payload = { ...rep };
    ["prenom", "nom", "orga", "fonction", "commune", "tel", "email", "message"].forEach(
      (k) => (payload[k] = String(payload[k] || "").trim())
    );
    // Envoi en arrière-plan : la confirmation s'affiche immédiatement.
    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setEnvoye(true);
  }

  const recap = useMemo(
    () => Object.keys(ETIQUETTES).filter((k) => rep[k]),
    [rep]
  );

  /* ---------------------------- Confirmation ---------------------------- */
  if (envoye) {
    return (
      <section aria-live="polite" className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white/60 p-6 ring-1 ring-marron/10 md:p-8">
          <h2 ref={confirmRef} tabIndex={-1} className="font-title text-3xl text-ocre outline-none md:text-4xl">
            Merci {rep.prenom}, on a bien reçu votre projet
          </h2>
          <p className="mt-4 text-marron/90">
            Un membre de l'équipe revient vers vous sous 48 heures avec une première
            lecture de votre projet et les questions qui nous manquent.
          </p>
          <p className="mt-2 text-marron/90">
            Vous pouvez aussi choisir directement un créneau d'appel ci-dessous, c'est
            le plus rapide.
          </p>

          <div className="mt-6">
            <CalendlyConfirmation />
          </div>

          <div className="mt-8 border-t border-marron/15 pt-6">
            <h3 className="font-title text-xl text-marron">Ce que vous nous avez transmis</h3>
            <ul className="mt-3">
              {recap.map((k) => (
                <li
                  key={k}
                  className="flex justify-between gap-4 border-b border-marron/10 py-2 text-sm"
                >
                  <span className="text-marron/60">{ETIQUETTES[k]}</span>
                  <span className="text-right font-medium text-marron">{rep[k]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-marron/15 pt-6">
            <h3 className="font-title text-xl text-marron">Et le financement ?</h3>
            <p className="mt-2 text-marron/90">
              La majorité des projets que nous réalisons sont financés en partie par des
              aides publiques. Les dispositifs, les taux et les calendriers varient selon
              le territoire et l'année, donc nous ne donnons pas de chiffre en ligne. On
              fait le point avec vous sur ce qui est mobilisable dans votre cas, et on
              vous accompagne dans le montage du dossier.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ Formulaire ---------------------------- */
  return (
    <div className="mx-auto max-w-2xl">
      <Progression progres={etape / (TOTAL - 1)} />
      <p className="text-sm text-marron/60" aria-live="polite">
        Étape {etape + 1} sur {TOTAL}
      </p>

      <form onSubmit={(e) => e.preventDefault()} noValidate className="mt-3">
        {/* Honeypot anti-spam (caché) */}
        <input
          type="text"
          name="site"
          value={rep.site}
          onChange={(e) => setField("site", e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-px w-px"
        />

        <div className="rounded-2xl bg-white/60 p-6 ring-1 ring-marron/10 md:p-8">
          {/* Étape 1 — Profil */}
          {etape === 0 && (
            <fieldset>
              <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                Vous êtes ?
              </legend>
              <p className="mb-4 mt-1 text-sm text-marron/70">
                Pour savoir à qui on s'adresse et comment se déroule la suite.
              </p>
              <Choix name="profil" options={PROFILS} valeur={rep.profil} onChange={setField} deux />
            </fieldset>
          )}

          {/* Étape 2 — Type de projet */}
          {etape === 1 && (
            <fieldset>
              <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                Quel type de projet ?
              </legend>
              <p className="mb-4 mt-1 text-sm text-marron/70">
                Si vous hésitez, choisissez ce qui s'en rapproche le plus. On affinera ensemble.
              </p>
              <Choix name="type" options={TYPES} valeur={rep.type} onChange={setField} deux />
            </fieldset>
          )}

          {/* Étape 3 — Dimensions (unité variable) */}
          {etape === 2 && (
            <fieldset>
              <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                {legendeTaille(mode)}
              </legend>
              <p className="mb-4 mt-1 text-sm text-marron/70">
                Une estimation suffit, le mètre près n'est pas nécessaire.
              </p>
              <Choix name="taille" options={optionsTaille} valeur={rep.taille} onChange={setField} />
            </fieldset>
          )}

          {/* Étape 4 — Terrain + accès */}
          {etape === 3 && (
            <>
              <fieldset>
                <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                  Le terrain
                </legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">
                  C'est ce qui conditionne le plus la conception et le chantier.
                </p>
                <Choix name="relief" options={RELIEFS} valeur={rep.relief} onChange={setField} />
              </fieldset>
              <fieldset className="mt-8 border-t border-marron/15 pt-6">
                <legend className="font-title text-xl text-marron">
                  Les engins de chantier peuvent-ils y accéder ?
                </legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">
                  Une pelle mécanique a besoin d'un accès. À défaut, une partie du travail se fait à la main.
                </p>
                <Choix name="acces" options={ACCES} valeur={rep.acces} onChange={setField} />
              </fieldset>
            </>
          )}

          {/* Étape 5 — Stade + foncier */}
          {etape === 4 && (
            <>
              <fieldset>
                <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                  Où en est le projet ?
                </legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">
                  Il n'y a pas de mauvaise réponse. Un projet au stade de l'idée nous intéresse autant qu'un projet budgété.
                </p>
                <Choix name="stade" options={STADES} valeur={rep.stade} onChange={setField} />
              </fieldset>
              <fieldset className="mt-8 border-t border-marron/15 pt-6">
                <legend className="font-title text-xl text-marron">Le foncier est-il maîtrisé ?</legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">
                  Terrain communal, privé, propriété de la station…
                </p>
                <Choix name="foncier" options={FONCIERS} valeur={rep.foncier} onChange={setField} />
              </fieldset>
            </>
          )}

          {/* Étape 6 — Enveloppe + échéance */}
          {etape === 5 && (
            <>
              <fieldset>
                <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                  Avez-vous une enveloppe en tête ?
                </legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">
                  Ça nous évite de vous proposer quelque chose de hors sujet. Si vous n'en avez aucune idée, dites-le, c'est une réponse valable et on vous orientera.
                </p>
                <Choix name="budget" options={BUDGETS} valeur={rep.budget} onChange={setField} />
              </fieldset>
              <fieldset className="mt-8 border-t border-marron/15 pt-6">
                <legend className="font-title text-xl text-marron">Pour quelle échéance ?</legend>
                <div className="mt-4">
                  <Choix name="echeance" options={ECHEANCES} valeur={rep.echeance} onChange={setField} deux />
                </div>
              </fieldset>
            </>
          )}

          {/* Étape 7 — Coordonnées + message + créneau */}
          {etape === 6 && (
            <>
              <fieldset>
                <legend ref={titreEtapeRef} tabIndex={-1} className="font-title text-2xl text-marron outline-none md:text-3xl">
                  Vos coordonnées
                </legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">
                  On vous répond sous 48 heures, avec une première lecture de votre projet.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ id="prenom" label="Prénom" value={rep.prenom} onChange={setField} autoComplete="given-name" />
                  <Champ id="nom" label="Nom" value={rep.nom} onChange={setField} autoComplete="family-name" />
                  <Champ id="orga" label="Structure" facultatif value={rep.orga} onChange={setField} autoComplete="organization" placeholder="Commune, station, club…" />
                  <Champ id="fonction" label="Votre fonction" facultatif value={rep.fonction} onChange={setField} placeholder="Maire, DGS, directeur…" />
                  <Champ id="commune" label="Commune et département" value={rep.commune} onChange={setField} placeholder="Apt (84)" />
                  <Champ id="tel" label="Téléphone" facultatif type="tel" value={rep.tel} onChange={setField} autoComplete="tel" />
                  <Champ id="email" label="Email" type="email" value={rep.email} onChange={setField} autoComplete="email" large />
                  <Champ id="message" label="Votre projet en quelques mots" facultatif type="textarea" value={rep.message} onChange={setField} large placeholder="Le contexte, le public visé, ce qui vous a donné l'idée, les contraintes que vous connaissez déjà…" />
                </div>
                <p className="mt-4 text-xs text-marron/60">
                  Vos informations servent uniquement à préparer notre échange et à vous
                  recontacter à ce sujet. Aucune transmission à des tiers.
                </p>
              </fieldset>
              <fieldset className="mt-8 border-t border-marron/15 pt-6">
                <legend className="font-title text-xl text-marron">Quand préférez-vous être appelé ?</legend>
                <p className="mb-4 mt-1 text-sm text-marron/70">On s'adapte à votre agenda.</p>
                <Choix name="creneau" options={CRENEAUX} valeur={rep.creneau} onChange={setField} deux />
              </fieldset>
            </>
          )}

          {erreur && (
            <p role="alert" className="mt-5 text-sm font-medium text-red-700">
              {erreur}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {etape > 0 && (
            <button
              type="button"
              onClick={retour}
              className="rounded-full border border-marron/30 px-6 py-3 font-title text-lg text-marron transition-colors hover:border-marron hover:bg-marron/5"
            >
              Retour
            </button>
          )}
          <button
            type="button"
            onClick={suivant}
            className="rounded-full bg-ocre px-8 py-3 font-title text-lg text-beige transition-transform hover:scale-[1.02]"
          >
            {etape === TOTAL - 1 ? "Envoyer ma demande" : "Continuer"}
          </button>
        </div>
      </form>
    </div>
  );
}
