"use client";

import { useState } from "react";
import ProjetForm from "@/components/ProjetForm";
import CalendlyConfirmation from "@/components/CalendlyConfirmation";

/**
 * Page Contact : laisse le choix au visiteur entre
 *  - réserver directement un appel (Calendly), ou
 *  - décrire son projet via le questionnaire qualifiant.
 * Le questionnaire n'est donc pas obligatoire.
 */
export default function ContactChoice() {
  const [mode, setMode] = useState("form"); // "form" | "call"

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sélecteur */}
      <div
        role="tablist"
        aria-label="Comment nous contacter"
        className="mb-8 flex gap-2 rounded-full bg-white/60 p-1 ring-1 ring-marron/10"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "form"}
          onClick={() => setMode("form")}
          className={`flex-1 rounded-full px-4 py-2.5 font-title text-lg transition-colors ${
            mode === "form" ? "bg-ocre text-beige" : "text-marron hover:bg-marron/5"
          }`}
        >
          Décrire mon projet
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "call"}
          onClick={() => setMode("call")}
          className={`flex-1 rounded-full px-4 py-2.5 font-title text-lg transition-colors ${
            mode === "call" ? "bg-ocre text-beige" : "text-marron hover:bg-marron/5"
          }`}
        >
          Réserver un appel
        </button>
      </div>

      {mode === "form" ? (
        <div>
          <p className="mb-6 text-center text-sm text-marron/70">
            Deux minutes de questions, et on vous rappelle en connaissant déjà votre
            projet. Vous préférez en parler de vive voix ?{" "}
            <button
              type="button"
              onClick={() => setMode("call")}
              className="font-semibold text-ocre underline"
            >
              Réservez un appel
            </button>
            .
          </p>
          <ProjetForm />
        </div>
      ) : (
        <div>
          <h2 className="font-title text-2xl text-marron md:text-3xl">
            Réservez votre appel
          </h2>
          <p className="mb-6 mt-2 text-marron/80">
            Choisissez le créneau qui vous convient, on discute de votre projet de vive
            voix. Vous préférez tout nous écrire d'abord ?{" "}
            <button
              type="button"
              onClick={() => setMode("form")}
              className="font-semibold text-ocre underline"
            >
              Remplissez le questionnaire
            </button>
            .
          </p>
          <CalendlyConfirmation />
        </div>
      )}
    </div>
  );
}
