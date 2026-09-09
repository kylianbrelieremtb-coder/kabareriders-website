# Guide Kabare Riders - Site vitrine

Ce guide est ecrit pour une personne **non-developpeuse**. Suivez les etapes dans l'ordre.

---

## 1. Lancer le site sur votre ordinateur (pour le tester)

1. Installez **Node.js** (version 18 ou plus) depuis https://nodejs.org (bouton "LTS").
2. Ouvrez le **Terminal** (Mac) et rendez-vous dans le dossier du site :
   ```bash
   cd "/Users/kylianbreliere/Documents/Claude/CODE/KABARE WEBSITE"
   ```
3. La premiere fois seulement, installez les composants :
   ```bash
   npm install
   ```
4. Lancez le site :
   ```bash
   npm run dev
   ```
5. Ouvrez votre navigateur sur **http://localhost:3000**

Pour arreter le site : dans le Terminal, appuyez sur `Ctrl + C`.

---

## 2. Ajouter / remplacer les VIDEOS et IMAGES

### Les videos (le plus simple : YouTube ou Vimeo)

1. Mettez votre video en ligne sur **YouTube** (elle peut etre "non repertoriee" si vous
   ne voulez pas qu'elle soit publique dans les recherches) ou **Vimeo**.
2. Copiez le lien de la video (ex. `https://youtu.be/abc123`).
3. Allez sur l'**espace admin** : http://localhost:3000/admin (voir section 5).
4. Collez le lien dans le champ de la video concernee, puis cliquez **Enregistrer**.

> La video de fond de la page d'accueil (le "hero") rend mieux avec un **fichier .mp4**
> qu'avec YouTube. Pour cela, voir la methode "fichier" ci-dessous.

### Les videos en fichier .mp4 (recommande pour le fond d'accueil)

1. Deposez votre fichier dans le dossier `public/videos/` (ex. `hero.mp4`).
2. Dans l'admin, indiquez le chemin `/videos/hero.mp4` dans le champ correspondant.
3. Enregistrez.

Conseil : compressez la video (1080p, quelques Mo) avec **HandBrake** (gratuit) pour un
chargement rapide.

### Les images (logo, photos)

Deposez-les dans `public/images/` :

- **`logo.png`** : votre logo, affiche en haut a gauche. PNG a fond transparent.
  Tant qu'il est absent, le mot "Kabare Riders" s'affiche a la place.
- **`hero-poster.jpg`** : image affichee pendant le chargement de la video d'accueil (optionnel).
- **`equipe.jpg`** : photo d'equipe (optionnel).

### Le favicon (petite icone dans l'onglet du navigateur)

Deposez un fichier `favicon.ico` (ou `icon.png` en 512x512) dans le dossier `src/app/`.
Il est detecte automatiquement.

---

## 3. Configurer Calendly (reservation d'appel, page Contact)

1. Creez un compte gratuit sur https://calendly.com
2. Dans Calendly, **connectez votre Google Agenda** :
   Account > Calendar connections > Connect > Google.
3. Creez un type de rendez-vous (ex. "Appel decouverte - 30 min").
4. Recuperez votre lien, il ressemble a `https://calendly.com/votre-nom/appel-decouverte`.
5. Ouvrez le fichier **`.env.local`** a la racine du projet et renseignez :
   ```
   NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/votre-nom/appel-decouverte
   ```
6. Relancez le site (`Ctrl + C` puis `npm run dev`). Le calendrier apparait sur la page Contact.

---

## 4. Le formulaire de contact

Par defaut, quand un visiteur envoie le formulaire, cela ouvre son logiciel de mail
pre-rempli vers votre adresse. Pour **recevoir les messages directement par email**
(recommande), utilisez Formspree (gratuit) :

1. Creez un compte sur https://formspree.io
2. Creez un formulaire ; Formspree vous donne un identifiant (ex. `xdorwkny`).
3. Dans `.env.local`, ajoutez :
   ```
   NEXT_PUBLIC_FORMSPREE_ID=xdorwkny
   NEXT_PUBLIC_CONTACT_EMAIL=votre@email.com
   ```
4. Relancez le site.

---

## 5. Espace administrateur (/admin)

L'espace admin permet de gerer les videos et les liens **sans toucher au code**.

- Adresse : `votre-site.com/admin` (ou http://localhost:3000/admin en local).
- Le mot de passe est defini dans `.env.local` :
  ```
  ADMIN_PASSWORD=choisissez-un-mot-de-passe-solide
  ```
  (Un mot de passe de demarrage `kabarider2026` est deja en place - **changez-le**.)

Une fois connecte, vous pouvez :
- Coller/modifier le lien de chaque video (YouTube, Vimeo ou fichier `.mp4`).
- Gerer les **evenements** (voir section 5 bis ci-dessous).
- Ajouter / modifier / supprimer des liens (anciens evenements, futures pistes...).

Cliquez **Enregistrer** : les changements sont visibles immediatement sur le site
(pas besoin de reconstruire).

> **Important selon l'hebergeur** : l'enregistrement depuis /admin ecrit dans un fichier.
> Cela fonctionne **en local** et sur un hebergeur avec disque persistant (voir section 6).
> Sur Vercel/Netlify (serverless), le fichier n'est pas modifiable a chaud : dans ce cas,
> modifiez le fichier `data/content.json` puis redeployez (voir section 6, option B).

---

## 5 bis. Page Evenements + HelloAsso

La page **Evenements** affiche :
- **UN evenement a venir** (inscriptions ouvertes) : son nom, sa date et son lieu
  sont **recuperes automatiquement** depuis HelloAsso. Vous n'avez qu'**un seul champ
  a remplir** dans l'admin : le **lien HelloAsso** de la course. Pour changer
  d'evenement, il suffit de remplacer ce lien (jamais deux billetteries a la fois).
- **Les evenements passes** : une liste de liens vers les resultats, que vous ajoutez
  un par un dans l'admin (titre + lien). Ils s'accumulent automatiquement.

### Creer les identifiants API HelloAsso (une seule fois, ~2 min)

La recuperation auto du nom/date/lieu passe par l'API officielle HelloAsso. Il faut
donc generer une cle d'acces (gratuite) depuis votre compte association :

1. Connectez-vous sur https://admin.helloasso.com avec le compte de l'association.
2. Allez dans **Parametres / Configuration > API** (menu "Integrations & API").
3. Cliquez sur **Ajouter / Generer** un jeu de cles API. Notez le **Client ID** et le
   **Client Secret** (le secret ne s'affiche qu'une fois - copiez-le tout de suite).
4. Ouvrez `.env.local` et renseignez :
   ```
   HELLOASSO_CLIENT_ID=le-client-id
   HELLOASSO_CLIENT_SECRET=le-client-secret
   ```
5. Relancez le site (`Ctrl + C` puis `npm run dev`), ou redeployez en ligne.

> Sans ces identifiants, la page reste fonctionnelle : elle affiche l'evenement avec un
> bouton "S'inscrire sur HelloAsso", mais sans remplir automatiquement le nom/date/lieu.

### Au quotidien

- **Nouvelle course** : dans l'admin, collez le lien HelloAsso dans le champ
  "Evenement a venir". Enregistrez. Nom, date et lieu apparaissent tout seuls.
- **Course terminee** : ajoutez-la dans "Evenements passes" (titre + lien resultats),
  et videz le champ "Evenement a venir" s'il n'y a pas de suivante.

---

## 6. Mettre le site en ligne (deploiement)

Vous avez deux grandes options selon l'usage de l'admin.

### Option A - Hebergeur avec disque persistant (l'admin fonctionne en ligne)

Recommande si vous voulez modifier videos/liens depuis /admin directement en ligne.

**Render.com** (gratuit pour demarrer) :
1. Mettez le code sur un compte **GitHub** (demandez de l'aide pour cette etape une fois).
2. Sur https://render.com > New > Web Service > connectez le depot GitHub.
3. Build command : `npm install && npm run build` - Start command : `npm start`.
4. Ajoutez un **Disk** (Settings > Disks) monte sur le chemin du dossier `data`
   pour conserver les modifications de l'admin.
5. Renseignez les variables d'environnement (les memes que `.env.local`) dans
   Settings > Environment.

### Option B - Vercel (recommande : le plus simple, gratuit, tres rapide)

Ideal pour la vitesse et le SEO. L'espace admin **enregistre directement en ligne**
grace a **Vercel Blob** (petit stockage gratuit) - voir l'etape 4 ci-dessous.

1. Mettez le code sur **GitHub** (voir section 9 : "Envoyer le code sur GitHub").
2. Allez sur https://vercel.com > New Project > importez le depot.
3. Vercel detecte Next.js tout seul. Ajoutez vos **variables d'environnement**
   (onglet Environment Variables) : `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CALENDLY_URL`, `HELLOASSO_CLIENT_ID`,
   `HELLOASSO_CLIENT_SECRET`. Puis **Deploy**.
4. **Activer l'enregistrement en ligne de l'admin (Vercel Blob)** :
   - Dans votre projet Vercel : onglet **Storage** > **Create Database** > **Blob** >
     donnez un nom (ex. `kabareriders-contenu`) > **Create**.
   - Cliquez **Connect to Project** et selectionnez ce projet. Vercel ajoute alors
     automatiquement la variable `BLOB_READ_WRITE_TOKEN`.
   - **Redeployez** (onglet Deployments > ... > Redeploy) pour prendre en compte le token.
   - C'est tout : `kabareriders.com/admin` enregistre desormais videos, liens et
     evenements directement en ligne, sans rien toucher au code.
5. Branchez votre domaine **kabareriders.com** dans Settings > Domains.

> Sans l'etape 4, le site marche quand meme, mais l'admin en ligne n'enregistrera pas
> (il faudrait alors editer `data/content.json` et redeployer).

### Brancher le domaine kabareriders.com

Chez votre registrar (ou vous avez achete le domaine), pointez les DNS vers l'hebergeur
choisi (Vercel ou Render fournissent les valeurs exactes a copier). Comptez quelques
heures de propagation.

---

## 7. Charte graphique (deja appliquee)

- **Titres** : Squada One
- **Texte** : Futura (avec la police libre "Jost" en substitut automatique, car Futura
  est une police payante non diffusable sur le web). Si vous possedez une licence Futura
  web, on pourra l'integrer.
- **Couleurs** : Ocre `#C76520`, Vert `#C2A833`, Marron `#704916`, Beige `#EFE6CE`.

---

## 8. Structure des fichiers (pour reference)

```
KABARE WEBSITE/
├─ data/content.json        <- videos + liens (modifie par l'admin)
├─ public/videos/           <- vos fichiers video .mp4
├─ public/images/           <- logo, photos
├─ .env.local               <- mots de passe et reglages (a NE PAS partager)
└─ src/
   ├─ app/                  <- les pages du site
   │  ├─ page.js            (Accueil)
   │  ├─ realisations/      (Realisations)
   │  ├─ services/          (Services)
   │  ├─ evenements/        (Evenements - HelloAsso)
   │  ├─ equipe/            (Equipe)
   │  ├─ contact/           (Contact)
   │  └─ admin/             (Espace admin)
   └─ components/           <- morceaux reutilisables (header, videos...)
```

---

## 9. Envoyer le code sur GitHub

Une seule fois, pour creer le depot en ligne :

1. Creez un compte sur https://github.com puis un **New repository** (bouton vert) :
   nom `kabareriders-website`, laissez-le **vide** (pas de README), **Create repository**.
2. GitHub affiche des commandes. Le depot local est **deja pret** (initialise avec un
   premier commit). Il ne reste qu'a le relier et l'envoyer - dans le Terminal :
   ```bash
   cd "/Users/kylianbreliere/Documents/Claude/CODE/KABARE WEBSITE"
   git remote add origin https://github.com/VOTRE-COMPTE/kabareriders-website.git
   git branch -M main
   git push -u origin main
   ```
   (Remplacez `VOTRE-COMPTE` par votre identifiant GitHub. Au push, GitHub demandera
   de vous connecter dans le navigateur.)
3. Ensuite, chaque future modification se publie avec :
   ```bash
   git add -A && git commit -m "mise a jour" && git push
   ```
   Vercel redeploie automatiquement a chaque push.

Besoin d'aide pour une etape ? Notez ou vous bloquez et on la reprend ensemble.
