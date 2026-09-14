import "./globals.css";
import { Squada_One, Jost } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContent } from "@/lib/content";

const squada = Squada_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-squada",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kabareriders.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kabare Riders | Construction de pistes VTT, événements et shows dans le Luberon",
    template: "%s | Kabare Riders",
  },
  description:
    "Kabare Riders construit des pistes VTT (descente, enduro, pumptrack, bike parks, dual) et organise des événements et shows VTT dans le Luberon et le Vaucluse. Création de piste VTT sur mesure pour collectivités et partenaires.",
  keywords: [
    "construction de piste VTT",
    "création de piste VTT",
    "création de piste freeride",
    "événement VTT Vaucluse",
    "événement VTT Luberon",
    "organisation événement sportif VTT",
    "bike park",
    "pumptrack",
    "piste dual VTT",
    "aménagement bike park",
  ],
  authors: [{ name: "Kabare Riders" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Kabare Riders",
    title: "Kabare Riders | Construction de pistes VTT et événements dans le Luberon",
    description:
      "Création de pistes VTT, organisation d'événements, shows et initiations. On construit et on fait vivre le VTT.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#C76520",
};

export default async function RootLayout({ children }) {
  const { logo } = await getContent();
  return (
    <html lang="fr" className={`${squada.variable} ${jost.variable}`}>
      <body className="font-body bg-beige text-marron antialiased flex min-h-screen flex-col">
        <Header logo={logo} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
