// Entrees clavier + gros boutons a l'ecran (tactile et souris) -> Intent.
// Ordi : fleches + espace (Tricks). Mobile (portrait) : boutons ◀ ▶ ▲ ▼ et TRICKS en bas de l'ecran.
// Tricks maintenu : les fleches servent aux tricks ; la direction revient au relachement.

import { emptyIntent, type Dir, type Intent } from "./intent";

type Key = Dir | "trick";

export class Input {
  /** Touches clavier et boutons maintenus (un bouton peut etre tenu par plusieurs doigts) */
  private held = new Map<Key, number>();
  private edges = { up: false, down: false, trick: false, dir: null as Dir | null };
  private buttons = new Map<Key, HTMLElement>();
  enabled = true;
  readonly isTouch: boolean;

  constructor(panel: HTMLElement) {
    this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
    window.addEventListener("blur", () => this.releaseAll());

    panel.querySelectorAll<HTMLElement>("[data-key]").forEach((btn) => {
      const key = btn.dataset.key as Key;
      this.buttons.set(key, btn);
      const pointers = new Set<number>();
      const release = (e: PointerEvent) => {
        if (!pointers.delete(e.pointerId)) return;
        this.release(key);
      };
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        btn.setPointerCapture?.(e.pointerId);
        pointers.add(e.pointerId);
        this.press(key);
      });
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointercancel", release);
      btn.addEventListener("lostpointercapture", release);
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
    });
  }

  private isHeld(k: Key) {
    return (this.held.get(k) ?? 0) > 0;
  }

  private press(k: Key) {
    const was = this.isHeld(k);
    this.held.set(k, (this.held.get(k) ?? 0) + 1);
    this.buttons.get(k)?.classList.add("down");
    if (was) return;
    if (k === "trick") this.edges.trick = true;
    else if (this.isHeld("trick")) this.edges.dir = k;
    else if (k === "up") this.edges.up = true;
    else if (k === "down") this.edges.down = true;
  }

  private release(k: Key) {
    const n = Math.max(0, (this.held.get(k) ?? 0) - 1);
    this.held.set(k, n);
    if (n === 0) this.buttons.get(k)?.classList.remove("down");
  }

  private releaseAll() {
    this.held.clear();
    this.buttons.forEach((b) => b.classList.remove("down"));
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const map: Record<string, Key> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right", KeyZ: "up", KeyQ: "left",
      Space: "trick",
    };
    const k = map[e.code];
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;
    if (down) this.press(k);
    else this.release(k);
  }

  /** Allume un bouton pour guider le joueur (aide avant les sauts) */
  setHint(keys: Key[]) {
    this.buttons.forEach((b, k) => b.classList.toggle("hint", keys.includes(k)));
  }

  /** Lit l'intention de la frame et remet les appuis a zero */
  consume(): Intent {
    const it = emptyIntent();
    if (this.enabled) {
      const trick = this.isHeld("trick");
      it.trick = trick;
      it.trickPressed = this.edges.trick;
      if (trick) {
        const dirs: Dir[] = ["up", "down", "left", "right"];
        it.trickDir = dirs.find((d) => this.isHeld(d)) ?? null;
        it.trickDirPressed = this.edges.dir;
      } else {
        it.steer = (this.isHeld("right") ? 1 : 0) - (this.isHeld("left") ? 1 : 0);
        it.up = this.isHeld("up");
        it.down = this.isHeld("down");
        it.upPressed = this.edges.up;
        it.downPressed = this.edges.down;
      }
    }
    this.edges.up = this.edges.down = this.edges.trick = false;
    this.edges.dir = null;
    return it;
  }
}
