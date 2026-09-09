"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@kabareriders.com";
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
  const youtube = process.env.NEXT_PUBLIC_YOUTUBE_URL || "";
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";

  return (
    <footer className="bg-marron text-beige">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="font-title text-2xl text-ocre">Kabare Riders</h3>
          <p className="mt-3 max-w-xs text-sm text-beige/80">
            On construit et on fait vivre le VTT. Creation de pistes, evenements
            et shows dans le Luberon.
          </p>
        </div>

        <div>
          <h4 className="font-title text-xl text-vert">Navigation</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/realisations" className="hover:text-ocre">Realisations</Link></li>
            <li><Link href="/services" className="hover:text-ocre">Services</Link></li>
            <li><Link href="/equipe" className="hover:text-ocre">Equipe</Link></li>
            <li><Link href="/contact" className="hover:text-ocre">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-title text-xl text-vert">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={`mailto:${email}`} className="hover:text-ocre">{email}</a>
            </li>
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-ocre">{phone}</a>
              </li>
            )}
          </ul>
          <div className="mt-4 flex gap-4 text-sm">
            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ocre">Instagram</a>}
            {youtube && <a href={youtube} target="_blank" rel="noopener noreferrer" className="hover:text-ocre">YouTube</a>}
            {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" className="hover:text-ocre">Facebook</a>}
          </div>
        </div>
      </div>

      <div className="border-t border-beige/20 py-4 text-center text-xs text-beige/60">
        &copy; {new Date().getFullYear()} Kabare Riders. Tous droits reserves.
      </div>
    </footer>
  );
}
