// Lignes de vitesse : traits blancs qui filent depuis le centre de l'ecran, plus nombreux quand on va vite.

interface Streak {
  a: number; // angle
  r: number; // distance au centre (0..1)
  v: number; // vitesse radiale
  len: number;
}

export class SpeedLines {
  private canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d")!;
  private streaks: Streak[] = [];
  private level = 0;

  constructor(parent: HTMLElement) {
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
    parent.insertBefore(this.canvas, parent.children[1] ?? null);
    for (let i = 0; i < 60; i++) this.streaks.push(this.spawn(Math.random()));
  }

  private spawn(r = 0.25 + Math.random() * 0.2): Streak {
    return { a: Math.random() * Math.PI * 2, r, v: 0.9 + Math.random() * 1.1, len: 0.06 + Math.random() * 0.12 };
  }

  /** intensity 0..1 */
  update(dt: number, intensity: number) {
    this.level += (intensity - this.level) * Math.min(1, dt * 4);
    const c = this.canvas;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w / 2) || c.height !== Math.round(h / 2)) {
      c.width = Math.round(w / 2);
      c.height = Math.round(h / 2);
    }
    const g = this.ctx;
    g.clearRect(0, 0, c.width, c.height);
    if (this.level < 0.02) return;
    const cx = c.width / 2;
    const cy = c.height * 0.42;
    const R = Math.hypot(c.width, c.height) * 0.6;
    const n = Math.floor(this.streaks.length * this.level);
    g.lineCap = "round";
    for (let i = 0; i < this.streaks.length; i++) {
      const s = this.streaks[i];
      s.r += s.v * dt * (0.6 + this.level);
      if (s.r > 1.1) Object.assign(s, this.spawn());
      if (i >= n) continue;
      const r0 = s.r * R;
      const r1 = (s.r + s.len) * R;
      g.strokeStyle = `rgba(255,255,255,${0.35 * this.level * Math.min(1, (s.r - 0.2) * 3)})`;
      g.lineWidth = 1 + s.r * 2.5;
      g.beginPath();
      g.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0);
      g.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1);
      g.stroke();
    }
  }
}
