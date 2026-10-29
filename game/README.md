# Roule la piste — jeu de Dual VTT KABARE

Prototype v1 : une piste (Dual du plan d'eau d'Apt), un rider (Kylian), un adversaire (Christian Cayol).

Vite + TypeScript + Three.js. Le jeu se builde en **dossier statique autonome** dans `game/dist/`.
Il n'est pas encore integre au site : une fois le jeu finalise, on branchera ce dossier sur une page
`/jeu` (plein ecran) avec une banniere sur l'accueil.

## Commandes (depuis ce dossier `game/`)

```bash
npm install          # une seule fois
npm run dev          # jeu seul sur http://localhost:5173 (et sur le reseau local pour le telephone)
npm run build        # verifie le code et genere dist/
npm run test:rules   # verifie les regles de chute et les tricks
npm run calibrate    # temps de course selon le taux de reussite + deroule d'un run
npm run jumps        # resultat de chaque saut selon la vitesse (P=perfect, o=ok, b=mauvais, X=chute)
```


## Architecture

```
src/
  config.ts              TOUS les reglages de gameplay (vitesses, fenetres, hype, boost...)
  data/
    types.ts             formats des donnees (modules de piste, riders, adversaires)
    tracks/apt-dual.ts   la piste : liste ordonnee de modules (type + tailles)
    tracks/index.ts      registre des pistes
    characters.ts        personnages jouables
    opponents.ts         adversaires (taux de reussite cache, signature de vitesse)
  engine/
    Track.ts             modules -> ligne centrale, altitude, devers, "features" (bosses, virages, sauts)
    RiderSim.ts          physique arcade du joueur : pump, sauts, tricks, hype, chutes (sans rendu)
    Bot.ts               pilote automatique : calibre le temps de l'adversaire
    OpponentRunner.ts    rejoue le run calibre avec la signature de vitesse de l'adversaire
    World.ts / Crowd.ts  decor low-poly, rubalise, barrieres, public instancie
    RiderModel.ts        modele rider + VTT, poses et animations de tricks
    Input.ts             clavier + tactile -> intention (intent.ts)
    Audio.ts             sons synthetises (aucun fichier)
  ui/Hud.ts, style.css   HUD et ecrans
  Game.ts                boucle de jeu et enchainement des phases
```

### Ajouter une piste
1. Copier `src/data/tracks/apt-dual.ts`, changer les modules (`start`, `straight`, `rollers`,
   `berm`, `table`, `kicker`, `finish`) et `hypeToFill`.
2. L'ajouter dans `src/data/tracks/index.ts`.
3. `npm run calibrate` pour verifier que chaque saut est passable, puis jouer avec `?piste=<id>`.

### Ajouter un adversaire / un personnage
Ajouter une entree dans `opponents.ts` / `characters.ts` (nom, couleurs, taux, profil de vitesse).
URL : `?adversaire=<id>&rider=<id>`.

### Prevu dans l'architecture (pas encore code)
- Tournoi 16e -> finale : enchainer des `Game` avec un adversaire tire parmi deux par tour.
- Points : `RiderSim.tricksLanded` + tour atteint ; classement en ligne (Supabase) a brancher sur l'ecran de fin.

## Modes de debug
- `?debug=bot` : pilote automatique
- `?debug=top` : vue de dessus de la piste (menu)
- `?debug=side` : gros plan des modeles (menu)
