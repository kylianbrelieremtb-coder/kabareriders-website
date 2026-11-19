"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/components/ShopOverlay";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/services", label: "Services" },
  { href: "/evenements", label: "Événements" },
  { href: "/equipe", label: "Équipe" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ logo }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { openShop } = useShop();

  // On masque le header sur l'espace admin
  if (pathname?.startsWith("/admin")) return null;

  // Logo defini dans l'admin, sinon fichier local /images/logo.png, sinon texte
  const logoSrc = (logo && logo.trim()) || "/images/logo.png";

  const handleShop = () => {
    setOpen(false);
    openShop();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-beige/10 bg-marron/95 backdrop-blur-md text-beige shadow-[0_6px_24px_-8px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* Logo en haut a gauche */}
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Logo Kabare Riders"
            className="h-11 w-auto md:h-14"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "inline";
            }}
          />
          <span className="font-title text-2xl text-ocre md:text-3xl" style={{ display: "none" }}>
            Kabare Riders
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`link-underline text-lg transition-colors hover:text-ocre ${
                pathname === item.href ? "text-ocre" : "text-beige"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Boutique : ouvre le grand layer "coming soon" */}
          <button
            type="button"
            onClick={handleShop}
            className="link-underline inline-flex items-center whitespace-nowrap text-lg text-beige transition-colors hover:text-ocre"
          >
            Kabare Shop
            <span className="ml-2 rounded-full bg-vert px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-marron">
              Bientôt
            </span>
          </button>

          <Link
            href="/contact"
            className="rounded-full bg-ocre px-5 py-2 font-title text-lg text-beige shadow-sm transition-transform hover:scale-105"
          >
            Réserver un appel
          </Link>
        </nav>

        {/* Bouton menu mobile */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir le menu"
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-7 bg-beige" />
            <span className="block h-0.5 w-7 bg-beige" />
            <span className="block h-0.5 w-7 bg-beige" />
          </div>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-beige/20 bg-marron px-4 pb-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`py-3 text-lg ${pathname === item.href ? "text-ocre" : "text-beige"}`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleShop}
            className="flex items-center gap-2 py-3 text-left text-lg text-beige"
          >
            Kabare Shop
            <span className="rounded-full bg-vert px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-marron">
              Bientôt
            </span>
          </button>
        </nav>
      )}
    </header>
  );
}
