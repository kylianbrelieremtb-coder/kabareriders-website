import type { TrackDef } from "../types";
import { aptDual } from "./apt-dual";
import { loudenvielle } from "./loudenvielle";
import { peisey } from "./peisey";

// Ajouter une piste : creer un fichier dans ce dossier et l'ajouter ici.
// Prevues : Bonnieux enduro, Peisey-Vallandry, Crankabare, Courchevel The Cycling, Loudenvielle.
export const TRACKS: Record<string, TrackDef> = {
  [aptDual.id]: aptDual,
  [loudenvielle.id]: loudenvielle,
  [peisey.id]: peisey,
};

export const DEFAULT_TRACK = aptDual.id;
