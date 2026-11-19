"use client";

import { useState } from "react";

/**
 * Contenu "coming soon" de la boutique KABARE SHOP.
 * Reutilise par l'overlay modal (ShopOverlay) et par la page /kabare-shop.
 * Si `onClose` est fourni, on affiche la croix de fermeture (mode modal).
 */
export default function ShopComingSoon({ onClose }) {
  const [done, setDone] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Pas de backend pour l'instant : on remercie l'utilisateur.
    // (On pourra brancher la collecte des e-mails plus tard.)
    setDone(true);
  }

  return (
    <div className="shop-surface">
      {onClose && (
        <button type="button" className="shop-close" aria-label="Fermer" onClick={onClose}>
          &times;
        </button>
      )}

      {/* Medaillon : pelle + pioche du logo sur disque beige */}
      <div className="shop-medallion">
        <span className="shop-ring" />
        <span className="shop-ring" />
        <span className="shop-ring" />
        <div className="shop-disc">
          <svg className="shop-tools" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <g stroke="var(--marron)" fill="var(--marron)">
              {/* PIOCHE : manche haut-gauche -> bas-droite */}
              <line x1="44" y1="40" x2="92" y2="104" strokeWidth="7" />
              <path d="M18 44 Q40 26 64 38 Q58 30 48 33 Q35 35 27 47 Q22 50 18 44 Z" strokeWidth="3" />
              <path d="M18 44 Q40 26 64 38 L60 46 Q40 36 24 51 Q20 49 18 44 Z" />
              {/* PELLE : manche haut-droite -> bas-gauche */}
              <line x1="76" y1="40" x2="30" y2="104" strokeWidth="7" />
              <path d="M74 30 L96 22 Q106 34 98 50 L80 44 Q74 40 74 30 Z" strokeWidth="2.5" />
              <path d="M24 102 q6 12 14 10" strokeWidth="7" fill="none" />
            </g>
          </svg>
        </div>
      </div>

      <p className="shop-kicker">La boutique arrive</p>
      <h1 className="shop-title">
        KABARE SHOP
        <span className="shop-sheen" aria-hidden="true">KABARE SHOP</span>
      </h1>

      <div className="shop-dots" aria-hidden="true">
        <span className="shop-dot" />
        <span className="shop-dot" />
        <span className="shop-dot" />
      </div>

      <p className="shop-lead">
        On prépare quelque chose pour les riders : <b>textile, pièces et goodies Kabare</b>.
        Encore un peu de patience&nbsp;— ça arrive très bientôt.
      </p>

      {done ? (
        <p className="shop-cta is-done" role="status" style={{ marginTop: 30 }}>
          Merci&nbsp;! On te tient au courant. 🤙
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
          <div className="shop-field">
            <input type="email" placeholder="ton@email.com" required aria-label="Ton e-mail" />
            <button type="submit">Je veux savoir</button>
          </div>
          <p className="shop-cta">On te prévient au lancement. 🛠️</p>
        </form>
      )}
    </div>
  );
}
