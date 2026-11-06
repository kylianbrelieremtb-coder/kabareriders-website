// Textures Three.js construites a partir des canvas procéduraux (canvasTextures.ts).

import * as THREE from "three";
import { canvas, chipsCanvas, dirtCanvas, grassCanvas, gravelCanvas, woodCanvas } from "./canvasTextures";

function finish(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export const dirtTexture = () => finish(dirtCanvas());
export const gravelTexture = () => finish(gravelCanvas());
export const grassTexture = () => finish(grassCanvas());
export const woodTexture = () => finish(woodCanvas());
export const chipsTexture = () => finish(chipsCanvas());

/** Canvas generique pour peindre le sol vu de dessus */
export function paintedTexture(size: number, paint: (g: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const { c, g } = canvas(size);
  paint(g, size);
  return finish(c, false);
}
