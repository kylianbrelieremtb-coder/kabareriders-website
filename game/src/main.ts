// Point d'entree du jeu "Roule la piste".
// Par defaut : version 2D vue de dessus. ?mode=3d : ancienne version 3D (chargee a la demande).
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

if (params.get("mode") === "3d") {
  import("./Game").then(({ Game }) => new Game(canvas, track, character, opponent));
} else {
  import("./Game2D").then(({ Game2D }) => new Game2D(canvas, track, character, opponent));
}
