"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/realisations", label: "Realisations" },
  { href: "/services", label: "Services" },
  { href: "/evenements", label: "Evenements" },
  { href: "/equipe", label: "Equipe" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // On masque le header sur l'espace admin
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 bg-marron/95 backdrop-blur text-beige shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* Logo en haut a gauche */}
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {/* Remplacez /images/logo.png par le vrai logo fourni */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Logo Kabare Riders"
            className="h-10 w-auto md:h-12"
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
        <nav className="hidden items-center gap-8 md:flex">
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
          <Link
            href="/contact"
            className="rounded-full bg-ocre px-5 py-2 font-title text-lg text-beige transition-transform hover:scale-105"
          >
            Reserver un appel
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
        </nav>
      )}
    </header>
  );
}
