import type { TrackDef } from "../types";
import { aptDual } from "./apt-dual";
import { loudenvielle } from "./loudenvielle";

// Ajouter une piste : creer un fichier dans ce dossier et l'ajouter ici.
// Prevues : Bonnieux enduro, Peisey-Vallandry, Crankabare, Courchevel The Cycling, Loudenvielle.
export const TRACKS: Record<string, TrackDef> = {
  [aptDual.id]: aptDual,
  [loudenvielle.id]: loudenvielle,
};

export const DEFAULT_TRACK = aptDual.id;
