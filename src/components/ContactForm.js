"use client";

import { useState } from "react";

const TYPES = [
  "Creation de piste",
  "Evenement",
  "Show et initiation",
  "Autre",
];

export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [form, setForm] = useState({
    nom: "",
    email: "",
    type: TYPES[0],
    message: "",
  });

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@kabareriders.com";
  const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID || "";

  const update = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();

    // Option 1 : Formspree configure -> envoi direct par email (recommande)
    if (formspreeId) {
      try {
        setStatus("sending");
        const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: form.nom,
            email: form.email,
            "type de projet": form.type,
            message: form.message,
          }),
        });
        setStatus(res.ok ? "sent" : "error");
      } catch {
        setStatus("error");
      }
      return;
    }

    // Option 2 (par defaut) : ouvre le logiciel mail du visiteur, pre-rempli
    const subject = encodeURIComponent(`Demande Kabare Riders : ${form.type}`);
    const body = encodeURIComponent(
      `Nom : ${form.nom}\nEmail : ${form.email}\nType de projet : ${form.type}\n\n${form.message}`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-vert/20 p-8 text-center ring-1 ring-vert">
        <h3 className="font-title text-2xl text-marron">Merci !</h3>
        <p className="mt-2 text-marron/80">
          Votre message est pret a partir. Nous revenons vers vous rapidement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-marron" htmlFor="nom">Nom</label>
        <input
          id="nom" name="nom" type="text" required value={form.nom} onChange={update}
          className="mt-1 w-full rounded-lg border border-marron/20 bg-white px-4 py-2 text-marron outline-none focus:border-ocre focus:ring-2 focus:ring-ocre/30"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-marron" htmlFor="email">Email</label>
        <input
          id="email" name="email" type="email" required value={form.email} onChange={update}
          className="mt-1 w-full rounded-lg border border-marron/20 bg-white px-4 py-2 text-marron outline-none focus:border-ocre focus:ring-2 focus:ring-ocre/30"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-marron" htmlFor="type">Type de projet</label>
        <select
          id="type" name="type" value={form.type} onChange={update}
          className="mt-1 w-full rounded-lg border border-marron/20 bg-white px-4 py-2 text-marron outline-none focus:border-ocre focus:ring-2 focus:ring-ocre/30"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-marron" htmlFor="message">Message</label>
        <textarea
          id="message" name="message" rows={5} required value={form.message} onChange={update}
          className="mt-1 w-full rounded-lg border border-marron/20 bg-white px-4 py-2 text-marron outline-none focus:border-ocre focus:ring-2 focus:ring-ocre/30"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-700">Une erreur est survenue. Reessayez ou ecrivez-nous directement a {contactEmail}.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-ocre px-8 py-3 font-title text-xl text-beige transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {status === "sending" ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
