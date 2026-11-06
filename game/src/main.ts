// Point d'entree du jeu "Roule la piste".
// Par defaut : version Affiche (vue derriere le rider). ?mode=top : vue de dessus, ?mode=3d : version 3D.
import "./ui/style.css";
import { CHARACTERS } from "./data/characters";
import { OPPONENTS } from "./data/opponents";
import { DEFAULT_TRACK, TRACKS } from "./data/tracks";

// Parametres d'URL : ?piste=apt-dual&adversaire=christian-cayol&rider=kylian&mode=3d
const params = new URLSearchParams(location.search);

let saved: string | null = null;
try {
  saved = localStorage.getItem("rlp-rider");
} catch {
  /* stockage indisponible */
}
let savedTrack: string | null = null;
try {
  savedTrack = localStorage.getItem("rlp-piste");
} catch {
  /* stockage indisponible */
}
const track = TRACKS[params.get("piste") ?? savedTrack ?? DEFAULT_TRACK] ?? TRACKS[DEFAULT_TRACK];
const character = CHARACTERS.find((c) => c.id === (params.get("rider") ?? saved)) ?? CHARACTERS[0];
const opponent = OPPONENTS.find((o) => o.id === params.get("adversaire")) ?? OPPONENTS[0];
const canvas = document.getElementById("c") as HTMLCanvasElement;

const mode = params.get("mode");
// La version Affiche s'affiche a sa premiere image ; les autres tout de suite
if (mode === "3d" || mode === "top") document.body.classList.remove("boot");
if (mode === "3d") {
  import("./Game").then(({ Game }) => new Game(canvas, track, character, opponent));
} else if (mode === "top") {
  import("./Game2D").then(({ Game2D }) => new Game2D(canvas, track, character, opponent));
} else {
  import("./GamePoster").then(({ GamePoster }) => new GamePoster(canvas, track, character, opponent));
}

// Message "tiens ton telephone a la verticale" : seulement si le telephone reste a l'horizontale
// (pas pendant le passage en plein ecran ou un basculement bref, qui faisaient un flash plein ecran)
const landscapeQuery = window.matchMedia("(orientation: landscape) and (pointer: coarse) and (max-height: 520px)");
let landscapeTimer = 0;
const checkLandscape = () => {
  window.clearTimeout(landscapeTimer);
  if (!landscapeQuery.matches) document.body.classList.remove("landscape");
  else landscapeTimer = window.setTimeout(() => document.body.classList.toggle("landscape", landscapeQuery.matches), 800);
};
landscapeQuery.addEventListener("change", checkLandscape);
checkLandscape();
