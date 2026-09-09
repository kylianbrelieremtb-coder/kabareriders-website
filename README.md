# Kabare Riders - Site vitrine

Site vitrine (Next.js) pour **Kabare Riders** : creation de pistes VTT, evenements,
shows et communication dans le Luberon.

## Demarrage rapide

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000

## Pages

- `/` Accueil (hero video, 4 piliers, apercu realisations, qui sommes-nous)
- `/realisations` Realisations detaillees (Loudenvielle, Apt, Bonnieux 1 & 2)
- `/services` Offre commerciale (4 prestations)
- `/equipe` Equipe + experts chantier
- `/contact` Formulaire + Calendly + coordonnees
- `/admin` Espace administrateur (protege par mot de passe)

## Documentation complete

Voir **[GUIDE.md](./GUIDE.md)** : videos, images, Calendly, formulaire,
espace admin et deploiement, explique pas a pas pour non-developpeurs.

## Configuration

Copiez `.env.local.example` en `.env.local` et renseignez vos valeurs
(mot de passe admin, lien Calendly, email de contact, reseaux sociaux).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS · contenu editable en JSON.
