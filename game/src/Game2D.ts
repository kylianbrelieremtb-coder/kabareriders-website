// Version 2D vue de dessus (facon drone) : meme physique, meme adversaire, meme interface
// que la version 3D, rendu en Canvas 2D. Phases : menu -> countdown -> race -> end.

import { CONFIG } from "./config";
import type { CharacterDef, OpponentDef, TrackDef } from "./data/types";
import { GameAudio } from "./engine/Audio";
import { Bot, calibrate, type ReferenceRun } from "./engine/Bot";
import { Input } from "./engine/Input";
import { emptyIntent } from "./engine/intent";
import { OpponentRunner } from "./engine/OpponentRunner";
import { RiderSim } from "./engine/RiderSim";
import { Track } from "./engine/Track";
import { Map2D, SHADOW } from "./render2d/Map2D";
import { RiderSprite } from "./render2d/RiderSprite";
import { Hud } from "./ui/Hud";

type Phase = "menu" | "countdown" | "race" | "end";
const SIM_DT = 1 / 120;

interface Particle {
  x: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  max: number;
  r: number;
}

export class Game2D {
  private ctx: CanvasRenderingContext2D;
  private track: Track;
  private map: Map2D;
  private hud = new Hud();
  private input: Input;
  private audio = new GameAudio();
  private playerSprite: RiderSprite;
  private oppSprite: RiderSprite;

  private player!: RiderSim;
  private opponent: OpponentRunner | null = null;
  private reference: { run: ReferenceRun; time: number } | null = null;
  private autopilot: Bot | null = null;

  private phase: Phase = "menu";
  private phaseT = 0;
  private acc = 0;
  private last = 0;
  private endTimer = -1;
  private cdLabel = "";
  private dpr = 1;
  private cam = { x: 0, z: 0, h: 0, w: 30 };
  private shake = 0;
  private perfAcc = 0;
  private perfN = 0;
  private cheer = 0;
  private time = 0;
  private particles: Particle[] = [];
  private streaks: { x: number; y: number; len: number; v: number }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    trackDef: TrackDef,
    private character: CharacterDef,
    private opponentDef: OpponentDef,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.track = new Track(trackDef);
    this.map = new Map2D(this.track);
    this.playerSprite = new RiderSprite(character);
    this.oppSprite = new RiderSprite(opponentDef);
    for (let i = 0; i < 40; i++) this.streaks.push({ x: Math.random(), y: Math.random(), len: 0.05 + Math.random() * 0.1, v: 0.8 + Math.random() });

    this.input = new Input(document.getElementById("pad")!);
    document.body.classList.toggle("touch", this.input.isTouch);
    this.hud.setMenuInfo(`${trackDef.name} · ${trackDef.place}`, character.name, opponentDef.name);
    document.getElementById("btn-play")!.addEventListener("click", () => this.startRace());
    document.getElementById("btn-replay")!.addEventListener("click", () => this.startRace());
    document.getElementById("btn-quit")!.addEventListener("click", () => this.toMenu());
    const mute = document.getElementById("btn-mute")!;
    mute.addEventListener("click", () => {
      this.audio.setMuted(!this.audio.muted);
      mute.textContent = this.audio.muted ? "🔇" : "🔊";
    });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Enter" && (this.phase === "menu" || (this.phase === "end" && this.endTimer < 0))) this.startRace();
    });
    window.addEventListener("resize", () => this.resize());
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    this.resetRiders();
    const st = this.track.posAt(this.track.startS, 0);
    this.cam = { x: st.x, z: st.z, h: this.track.headingAt(this.track.startS), w: 34 };
    this.map.prefetch(st.x - 30, st.z - 60, st.x + 30, st.z + 20, 16);
    this.hud.show("menu", this.input.isTouch);
    this.last = performance.now();
    const loop = (t: number) => {
      this.frame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  private resetRiders() {
    this.player = new RiderSim(this.track, -1);
    if (this.reference) this.opponent = new OpponentRunner(this.track, this.opponentDef, this.reference.run, this.reference.time);
  }

  private toMenu() {
    this.phase = "menu";
    this.phaseT = 0;
    this.resetRiders();
    this.hud.show("menu", this.input.isTouch);
  }

  private startRace() {
    this.audio.unlock();
    tryFullscreen();
    if (!this.reference) {
      this.hud.show("loading", this.input.isTouch);
      setTimeout(() => {
        const c = calibrate(this.track, this.opponentDef.successRate);
        this.reference = { run: c.median, time: c.meanTime };
        this.startRace();
      }, 30);
      return;
    }
    this.resetRiders();
    this.autopilot = location.search.includes("debug=bot") ? new Bot(this.player, 0.6, Math.random) : null;
    this.phase = "countdown";
    this.phaseT = 0;
    this.endTimer = -1;
    this.cdLabel = "";
    this.particles.length = 0;
    this.hud.show("race", this.input.isTouch);
    this.hud.setCountdown("");
    this.hud.setHype(0, false);
    this.input.consume();
  }

  // ------------------------------------------------------------------ boucle
  private frame(now: number) {
    const realDt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.phaseT += realDt;
    const dt = this.phase === "menu" ? realDt : realDt * CONFIG.timeScale;
    this.time += dt;

    if (this.phase === "countdown") this.updateCountdown();
    if (this.phase === "race" || this.phase === "end") {
      this.acc += dt;
      let intent = this.phase === "race" && this.player.state === "racing" ? this.input.consume() : (this.input.consume(), emptyIntent());
      if (this.autopilot && this.player.state === "racing") intent = this.autopilotIntent();
      let first = true;
      while (this.acc >= SIM_DT) {
        this.acc -= SIM_DT;
        const it = first ? intent : { ...intent, upPressed: false, downPressed: false, trickPressed: false, trickDirPressed: null };
        first = false;
        this.player.step(SIM_DT, it);
        this.handleEvents();
        this.opponent?.step(SIM_DT);
      }
      this.updateRaceFlow(dt);
    }
    this.cheer = Math.max(0, this.cheer - dt * 0.6);
    const excitement = Math.min(1.4, this.player.hypeRatio + (this.player.boostTime > 0 ? 0.5 : 0) + this.cheer);
    this.audio.update(this.phase === "race" ? this.player.v : 0, this.phase === "menu" ? 0 : Math.min(1, excitement));
    this.hud.setHype(this.player.hypeRatio, this.player.boostTime > 0);
    this.updateParticles(dt);
    this.updateCamera(dt);
    const r0 = performance.now();
    this.render(dt, excitement);
    if (location.search.includes("perf")) {
      this.perfAcc += performance.now() - r0;
      if (++this.perfN === 30) {
        console.log("render ms", (this.perfAcc / 30).toFixed(1), "frame dt", realDt.toFixed(3));
        this.perfAcc = 0;
        this.perfN = 0;
      }
    }
  }

  private updateCountdown() {
    const n = 3 - Math.floor(this.phaseT / CONFIG.ui.countdownStep);
    const label = n > 0 ? String(n) : "GO !";
    if (label !== this.cdLabel) {
      this.cdLabel = label;
      this.hud.setCountdown(label);
      this.audio.beep(n <= 0);
    }
    if (n <= 0) {
      this.phase = "race";
      this.phaseT = 0;
      this.player.go();
      this.opponent?.go();
      setTimeout(() => this.phase === "race" && this.hud.setCountdown(""), 600);
    }
  }

  private autopilotIntent() {
    const it = this.autopilot!.intent();
    const p = this.player;
    const big = this.track.features.find((f) => f.kind === "jump" && f.big && f.s > p.s && f.s - p.s < p.v * 0.3);
    if (big && !it.upPressed && !it.downPressed) {
      it.trick = true;
      it.trickDir = "down";
      it.trickDirPressed = "down";
    } else if (p.airborne && !p.trick && p.vy > 1 && p.remainingAir() > 0.75) {
      it.trickPressed = true;
      it.trick = true;
    }
    return it;
  }

  private riderPos(sim: { s: number; u: number }, lane: -1 | 1) {
    return this.track.posAt(sim.s, this.track.laneCenter(lane) + sim.u, { x: 0, z: 0 });
  }

  private handleEvents() {
    const p = this.player;
    const pos = () => this.riderPos(p, -1);
    for (const e of p.events) {
      switch (e.type) {
        case "perfect":
          this.hud.popup(e.streak > 2 ? `PERFECT x${e.streak}` : "PERFECT", "perfect");
          break;
        case "schralp": {
          this.hud.popup("SCHRALP !", "schralp");
          this.audio.skid();
          this.cheer += 0.6;
          const q = pos();
          this.emit(q.x, q.z, 26, 2.5);
          break;
        }
        case "trick":
          this.hud.popup(CONFIG.trick.list[e.id].label, "trick");
          this.cheer += e.hype >= 30 ? 1.2 : 0.7;
          this.audio.cheer(e.hype >= 30 ? 1.2 : 0.7);
          break;
        case "hypeFull":
          this.hud.popup("BOOST !", "boost");
          this.audio.cheer(1.4);
          break;
        case "land": {
          this.audio.thud();
          this.shake = Math.max(this.shake, e.quality === "perfect" ? 0.12 : e.quality === "ok" ? 0.2 : 0.35);
          const q = pos();
          this.emit(q.x, q.z, e.quality === "perfect" ? 12 : 22, 1.8);
          if (e.quality === "bad") this.hud.popup(e.ratio < 0 ? "Casé…" : e.ratio > 0 ? "Trop long…" : "Aïe…", "bad");
          break;
        }
        case "crash": {
          this.audio.thud();
          this.shake = 0.6;
          const q = pos();
          this.emit(q.x, q.z, 30, 2.5);
          this.hud.popup("CHUTE !", "bad");
          break;
        }
        default:
          break;
      }
    }
  }

  private updateRaceFlow(dt: number) {
    const p = this.player;
    this.updateHint();
    if (this.phase !== "race") {
      if (this.endTimer > 0) {
        this.endTimer -= dt;
        if (this.endTimer <= 0) this.showEnd();
      }
      return;
    }
    if (p.state === "finished" || p.state === "crashed") {
      this.phase = "end";
      this.endTimer = p.state === "crashed" ? 2.0 : 1.4;
      this.hud.setHint("");
    }
  }

  private updateHint() {
    const p = this.player;
    if (p.state !== "racing" || p.airborne) {
      this.hud.setHint("");
      this.input.setHint([]);
      return;
    }
    const f = CONFIG.ui.jumpHints
      ? this.track.features.find((f) => f.kind === "jump" && f.s > p.s && f.s - p.s < Math.max(7, p.v * 1.1))
      : undefined;
    if (f) {
      const best = p.bestAction(f);
      this.hud.setHint(best === "pull" ? "▲" : best === "scrub" ? "▼" : "");
      this.input.setHint(best === "pull" ? ["up"] : best === "scrub" ? ["down"] : []);
      return;
    }
    this.hud.setHint("");
    const inBump = CONFIG.ui.pumpHints && this.track.features.some((b) => b.kind === "bump" && p.s >= b.windowStart && p.s < b.windowEnd);
    this.input.setHint(inBump && this.track.slopeAt(p.s) < -0.03 ? ["down"] : []);
  }

  private showEnd() {
    const p = this.player;
    const o = this.opponent!;
    const fmt = (t: number) => (isFinite(t) ? `${(t / CONFIG.timeScale).toFixed(2)} s` : "—");
    let title: string;
    let reason: string;
    let win = false;
    if (p.state === "crashed") {
      title = "CHUTE !";
      reason = p.crashReason + " Manche perdue.";
    } else {
      win = p.finishTime < o.finishTime;
      title = win ? "VICTOIRE !" : "DÉFAITE";
      reason = win ? `Tu bats ${this.opponentDef.name} !` : `${this.opponentDef.name} passe la ligne avant toi.`;
    }
    const oppTime = o.finished ? o.finishTime : p.state === "finished" ? Infinity : this.reference!.time;
    this.hud.showEnd({
      title,
      reason,
      times: [
        [this.character.name, p.state === "finished" ? fmt(p.finishTime) : "chute", win],
        [this.opponentDef.name, o.finished ? fmt(oppTime) : win ? "pas arrivé" : fmt(oppTime), !win && p.state === "finished"],
      ],
      tricks: p.tricksLanded.map((t) => CONFIG.trick.list[t].label),
    });
    this.hud.show("end", this.input.isTouch);
    this.endTimer = -1;
  }

  // ------------------------------------------------------------------ effets
  private emit(x: number, z: number, n: number, spread: number) {
    for (let i = 0; i < n; i++) {
      const life = 0.6 + Math.random() * 0.6;
      this.particles.push({ x, z, vx: (Math.random() - 0.5) * spread, vz: (Math.random() - 0.5) * spread, life, max: life, r: 0.25 + Math.random() * 0.35 });
    }
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
  }

  private updateParticles(dt: number) {
    for (const q of this.particles) {
      q.life -= dt;
      q.x += q.vx * dt;
      q.z += q.vz * dt;
      q.vx *= 1 - dt * 1.5;
      q.vz *= 1 - dt * 1.5;
      q.r += dt * 0.6;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    const p = this.player;
    if (this.phase === "race" && p.state === "racing" && !p.airborne && p.v > 11 && Math.random() < (p.v - 11) * 0.15) {
      const q = this.track.posAt(p.s - 0.6, this.track.laneCenter(-1) + p.u);
      this.emit(q.x, q.z, 1, 0.6);
    }
  }

  // ------------------------------------------------------------------ camera
  private updateCamera(dt: number) {
    const tr = this.track;
    const p = this.player;
    let target: { x: number; z: number; h: number; w: number };
    if (this.phase === "menu") {
      // Survol lent de la zone de depart
      const s = tr.startS + 10 + Math.sin(this.phaseT * 0.15) * 8;
      const q = tr.posAt(s, 0);
      target = { x: q.x, z: q.z, h: tr.headingAt(s), w: 34 };
    } else {
      const q = this.riderPos(p, -1);
      const lead = Math.min(5, p.v * 0.35);
      const ahead = tr.posAt(p.s + lead, tr.laneCenter(-1) * 0.5);
      // Zoom arriere avec la vitesse (sensation de vitesse) et pendant le compte a rebours
      let w = 11 + Math.max(0, p.v - CONFIG.speed.cruise) * 0.45 + (p.boostTime > 0 ? 1.2 : 0);
      if (this.phase === "countdown") w += Math.max(0, 1 - this.phaseT / (CONFIG.ui.countdownStep * 3)) * 16;
      const h = averageAngle(tr.headingAt(p.s), tr.headingAt(p.s + 8), 0.45);
      target = { x: q.x * 0.6 + ahead.x * 0.4, z: q.z * 0.6 + ahead.z * 0.4, h, w };
    }
    const k = 1 - Math.exp(-(this.phase === "menu" ? 1.5 : 7) * dt);
    this.cam.x += (target.x - this.cam.x) * k;
    this.cam.z += (target.z - this.cam.z) * k;
    this.cam.h += angleDiff(target.h, this.cam.h) * (1 - Math.exp(-3.5 * dt));
    this.cam.w += (target.w - this.cam.w) * (1 - Math.exp(-2.5 * dt));
    this.shake = Math.max(0, this.shake - dt * 1.6);
  }

  // ------------------------------------------------------------------ rendu
  private render(dt: number, excitement: number) {
    const g = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const k = W / this.cam.w;
    const ax = W / 2;
    // Rider au-dessus de la croix de direction
    const ay = H * 0.56;
    const p = this.player;
    const vib = this.shake + (this.phase === "race" && !p.airborne && p.state === "racing" ? Math.max(0, p.v - CONFIG.speed.cruise) * 0.004 : 0);
    const sx = (Math.random() - 0.5) * vib * k;
    const sy = (Math.random() - 0.5) * vib * k;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#6f9b3e";
    g.fillRect(0, 0, W, H);
    g.setTransform(k, 0, 0, k, ax + sx, ay + sy);
    g.rotate(this.cam.h);
    g.translate(-this.cam.x, -this.cam.z);

    // Rectangle monde visible
    const R = Math.hypot(W, H) / k;
    this.map.draw(g, this.cam.x - R, this.cam.z - R, this.cam.x + R, this.cam.z + R, 2);
    // Pre-chargement devant
    const ahead = this.track.posAt(Math.min(this.track.length, p.s + 40), 0);
    this.map.prefetch(ahead.x - 20, ahead.z - 20, ahead.x + 20, ahead.z + 20, 1);

    this.drawCrowd(g, excitement, R);
    // Poussiere
    for (const q of this.particles) {
      g.fillStyle = `rgba(205,180,140,${0.5 * (q.life / q.max)})`;
      g.beginPath();
      g.arc(q.x, q.z, q.r, 0, Math.PI * 2);
      g.fill();
    }
    // Riders (le plus haut dessine en dernier)
    const items: { y: number; draw: () => void }[] = [];
    const o = this.opponent;
    if (o) {
      const q = this.riderPos(o, 1);
      const hgt = Math.max(0, o.y - this.track.surfaceY(o.s, o.u));
      items.push({
        y: hgt,
        draw: () =>
          this.oppSprite.draw(g, q.x, q.z, {
            height: hgt, heading: this.track.headingAt(o.s), lean: this.leanAt(o.s, o.v),
            crouch: o.started ? 0.3 : 0.2, trick: o.trick?.id ?? null, trickT: o.trick?.t ?? 0, crashT: 0, crashSide: 1,
          }),
      });
    } else {
      const q = this.track.posAt(this.track.startS, this.track.laneCenter(1));
      items.push({ y: 0, draw: () => this.oppSprite.draw(g, q.x, q.z, { height: 0, heading: this.track.headingAt(this.track.startS), lean: 0, crouch: 0.2, trick: null, trickT: 0, crashT: 0, crashSide: 1 }) });
    }
    {
      const q = this.riderPos(p, -1);
      const hgt = Math.max(0, p.y - this.track.surfaceY(p.s, Math.max(-1.4, Math.min(1.4, p.u))));
      items.push({
        y: hgt,
        draw: () =>
          this.playerSprite.draw(g, q.x, q.z, {
            height: hgt, heading: this.track.headingAt(p.s), lean: p.airborne ? 0 : this.leanAt(p.s, p.v) + p.steerAnim * 0.3,
            crouch: p.pumpAnim, trick: p.trick?.id ?? null, trickT: p.trick?.t ?? 0,
            crashT: p.state === "crashed" ? p.crashT : 0, crashSide: p.crashSide,
          }),
      });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    this.drawOverhead(g);

    // Lignes de vitesse (ecran)
    g.setTransform(1, 0, 0, 1, 0, 0);
    const speedK = this.phase === "race" && p.state === "racing" ? Math.min(1, Math.max(0, (p.v - 10) / 5) + (p.boostTime > 0 ? 0.4 : 0)) : 0;
    if (speedK > 0.02) {
      g.strokeStyle = `rgba(255,255,255,${0.28 * speedK})`;
      g.lineCap = "round";
      for (const s of this.streaks) {
        s.y += s.v * dt * (1.2 + speedK * 2);
        if (s.y > 1.1) {
          s.y = -0.1;
          s.x = Math.random();
        }
        // Plus visibles sur les bords
        const edge = Math.abs(s.x - 0.5) * 2;
        if (edge < 0.45) continue;
        g.lineWidth = 1.5 * this.dpr;
        g.beginPath();
        g.moveTo(s.x * W, s.y * H);
        g.lineTo(s.x * W, (s.y + s.len * (0.6 + speedK)) * H);
        g.stroke();
      }
    }
  }

  private leanAt(s: number, v: number) {
    const k = this.track.curvatureAt(s);
    return Math.max(-1, Math.min(1, (v * v * k) / 9.81 / 0.7)) * -1;
  }

  private drawCrowd(g: CanvasRenderingContext2D, excitement: number, R: number) {
    const ex = Math.min(1.4, 0.15 + excitement * 0.7);
    for (const c of this.map.crowd) {
      if (Math.abs(c.x - this.cam.x) > R || Math.abs(c.z - this.cam.z) > R) continue;
      const kk = ex * c.energy;
      const jump = Math.max(0, Math.sin(this.time * 9 + c.phase)) * Math.max(0, kk - 0.4);
      const s = 1 + jump * 0.12;
      g.save();
      g.translate(c.x, c.z);
      g.rotate(-c.rot);
      // Ombre
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.beginPath();
      g.ellipse(SHADOW.x * (1.2 + jump), SHADOW.z * (1.2 + jump), 0.26, 0.2, 0, 0, Math.PI * 2);
      g.fill();
      g.scale(s, s);
      // Bras leves quand ca chauffe
      const raise = Math.min(1, Math.max(0, kk - 0.3 + Math.sin(this.time * 6 + c.phase) * 0.25));
      g.strokeStyle = c.color;
      g.lineWidth = 0.09;
      g.lineCap = "round";
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(side * 0.18, 0);
        g.lineTo(side * (0.24 + 0.12 * raise), -0.05 - 0.32 * raise);
        g.stroke();
      }
      g.fillStyle = c.color;
      g.beginPath();
      g.ellipse(0, 0, 0.22, 0.14, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = c.skin;
      g.beginPath();
      g.arc(0, -0.01, 0.1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }

  /** Elements en hauteur au-dessus des riders : arches de depart / arrivee, cables */
  private drawOverhead(g: CanvasRenderingContext2D) {
    const tr = this.track;
    for (const [s, text, checker] of [[tr.startS - 1.2, "KABARE", false], [tr.finishS, "ARRIVÉE", true]] as const) {
      const h = tr.headingAt(s);
      const half = tr.laneSpacing / 2 + tr.laneWidth / 2 + 0.6;
      const p = tr.posAt(s, 0);
      const hgt = 5.5;
      g.save();
      g.translate(p.x + SHADOW.x * hgt, p.z + SHADOW.z * hgt);
      g.rotate(-h);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fillRect(-half, -0.25, half * 2, 0.5);
      g.restore();
      g.save();
      g.translate(p.x, p.z);
      g.rotate(-h);
      g.scale(1.35, 1.35);
      g.fillStyle = checker ? "#151515" : "#C76520";
      g.fillRect(-half, -0.3, half * 2, 0.6);
      g.fillStyle = "#704916";
      g.fillRect(-half - 0.15, -0.2, 0.3, 0.4);
      g.fillRect(half - 0.15, -0.2, 0.3, 0.4);
      g.fillStyle = "#EFE6CE";
      g.font = "bold 0.42px 'Squada One', Impact, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, 0, 0.02);
      g.restore();
    }
    // Cables haute tension (et leur ombre au sol)
    const py = this.map.pylon;
    if (py) {
      const c = Math.cos(-py.rot);
      const s = Math.sin(-py.rot);
      const at = (lx: number, lz: number) => ({ x: py.x + lx * c - lz * s, z: py.z + lx * s + lz * c });
      for (const [y, w] of [[19.2, 8.7], [24.7, 6.7]]) {
        for (const lx of [-w, w]) {
          const a = at(lx, -320);
          const b = at(lx, 320);
          g.strokeStyle = "rgba(0,0,0,0.22)";
          g.lineWidth = 0.06;
          g.beginPath();
          g.moveTo(a.x + SHADOW.x * y, a.z + SHADOW.z * y);
          g.lineTo(b.x + SHADOW.x * y, b.z + SHADOW.z * y);
          g.stroke();
          g.strokeStyle = "rgba(25,25,25,0.85)";
          g.lineWidth = 0.05;
          g.beginPath();
          g.moveTo(a.x, a.z);
          g.lineTo(b.x, b.z);
          g.stroke();
        }
      }
    }
  }
}

function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function averageAngle(a: number, b: number, t: number) {
  return a + angleDiff(b, a) * t;
}

function tryFullscreen() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  if (!("ontouchstart" in window) || document.fullscreenElement) return;
  try {
    const p = el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.();
    Promise.resolve(p)
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("portrait"))
      .catch(() => {});
  } catch {
    /* iOS Safari : pas de plein ecran */
  }
}
