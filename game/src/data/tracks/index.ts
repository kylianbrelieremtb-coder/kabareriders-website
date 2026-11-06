import type { TrackDef } from "../types";
import { aptDual } from "./apt-dual";
import { loudenvielle } from "./loudenvielle";
import { peisey } from "./peisey";
import { crankabare } from "./crankabare";
import { kabareEnduro } from "./kabare-enduro";
import { courchevel } from "./courchevel";

// Ajouter une piste : creer un fichier dans ce dossier et l'ajouter ici.
export const TRACKS: Record<string, TrackDef> = {
  [aptDual.id]: aptDual,
  [loudenvielle.id]: loudenvielle,
  [peisey.id]: peisey,
  [crankabare.id]: crankabare,
  [kabareEnduro.id]: kabareEnduro,
  [courchevel.id]: courchevel,
};

export const DEFAULT_TRACK = aptDual.id;
