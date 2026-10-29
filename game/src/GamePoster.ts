// Version « Affiche » (design A) + « Duel tactique » (gameplay 2) : vue derriere le rider,
// mini-turbo a chaque figure posee avec houle du public, choix de ligne dans les virages,
// rollers a enrouler ou a sauter en double. Phases : menu -> countdown -> race -> end.

import { CONFIG } from "./config";
import type { CharacterDef, OpponentDef, TrackDef } from "./data/types";
import { GameAudio } from "./engine/Audio";
import { Bot, calibrate, type ReferenceRun } from "./engine/Bot";
import { Input } from "./engine/Input";
import { emptyIntent } from "./engine/intent";
import { OpponentRunner } from "./engine/OpponentRunner";
import { RiderSim, vInsideOf } from "./engine/RiderSim";
import { Track } from "./engine/Track";
import { PosterRenderer, type Particle2, type RiderView } from "./render/PosterRenderer";
import { Studio } from "./render/Studio";
import { CHARACTERS } from "./data/characters";
import { Hud } from "./ui/Hud";

type Phase = "menu" | "countdown" | "race" | "end";
const SIM_DT = 1 / 120;

export class GamePoster {
  private ctx: CanvasRenderingContext2D;
  private track: Track;
  private view: PosterRenderer;
  private hud = new Hud();
  private studio: Studio;
  private input: Input;
  private audio = new GameAudio();

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
  private shake = 0;
  private cheer = 0;
  private time = 0;
  private particles: Particle2[] = [];
  private cam = { s: 0, lat: 0, y: 3, h: 0, zoom: 1 };
  private oppLat = 0;
  private camBack = 1;
  private shown = false;
  private needResize = false;
  /** Qualite adaptative : definition max du canvas, temps de calcul moyen d'une image */
  private maxDpr = 2;
  private workMs = 0;
  private slowT = 0;
  /** Animation du corps : pedalier, amorti de reception (joueur et adversaire) */
  private anim = { ph: 0, ped: 0, land: 0, oPh: 0, oPed: 0, oLand: 0, oAir: false };

  constructor(
    private canvas: HTMLCanvasElement,
    trackDef: TrackDef,
    private character: CharacterDef,
    private opponentDef: OpponentDef,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.track = new Track(trackDef);
    this.view = new PosterRenderer(this.track);
    this.view.bind(this.ctx);
    document.body.classList.add("poster");

    this.input = new Input(document.getElementById("pad")!);
    document.body.classList.toggle("touch", this.input.isTouch);
    this.hud.setMenuInfo(`${trackDef.name} · ${trackDef.place}`, character.name, opponentDef.name);
    // Choix du perso : studio KABARE
    this.studio = new Studio(document.getElementById("studio") as HTMLCanvasElement, CHARACTERS, (c) => this.setCharacter(c));
    this.studio.select(character.id);
    document.getElementById("sel-prev")!.addEventListener("click", () => this.studio.step(-1));
    document.getElementById("sel-next")!.addEventListener("click", () => this.studio.step(1));
    window.addEventListener("keydown", (e) => {
      if (this.phase !== "menu") return;
      if (e.code === "ArrowLeft") this.studio.step(-1);
      if (e.code === "ArrowRight") this.studio.step(1);
    });
    document.getElementById("btn-menu")!.addEventListener("click", () => this.toMenu());
    this.setCharacter(this.studio.current);
    this.studio.start();
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
    // Redimensionner un canvas l'efface : on le fait juste avant de redessiner (sinon flash noir)
    window.addEventListener("resize", () => (this.needResize = true));
    new ResizeObserver(() => (this.needResize = true)).observe(canvas);
    this.resize();
    this.resetRiders();
    this.cam = { s: this.track.startS - 5, lat: 0, y: this.track.heightAt(this.track.startS) + 3, h: this.track.headingAt(0), zoom: 1 };
    this.hud.show("menu", this.input.isTouch);
    this.last = performance.now();
    const loop = (t: number) => {
      this.frame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private resize() {
    this.needResize = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const w = Math.round(Math.max(1, this.canvas.clientWidth) * this.dpr);
    const h = Math.round(Math.max(1, this.canvas.clientHeight) * this.dpr);
    if (w !== this.canvas.width) this.canvas.width = w;
    if (h !== this.canvas.height) this.canvas.height = h;
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
    this.studio.start();
  }

  /** Perso choisi dans le studio : nom, fiche, et memorise pour la prochaine fois */
  private setCharacter(c: CharacterDef) {
    this.character = c;
    document.getElementById("menu-player")!.textContent = c.name;
    const L = c.look;
    // Pas de stats : juste une phrase pour rire
    document.getElementById("sel-info")!.textContent = L?.tagline ?? "";
    try {
      localStorage.setItem("rlp-rider", c.id);
    } catch {
      /* stockage indisponible : pas grave */
    }
  }

  private startRace() {
    this.studio.stop();
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
    this.input.consume();
  }

  // ------------------------------------------------------------------ boucle
  private frame(now: number) {
    const work0 = performance.now();
    this.frameBody(now);
    this.adaptQuality(performance.now() - work0);
  }

  /** Telephone trop lent pour la resolution : on baisse la definition du dessin (jamais l'inverse) */
  private adaptQuality(workMs: number) {
    this.workMs += (workMs - this.workMs) * 0.05;
    this.slowT = this.workMs > 11 ? this.slowT + 1 : 0;
    if (this.slowT > 45 && this.maxDpr > 1) {
      this.maxDpr = Math.max(1, Math.min(this.maxDpr, window.devicePixelRatio || 1) - 0.35);
      this.slowT = 0;
      this.workMs = 0;
      this.needResize = true;
    }
  }

  private frameBody(now: number) {
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
    this.cheer = Math.max(0, this.cheer - dt * 0.5);
    const p = this.player;
    this.audio.update(this.phase === "race" ? p.v : 0, this.phase === "menu" ? 0.05 : Math.min(1, 0.15 + this.cheer));
    this.hud.setSpeed(this.phase === "menu" ? 0 : p.v * 3.6 * CONFIG.speed.displayScale, p.boostTime > 0);
    this.hud.setOtb(p.state === "racing" && p.leanTime > 0.4 ? CONFIG.lean.otbTime - p.leanTime : null);
    this.updateParticles(dt);
    this.updateCamera(dt);
    this.shake = Math.max(0, this.shake - dt * 1.8);

    const riders: RiderView[] = [];
    const o = this.opponent;
    const oppS = o ? o.s : this.track.startS;
    const A = this.anim;
    const pedalNow = p.state === "racing" && !p.airborne && p.v < CONFIG.speed.pedalTarget + 0.4 && this.track.slopeAt(p.s) > -0.04;
    A.ped += ((pedalNow ? 1 : 0) - A.ped) * Math.min(1, dt * 6);
    A.ph += dt * (2.5 + p.v * 0.55) * (pedalNow ? 1 : 0.2);
    A.land = Math.max(0, A.land - dt * 3.2);
    if (o) {
      const oPedal = o.started && !o.finished && !o.airborne && o.v < CONFIG.speed.pedalTarget + 0.4 && this.track.slopeAt(oppS) > -0.04;
      A.oPed += ((oPedal ? 1 : 0) - A.oPed) * Math.min(1, dt * 6);
      A.oPh += dt * (2.5 + o.v * 0.55) * (oPedal ? 1 : 0.2);
      if (A.oAir && !o.airborne) A.oLand = 1;
      A.oAir = o.airborne;
      A.oLand = Math.max(0, A.oLand - dt * 3.2);
    }
    // L'adversaire choisit aussi sa ligne dans les virages (visuel)
    const oBerm = this.track.bankAt(oppS);
    const oTarget = oBerm.outside !== 0 && o ? oBerm.outside * (o.v > 10 ? 0.8 : -0.8) : 0;
    this.oppLat += (oTarget - this.oppLat) * Math.min(1, dt * 3);
    riders.push({
      def: this.opponentDef, s: oppS, lat: this.track.laneCenter(1) + this.oppLat + (o?.u ?? 0) * 0.4,
      y: o ? o.y : this.track.surfaceY(oppS, 0), airborne: o?.airborne ?? false,
      trick: o?.trick?.id ?? null, trickT: o?.trick?.t ?? 0, crashT: 0, crashSide: 1,
      crouch: o && !o.airborne && this.track.slopeAt(oppS) < -0.04 ? 0.7 : 0.25, lean: o ? this.leanAt(oppS, o.v) : 0,
      pedal: A.oPh, pedaling: A.oPed, land: A.oLand,
    });
    riders.push({
      def: this.character, s: p.s, lat: this.track.laneCenter(-1) + p.u, y: p.y, airborne: p.airborne,
      trick: p.trick?.id ?? null, trickT: p.trick?.t ?? 0, crashT: p.state === "crashed" ? p.crashT : 0,
      crashSide: p.crashSide, crouch: p.pumpAnim, lean: p.airborne ? 0 : this.leanAt(p.s, p.v) + p.steerAnim * 0.4,
      extend: p.pullAnim, leanFwd: Math.min(1, p.leanTime * 3), pedal: A.ph, pedaling: A.ped, land: A.land, steer: p.steerAnim,
    });
    const v = this.view;
    const camPos = this.track.posAt(this.cam.s, this.cam.lat);
    v.cam.x = camPos.x;
    v.cam.z = camPos.z;
    v.cam.y = this.cam.y;
    v.cam.h = this.cam.h;
    v.cam.s = this.cam.s;
    v.cam.pitch = 0.2;
    if (this.needResize) this.resize();
    const speedK = this.phase === "race" && p.state === "racing" ? Math.min(1, Math.max(0, (p.v - 10.5) / 4.5) + (p.boostTime > 0 ? 0.5 : 0)) : 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    v.render(this.ctx, this.canvas.width, this.canvas.height, {
      riders, time: this.time, excitement: Math.min(1.4, this.cheer), speedK, zoom: this.cam.zoom, particles: this.particles, shake: this.shake,
    });
    // Premiere image dessinee : on affiche le jeu (evite tout flash pendant le chargement)
    if (!this.shown && this.canvas.width > 1) {
      this.shown = true;
      requestAnimationFrame(() => document.body.classList.remove("boot"));
    }
  }

  private updateCamera(dt: number) {
    const tr = this.track;
    const p = this.player;
    let target: { s: number; lat: number; y: number; h: number; zoom: number };
    if (this.phase === "menu") {
      const s = tr.startS - 6 + Math.sin(this.phaseT * 0.2) * 2;
      target = { s, lat: Math.sin(this.phaseT * 0.15) * 3, y: tr.heightAt(tr.startS) + 3.4, h: tr.headingAt(tr.startS + 6), zoom: 1 };
    } else {
      // Derriere le rider, un peu au-dessus ; la camera recule et s'ouvre avec la vitesse
      const fast = Math.max(0, p.v - CONFIG.speed.cruise);
      // Dans les virages serres, la camera se rapproche : moins de decalage entre la vue et le velo
      const turning = tr.bankAt(p.s).outside !== 0 || tr.bankAt(p.s + 4).outside !== 0;
      this.camBack += ((turning ? 0.72 : 1) - this.camBack) * (1 - Math.exp(-3 * dt));
      const back = (5.5 + fast * 0.18) * this.camBack + (this.phase === "countdown" ? Math.max(0, 1 - this.phaseT / 2.4) * 6 : 0);
      const s = p.s - back;
      // Sur la ligne du rider, juste derriere lui (sur la piste : jamais dans le mur d'un virage)
      const lat = tr.laneCenter(-1) * 0.85 + p.u * 0.9;
      const ground = Math.max(tr.heightAt(p.s), tr.surfaceY(Math.max(0, s), lat - tr.laneCenter(-1)));
      const ry = p.airborne ? p.y * 0.8 + ground * 0.2 : Math.max(p.y, ground);
      // Vise un point juste devant le rider : la camera tourne avec le velo, sans retard
      const from = tr.posAt(Math.max(0, s), this.cam.lat);
      const look = tr.posAt(p.s + 2.5, tr.laneCenter(-1) + p.u * 0.8);
      target = {
        s,
        lat,
        y: ry + 2.7,
        // Entre "viser le rider" et "dans l'axe du velo" : la vue suit le virage sans retard
        h: blendAngle(Math.atan2(-(look.x - from.x), -(look.z - from.z)), tr.headingAt(p.s + 1.5), 0.55),
        zoom: 1 - Math.min(0.18, fast * 0.035) - (p.boostTime > 0 ? 0.06 : 0),
      };
    }
    const k = 1 - Math.exp(-8 * dt);
    this.cam.s += (target.s - this.cam.s) * (this.phase === "menu" ? k * 0.3 : 1);
    this.cam.lat += (target.lat - this.cam.lat) * (this.phase === "menu" ? k : 1 - Math.exp(-14 * dt));
    this.cam.y += (target.y - this.cam.y) * (1 - Math.exp(-8 * dt));
    this.cam.h += angleDiff(target.h, this.cam.h) * (1 - Math.exp(-(this.phase === "menu" ? 4 : 18) * dt));
    this.cam.zoom += (target.zoom - this.cam.zoom) * (1 - Math.exp(-3 * dt));
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

  private riderWorld() {
    const p = this.player;
    const q = this.track.posAt(p.s, this.track.laneCenter(-1) + p.u);
    return { x: q.x, y: this.track.surfaceY(p.s, Math.max(-1.4, Math.min(1.4, p.u))), z: q.z };
  }

  private handleEvents() {
    const p = this.player;
    for (const e of p.events) {
      switch (e.type) {
        case "perfect":
          if (e.kind !== "berm") this.hud.popup(e.streak > 2 ? `PERFECT x${e.streak}` : "PERFECT", "perfect");
          break;
        case "goodLine":
          this.hud.popup(e.outside ? "LIGNE HAUTE !" : "CORDE !", "schralp");
          break;
        case "skid": {
          this.hud.popup("DÉRAPAGE…", "bad");
          this.audio.skid();
          const q = this.riderWorld();
          this.emit(q.x, q.y, q.z, 14, 2);
          break;
        }
        case "flipReady":
          this.hud.popup(`${CONFIG.trick.list[e.id].label} ${e.id === "threesixtyL" ? "◀" : e.id === "threesixty" ? "▶" : ""} PRÊT`, "trick");
          break;
        case "flipRefused":
          this.hud.popup(e.reason, "bad");
          break;
        case "double":
          this.hud.popup("DOUBLÉ !", "trick");
          this.audio.cheer(0.6);
          this.cheer += 0.4;
          break;
        case "schralp": {
          this.hud.popup("SCHRALP !", "schralp");
          this.audio.skid();
          this.cheer += 0.5;
          const q = this.riderWorld();
          this.emit(q.x, q.y, q.z, 24, 2.6);
          break;
        }
        case "trick": {
          // Mini-turbo + houle du public
          const big = e.hype >= 30;
          this.hud.popup(`${CONFIG.trick.list[e.id].label}  +BOOST`, "trick");
          this.audio.roar(big ? 1.3 : 0.85);
          this.cheer += big ? 1.3 : 0.8;
          break;
        }
        case "land": {
          this.audio.thud();
          this.anim.land = e.quality === "perfect" ? 0.6 : 1;
          this.shake = Math.max(this.shake, e.quality === "perfect" ? 0.15 : e.quality === "ok" ? 0.25 : 0.45);
          const q = this.riderWorld();
          this.emit(q.x, q.y, q.z, e.quality === "perfect" ? 10 : 18, 1.8);
          if (e.quality === "bad") this.hud.popup(e.ratio < 0 ? "Casé…" : e.ratio > 0 ? "Trop long…" : "Aïe…", "bad");
          break;
        }
        case "crash": {
          this.audio.thud();
          this.shake = 0.8;
          const q = this.riderWorld();
          this.emit(q.x, q.y, q.z, 30, 2.5);
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

  /** Aides : bouton a utiliser avant un saut, cote de la bonne ligne avant un virage, pompage */
  private updateHint() {
    const p = this.player;
    const tr = this.track;
    if (p.state !== "racing" || p.airborne) {
      this.hud.setHint("");
      this.input.setHint([]);
      return;
    }
    const jump = CONFIG.ui.jumpHints ? tr.features.find((f) => f.kind === "jump" && f.s > p.s && f.s - p.s < Math.max(7, p.v * 1.1)) : undefined;
    if (jump) {
      const best = p.bestAction(jump);
      this.hud.setHint(best === "pull" ? "▲" : best === "scrub" ? "▼" : "");
      this.input.setHint(best === "pull" ? ["up"] : best === "scrub" ? ["down"] : []);
      return;
    }
    const berm = tr.features.find((f) => f.kind === "berm" && p.s > f.windowStart - 10 && p.s < f.windowEnd);
    if (berm) {
      const vIn = vInsideOf(tr, berm);
      const outside = p.v > vIn;
      // Exterieur = cote "outside" du virage ; +1 = droite
      const side = (berm.outside ?? 1) * (outside ? 1 : -1);
      this.hud.setHint(outside ? "LIGNE HAUTE" : "À LA CORDE");
      this.input.setHint(side > 0 ? ["right"] : ["left"]);
      return;
    }
    this.hud.setHint("");
    const inBump = CONFIG.ui.pumpHints && tr.features.some((b) => b.kind === "bump" && p.s >= b.windowStart && p.s < b.windowEnd);
    this.input.setHint(inBump && tr.slopeAt(p.s) < -0.03 ? ["down"] : []);
  }

  private showEnd() {
    const p = this.player;
    const o = this.opponent!;
    const fmt = (t: number) => (isFinite(t) ? `${(t / CONFIG.timeScale).toFixed(2)} s` : "—");
    // L'adversaire va toujours au bout : s'il roule encore, on termine son run (temps constant)
    for (let i = 0; i < 60 * 120 && !o.finished; i++) o.step(1 / 60);
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
    this.hud.showEnd({
      title,
      reason,
      times: [
        [this.character.name, p.state === "finished" ? fmt(p.finishTime) : "chute", win],
        [this.opponentDef.name, fmt(o.finishTime), !win],
      ],
      tricks: p.tricksLanded.map((t) => CONFIG.trick.list[t].label),
    });
    this.hud.show("end", this.input.isTouch);
    this.endTimer = -1;
  }

  // ------------------------------------------------------------------ effets
  private emit(x: number, y: number, z: number, n: number, spread: number) {
    for (let i = 0; i < n; i++) {
      const life = 0.6 + Math.random() * 0.6;
      this.particles.push({ x: x + (Math.random() - 0.5) * spread, y: y + Math.random() * 0.5, z: z + (Math.random() - 0.5) * spread, life, max: life, r: 0.2 + Math.random() * 0.3 });
    }
    if (this.particles.length > 200) this.particles.splice(0, this.particles.length - 200);
  }

  private updateParticles(dt: number) {
    for (const q of this.particles) {
      q.life -= dt;
      q.y += dt * 0.6;
      q.r += dt * 0.5;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    const p = this.player;
    if (this.phase === "race" && p.state === "racing" && !p.airborne && (p.v > 11.5 || p.boostTime > 0) && Math.random() < 0.5) {
      const q = this.track.posAt(p.s - 0.7, this.track.laneCenter(-1) + p.u);
      this.emit(q.x, this.track.surfaceY(p.s, 0), q.z, 1, 0.4);
    }
  }

  private leanAt(s: number, v: number) {
    const k = this.track.curvatureAt(s);
    return Math.max(-1, Math.min(1, (v * v * k) / 9.81 / 0.7)) * -1;
  }
}

function blendAngle(a: number, b: number, t: number) {
  return a + angleDiff(b, a) * t;
}

function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
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
