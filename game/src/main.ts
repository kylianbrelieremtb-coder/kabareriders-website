// Point d'entree du jeu "Roule la piste".
import "./ui/style.css";
import { Game } from "./Game";
import { CHARACTERS } from "./data/characters";
import { OPPONENTS } from "./data/opponents";
import { DEFAULT_TRACK, TRACKS } from "./data/tracks";

// Parametres d'URL (pour les futures pistes / adversaires) : ?piste=apt-dual&adversaire=christian-cayol
const params = new URLSearchParams(location.search);
const track = TRACKS[params.get("piste") ?? DEFAULT_TRACK] ?? TRACKS[DEFAULT_TRACK];
const character = CHARACTERS.find((c) => c.id === params.get("rider")) ?? CHARACTERS[0];
const opponent = OPPONENTS.find((o) => o.id === params.get("adversaire")) ?? OPPONENTS[0];

new Game(document.getElementById("c") as HTMLCanvasElement, track, character, opponent);
