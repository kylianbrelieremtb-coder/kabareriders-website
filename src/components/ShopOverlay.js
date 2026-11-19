"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import ShopComingSoon from "@/components/ShopComingSoon";

const ShopContext = createContext({ openShop: () => {}, closeShop: () => {} });

export function useShop() {
  return useContext(ShopContext);
}

/**
 * Fournit l'overlay "coming soon" KABARE SHOP a toute l'application.
 * - openShop() ouvre le grand layer par-dessus la page courante.
 * - le header et la banniere d'accueil l'appellent.
 */
export default function ShopOverlayProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openShop = useCallback(() => setOpen(true), []);
  const closeShop = useCallback(() => setOpen(false), []);

  // Fermeture avec Echap + blocage du scroll de la page quand l'overlay est ouvert
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <ShopContext.Provider value={{ openShop, closeShop }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="KABARE SHOP, bientôt disponible"
        >
          <ShopComingSoon onClose={closeShop} />
        </div>
      )}
    </ShopContext.Provider>
  );
}
