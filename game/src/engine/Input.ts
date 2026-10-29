// Entrees : joystick virtuel flottant (il apparait sous le pouce, n'importe ou) + clavier.
//
//   Haut ............... extension (tirer sur un kick ; pomper puis extension = bunny up)
//   Bas ................ pomper avec les jambes
//   Gauche / droite .... tourner
//   Diagonales basses .. pomper en tournant ; tres vite a la corde d un virage = schralp
//   Diagonales hautes .. poids sur l'avant (3 s dans cette position = OTB)
//   Appui bref au centre (clic) ............ trick aleatoire en l'air
//   Doigt au centre + 2e doigt haut/bas/gauche/droite ... frontflip / backflip / 360 gauche / 360 droite
//
// Clavier : fleches (combinables en diagonale), espace = clic tricks, espace + fleche = rotation.

import { emptyIntent, type Dir, type Intent } from "./intent";

type Sector = "none" | "up" | "down" | "left" | "right" | "upDiag" | "downDiag";

interface Stick {
  id: number;
  x0: number;
  y0: number;
  x: number;
  y: number;
  t0: number;
  maxMag: number;
}

const RADIUS = 62; // px pour une deflexion complete

export class Input {
  private keys = new Set<string>();
  private edges = { up: false, down: false, trick: false, dir: null as Dir | null };
  private stick: Stick | null = null;
  private trickFinger: number | null = null;
  private trickStart = { x: 0, y: 0, fired: false };
  private lastSector: Sector = "none";
  private el: { root: HTMLElement; base: HTMLElement; knob: HTMLElement; arrows: Record<Dir, HTMLElement> };
  enabled = true;
  readonly isTouch: boolean;

  constructor(root: HTMLElement) {
    this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const base = root.querySelector<HTMLElement>("#stick")!;
    this.el = {
      root,
      base,
      knob: base.querySelector<HTMLElement>(".knob")!,
      arrows: {
        up: base.querySelector<HTMLElement>(".a-up")!,
        down: base.querySelector<HTMLElement>(".a-down")!,
        left: base.querySelector<HTMLElement>(".a-left")!,
        right: base.querySelector<HTMLElement>(".a-right")!,
      },
    };
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.release();
    });
    root.addEventListener("pointerdown", (e) => this.onDown(e));
    root.addEventListener("pointermove", (e) => this.onMove(e));
    root.addEventListener("pointerup", (e) => this.onUp(e));
    root.addEventListener("pointercancel", (e) => this.onUp(e));
    root.addEventListener("contextmenu", (e) => e.preventDefault());
    this.placeGhost();
  }

  // ------------------------------------------------------------------ tactile / souris
  private onDown(e: PointerEvent) {
    e.preventDefault();
    if (!this.stick) {
      this.stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), maxMag: 0 };
      this.el.root.setPointerCapture?.(e.pointerId);
      this.el.root.classList.add("touched");
      this.showStick(e.clientX, e.clientY);
      return;
    }
    // Deuxieme doigt : rotation. Le sens du glisse du 2e doigt donne la rotation ;
    // un simple tape prend sa position par rapport au pouce.
    if (this.trickFinger === null) {
      this.trickFinger = e.pointerId;
      this.trickStart = { x: e.clientX, y: e.clientY, fired: false };
      this.el.knob.classList.add("pressed");
    }
  }

  private fireTrickDir(dx: number, dy: number) {
    const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
    this.edges.trick = true;
    this.edges.dir = d;
    this.trickStart.fired = true;
  }

  private onMove(e: PointerEvent) {
    if (this.trickFinger === e.pointerId) {
      const dx = e.clientX - this.trickStart.x;
      const dy = e.clientY - this.trickStart.y;
      if (!this.trickStart.fired && Math.hypot(dx, dy) > 24) this.fireTrickDir(dx, dy);
      return;
    }
    const s = this.stick;
    if (!s || e.pointerId !== s.id) return;
    e.preventDefault();
    s.x = e.clientX;
    s.y = e.clientY;
    s.maxMag = Math.max(s.maxMag, this.stickMag());
    const v = this.stickVec();
    this.el.knob.style.transform = `translate(${v.x * RADIUS}px, ${-v.y * RADIUS}px)`;
  }

  private onUp(e: PointerEvent) {
    if (this.trickFinger === e.pointerId) {
      if (!this.trickStart.fired && this.stick) this.fireTrickDir(e.clientX - this.stick.x, e.clientY - this.stick.y);
      this.trickFinger = null;
      this.el.knob.classList.remove("pressed");
      return;
    }
    const s = this.stick;
    if (!s || e.pointerId !== s.id) return;
    // Appui bref sans bouger = clic sur TRICKS
    if (performance.now() - s.t0 < 260 && s.maxMag < 0.25) this.edges.trick = true;
    this.release();
  }

  private release() {
    this.stick = null;
    this.trickFinger = null;
    this.el.knob.classList.remove("pressed");
    this.el.knob.style.transform = "";
    this.placeGhost();
  }

  private showStick(x: number, y: number) {
    const r = this.el.root.getBoundingClientRect();
    const b = this.el.base;
    b.style.left = `${x - r.left}px`;
    b.style.top = `${y - r.top}px`;
    b.classList.add("active");
  }

  /** Joystick fantome en bas de l'ecran quand aucun doigt n'est pose (pour montrer les aides) */
  private placeGhost() {
    const b = this.el.base;
    b.classList.remove("active");
    b.style.left = "50%";
    b.style.top = "calc(100% - 120px - env(safe-area-inset-bottom, 0px))";
  }

  private stickVec(): { x: number; y: number } {
    const s = this.stick;
    if (!s) return { x: 0, y: 0 };
    let x = (s.x - s.x0) / RADIUS;
    let y = -(s.y - s.y0) / RADIUS;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return { x, y };
  }

  private stickMag() {
    const v = this.stickVec();
    return Math.hypot(v.x, v.y);
  }

  // ------------------------------------------------------------------ clavier
  private onKey(e: KeyboardEvent, down: boolean) {
    const map: Record<string, string> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right", KeyZ: "up", KeyQ: "left",
      Space: "trick",
    };
    const k = map[e.code];
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;
    if (down) {
      if (k === "trick") this.edges.trick = true;
      else if (this.keys.has("trick")) this.edges.dir = k as Dir;
      this.keys.add(k);
    } else this.keys.delete(k);
  }

  // ------------------------------------------------------------------ lecture
  private sectorOf(x: number, y: number): Sector {
    const m = Math.hypot(x, y);
    if (m < 0.22) return "none";
    const a = (Math.atan2(y, x) * 180) / Math.PI; // 0 = droite, 90 = haut
    if (a >= 67.5 && a <= 112.5) return "up";
    if (a > 22.5 && a < 157.5) return "upDiag";
    if (a <= -67.5 && a >= -112.5) return "down";
    if (a < -22.5 && a > -157.5) return "downDiag";
    return x > 0 ? "right" : "left";
  }

  /** Aide visuelle : fait clignoter des branches du joystick */
  setHint(keys: (Dir | "trick")[]) {
    for (const d of ["up", "down", "left", "right"] as Dir[]) this.el.arrows[d].classList.toggle("hint", keys.includes(d));
    this.el.knob.classList.toggle("hint", keys.includes("trick"));
  }

  consume(): Intent {
    const it = emptyIntent();
    if (!this.enabled) {
      this.edges = { up: false, down: false, trick: false, dir: null };
      return it;
    }
    const kTrick = this.keys.has("trick");
    let x: number;
    let y: number;
    if (this.stick) ({ x, y } = this.stickVec());
    else if (!kTrick) {
      x = (this.keys.has("right") ? 1 : 0) - (this.keys.has("left") ? 1 : 0);
      y = (this.keys.has("up") ? 1 : 0) - (this.keys.has("down") ? 1 : 0);
    } else {
      x = 0;
      y = 0;
    }
    const sec = this.sectorOf(x, y);
    const trickHeld = kTrick || this.trickFinger !== null;
    it.trick = trickHeld;
    it.trickPressed = this.edges.trick;
    it.trickDirPressed = this.edges.dir;
    if (trickHeld) {
      it.trickDir = this.edges.dir;
    } else {
      it.steer = sec === "up" || sec === "down" || sec === "none" ? 0 : Math.sign(x) * Math.min(1, Math.max(0, (Math.abs(x) - 0.06) / 0.8));
      it.up = sec === "up";
      it.down = sec === "down" || sec === "downDiag";
      it.lean = sec === "upDiag";
      it.schralp = sec === "downDiag" ? Math.sign(x) : 0;
      it.upPressed = it.up && this.lastSector !== "up";
      it.downPressed = it.down && this.lastSector !== "down" && this.lastSector !== "downDiag";
      this.lastSector = sec;
    }
    // Branche active du joystick
    for (const d of ["up", "down", "left", "right"] as Dir[]) {
      const on = (d === "up" && (sec === "up" || sec === "upDiag")) || (d === "down" && (sec === "down" || sec === "downDiag")) ||
        (d === "left" && x < -0.4 && sec !== "none") || (d === "right" && x > 0.4 && sec !== "none");
      this.el.arrows[d].classList.toggle("on", on && !trickHeld);
    }
    this.edges = { up: false, down: false, trick: false, dir: null };
    return it;
  }
}
