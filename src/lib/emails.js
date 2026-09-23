import { Resend } from "resend";

/**
 * Envoi des emails de la page Contact via Resend.
 *  - Notification interne : à EMAIL_CONTACT, corps priorisé pour un rappel efficace.
 *  - Confirmation au demandeur : accusé de réception, vouvoiement, AUCUN chiffre.
 *
 * Nécessite RESEND_API_KEY et un domaine expéditeur vérifié dans Resend.
 */

const FROM = process.env.EMAIL_FROM || "Kabare Riders <contact@kabareriders.com>";
const RECEPTION = process.env.EMAIL_CONTACT || "kylian@kabareriders.com";
const CALENDLY = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ligne(label, valeur) {
  if (!valeur) return "";
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#8a7a5e;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td>
    <td style="padding:6px 0;color:#2a1c0a;font-size:15px;font-weight:600">${esc(valeur)}</td>
  </tr>`;
}

function bloc(titre, contenu) {
  if (!contenu) return "";
  return `<h2 style="margin:22px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#C76520">${esc(titre)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${contenu}</table>`;
}

/** Email de notification interne (priorisé pour décider du rappel). */
export async function envoyerNotification(d) {
  const resend = client();
  if (!resend) throw new Error("RESEND_API_KEY manquante");

  const nomComplet = `${d.prenom || ""} ${d.nom || ""}`.trim();
  const sujet = `Nouvelle demande — ${d.orga || nomComplet || "Sans nom"}, ${d.commune || "?"}`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:8px 16px;color:#2a1c0a">
    <p style="font-size:18px;font-weight:700;margin:0 0 4px">Nouvelle demande de projet</p>
    ${bloc("Identité", ligne("Nom", nomComplet) + ligne("Structure", d.orga) + ligne("Fonction", d.fonction) + ligne("Type de structure", d.profil) + ligne("Commune", d.commune))}
    ${bloc("Coordonnées & rappel", ligne("Email", d.email) + ligne("Téléphone", d.tel) + ligne("Créneau souhaité", d.creneau))}
    ${bloc("Priorité du rappel", ligne("Stade du projet", d.stade) + ligne("Enveloppe", d.budget) + ligne("Échéance", d.echeance))}
    ${bloc("Le projet", ligne("Type", d.type) + ligne("Dimensions", d.taille) + ligne("Terrain", d.relief) + ligne("Accès engins", d.acces) + ligne("Foncier", d.foncier))}
    ${d.message ? `<h2 style="margin:22px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#C76520">Message</h2><p style="white-space:pre-wrap;font-size:15px;line-height:1.5;margin:0">${esc(d.message)}</p>` : ""}
  </div>`;

  return resend.emails.send({
    from: FROM,
    to: RECEPTION,
    replyTo: d.email || undefined,
    subject: sujet,
    html,
  });
}

/** Email de confirmation au demandeur (vouvoiement, aucun chiffre). */
export async function envoyerConfirmation(d) {
  const resend = client();
  if (!resend) throw new Error("RESEND_API_KEY manquante");
  if (!d.email) return null;

  const boutonCalendly = CALENDLY
    ? `<p style="margin:22px 0"><a href="${esc(CALENDLY)}" style="display:inline-block;background:#C76520;color:#EFE6CE;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Choisir un créneau d'appel</a></p>`
    : "";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:8px 16px;color:#2a1c0a;line-height:1.55">
    <p style="font-size:18px;font-weight:700;margin:0 0 12px">Merci ${esc(d.prenom)}, nous avons bien reçu votre demande.</p>
    <p style="margin:0 0 12px">Vous nous avez parlé de votre projet${d.type ? ` de <strong>${esc(d.type.toLowerCase())}</strong>` : ""}${d.commune ? ` à ${esc(d.commune)}` : ""}. Un membre de l'équipe revient vers vous sous 48 heures avec une première lecture et les questions qui nous manquent.</p>
    <p style="margin:0 0 12px">Vous souhaitez être appelé plutôt ${d.creneau ? `sur le créneau <strong>${esc(d.creneau)}</strong>` : "aux horaires indiqués"} : on s'y tient. Si vous préférez, vous pouvez aussi choisir directement un créneau, c'est le plus rapide.</p>
    ${boutonCalendly}
    <p style="margin:22px 0 0;color:#8a7a5e;font-size:13px">Kabare Riders — construction de pistes VTT et événements.</p>
  </div>`;

  return resend.emails.send({
    from: FROM,
    to: d.email,
    subject: "Nous avons bien reçu votre demande — Kabare Riders",
    html,
  });
}
