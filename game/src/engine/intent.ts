// Intention du joueur pour une frame, independante du peripherique (clavier / tactile / bot).

export type Dir = "up" | "down" | "left" | "right";

export interface Intent {
  /** Direction laterale -1 (gauche) .. 1 (droite). 0 quand Tricks est maintenu. */
  steer: number;
  up: boolean;
  down: boolean;
  /** Appuis (fronts montants) depuis la frame precedente */
  upPressed: boolean;
  downPressed: boolean;
  trick: boolean;
  trickPressed: boolean;
  /** Direction maintenue pendant que Tricks est maintenu */
  trickDir: Dir | null;
  trickDirPressed: Dir | null;
}

export const emptyIntent = (): Intent => ({
  steer: 0,
  up: false,
  down: false,
  upPressed: false,
  downPressed: false,
  trick: false,
  trickPressed: false,
  trickDir: null,
  trickDirPressed: null,
});
