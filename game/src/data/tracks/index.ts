import type { TrackDef } from "../types";
import { aptDual } from "./apt-dual";

// Ajouter une piste : creer un fichier dans ce dossier et l'ajouter ici.
// Prevues : Bonnieux enduro, Peisey-Vallandry, Crankabare, Courchevel The Cycling, Loudenvielle.
export const TRACKS: Record<string, TrackDef> = {
  [aptDual.id]: aptDual,
};

export const DEFAULT_TRACK = aptDual.id;
