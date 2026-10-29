// Entrees clavier + tactile -> Intent.
// Ordi : fleches + espace (Tricks).
// Mobile : pouce gauche = zone de direction ; pouce droit = swipe haut (tirer) / bas (pomper) ;
//          bouton TRICKS a maintenir + swipe (depuis le bouton, ou direction du pouce gauche).

import { CONFIG } from "../config";
import { emptyIntent, type Dir, type Intent } from "./intent";

interface TouchTrack {
  id: number;
  zone: "steer" | "swipe" | "trick";
  x0: number;
  y0: number;
  dir: Dir | null;
}

export class Input {
  private keys = new Set<string>();
  private edges = { up: false, down: false, trick: false, dir: null as Dir | null };
  private touches = new Map<number, TouchTrack>();
  private touchSteer = 0;
  private touchUp = false;
  private touchDown = false;
  private touchTrick = false;
  private touchTrickDir: Dir | null = null;
  enabled = true;
  readonly isTouch: boolean;

  constructor(root: HTMLElement, private trickBtn: HTMLElement, private steerKnob: HTMLElement) {
    this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
    window.addEventListener("blur", () => this.keys.clear());
    root.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    root.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    root.addEventListener("touchend", (e) => this.onTouchEnd(e), { passive: false });
    root.addEventListener("touchcancel", (e) => this.onTouchEnd(e), { passive: false });
  }

  private get trickHeld() {
    return this.keys.has("Space") || this.touchTrick;
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const map: Record<string, string> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right", KeyZ: "up", KeyQ: "left",
      Space: "Space",
    };
    const k = map[e.code];
    if (!k) return;
    e.preventDefault();
    if (down && !this.keys.has(k)) {
      if (k === "Space") this.edges.trick = true;
      else if (this.trickHeld) this.edges.dir = k as Dir;
      else if (k === "up") this.edges.up = true;
      else if (k === "down") this.edges.down = true;
    }
    if (down) this.keys.add(k);
    else this.keys.delete(k);
  }

  // ------------------------------------------------------------------ tactile
  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const w = window.innerWidth;
    for (const t of Array.from(e.changedTouches)) {
      const onTrick = (t.target as HTMLElement)?.closest?.("#btn-trick") !== null;
      const zone: TouchTrack["zone"] = onTrick ? "trick" : t.clientX < w * 0.45 ? "steer" : "swipe";
      this.touches.set(t.identifier, { id: t.identifier, zone, x0: t.clientX, y0: t.clientY, dir: null });
      if (zone === "trick") {
        this.touchTrick = true;
        this.edges.trick = true;
        this.trickBtn.classList.add("active");
      }
      if (zone === "steer") {
        this.steerKnob.style.left = `${t.clientX}px`;
        this.steerKnob.style.top = `${t.clientY}px`;
        this.steerKnob.classList.add("visible");
      }
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const th = CONFIG.input.swipeThreshold;
    for (const t of Array.from(e.changedTouches)) {
      const tr = this.touches.get(t.identifier);
      if (!tr) continue;
      const dx = t.clientX - tr.x0;
      const dy = t.clientY - tr.y0;
      if (tr.zone === "steer") {
        this.touchSteer = Math.max(-1, Math.min(1, dx / CONFIG.input.steerRange));
        if (this.trickHeld) {
          const d: Dir | null = dx < -th ? "left" : dx > th ? "right" : dy < -th ? "up" : dy > th ? "down" : null;
          if (d && d !== tr.dir) this.edges.dir = d;
          tr.dir = d;
          this.touchTrickDir = d;
        }
      } else {
        const d = swipeDir(dx, dy, th);
        if (d && d !== tr.dir) {
          tr.dir = d;
          if (tr.zone === "trick" || this.trickHeld) {
            this.edges.dir = d;
            this.touchTrickDir = d;
          } else if (d === "up") {
            this.edges.up = true;
            this.touchUp = true;
            this.touchDown = false;
          } else if (d === "down") {
            this.edges.down = true;
            this.touchDown = true;
            this.touchUp = false;
          }
        }
      }
    }
  }

  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      const tr = this.touches.get(t.identifier);
      if (!tr) continue;
      this.touches.delete(t.identifier);
      if (tr.zone === "steer") {
        this.touchSteer = 0;
        this.steerKnob.classList.remove("visible");
        if (tr.dir) this.touchTrickDir = null;
      } else if (tr.zone === "swipe") {
        if (tr.dir === "up") this.touchUp = false;
        if (tr.dir === "down") this.touchDown = false;
        if (tr.dir && this.touchTrickDir === tr.dir) this.touchTrickDir = null;
      } else {
        this.touchTrick = false;
        this.touchTrickDir = null;
        this.trickBtn.classList.remove("active");
      }
    }
  }

  /** Lit l'intention de la frame et remet les appuis a zero */
  consume(): Intent {
    const it = emptyIntent();
    if (!this.enabled) {
      this.resetEdges();
      return it;
    }
    const trick = this.trickHeld;
    it.trick = trick;
    it.trickPressed = this.edges.trick;
    if (trick) {
      const k = this.keys;
      it.trickDir = this.touchTrickDir ?? (k.has("up") ? "up" : k.has("down") ? "down" : k.has("left") ? "left" : k.has("right") ? "right" : null);
      it.trickDirPressed = this.edges.dir;
    } else {
      const kSteer = (this.keys.has("right") ? 1 : 0) - (this.keys.has("left") ? 1 : 0);
      it.steer = Math.max(-1, Math.min(1, kSteer + this.touchSteer));
      it.up = this.keys.has("up") || this.touchUp;
      it.down = this.keys.has("down") || this.touchDown;
      it.upPressed = this.edges.up;
      it.downPressed = this.edges.down;
    }
    this.resetEdges();
    return it;
  }

  private resetEdges() {
    this.edges.up = this.edges.down = this.edges.trick = false;
    this.edges.dir = null;
  }
}

function swipeDir(dx: number, dy: number, th: number): Dir | null {
  if (Math.abs(dx) < th && Math.abs(dy) < th) return null;
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? "up" : "down";
  return dx < 0 ? "left" : "right";
}
