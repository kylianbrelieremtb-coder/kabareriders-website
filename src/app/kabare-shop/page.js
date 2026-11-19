import ShopComingSoon from "@/components/ShopComingSoon";

export const metadata = {
  title: "KABARE SHOP",
  description:
    "La boutique KABARE SHOP arrive bientôt : textile, pièces et goodies Kabare pour les riders. Laissez votre e-mail pour être prévenu du lancement.",
  robots: { index: true, follow: true },
};

export default function KabareShopPage() {
  return <ShopComingSoon />;
}
