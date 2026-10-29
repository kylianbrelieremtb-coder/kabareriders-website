// Point d'entree du jeu "Roule la piste".
// Par defaut : version Affiche (vue derriere le rider). ?mode=top : vue de dessus, ?mode=3d : version 3D.
import "./ui/style.css";
import { CHARACTERS } from "./data/characters";
import { OPPONENTS } from "./data/opponents";
import { DEFAULT_TRACK, TRACKS } from "./data/tracks";

// Parametres d'URL : ?piste=apt-dual&adversaire=christian-cayol&rider=kylian&mode=3d
const params = new URLSearchParams(location.search);
const track = TRACKS[params.get("piste") ?? DEFAULT_TRACK] ?? TRACKS[DEFAULT_TRACK];
const character = CHARACTERS.find((c) => c.id === params.get("rider")) ?? CHARACTERS[0];
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
