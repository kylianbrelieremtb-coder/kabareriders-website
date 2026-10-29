// Orchestration d'une course : scene, joueur, adversaire, camera, HUD, sons.
// Phases : menu -> countdown -> race -> end.

import * as THREE from "three";
import { CONFIG } from "./config";
import type { CharacterDef, OpponentDef, TrackDef } from "./data/types";
import { GameAudio } from "./engine/Audio";
import { Bot, calibrate, type ReferenceRun } from "./engine/Bot";
import { Dust } from "./engine/Effects";
import { Input } from "./engine/Input";
import { emptyIntent } from "./engine/intent";
import { OpponentRunner } from "./engine/OpponentRunner";
import { RiderModel } from "./engine/RiderModel";
import { RiderSim } from "./engine/RiderSim";
import { Track } from "./engine/Track";
import { buildWorld, type WorldBuild } from "./engine/World";
import { Hud } from "./ui/Hud";

type Phase = "menu" | "countdown" | "race" | "end";

const SIM_DT = 1 / 120;

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private track: Track;
  private world: WorldBuild;
  private hud = new Hud();
  private input: Input;
  private audio = new GameAudio();
  private dust = new Dust();

  private player!: RiderSim;
  private playerModel: RiderModel;
  private opponent!: OpponentRunner;
  private oppModel: RiderModel;
  private shadows: THREE.Mesh[] = [];
  private reference: { run: ReferenceRun; time: number } | null = null;

  private phase: Phase = "menu";
  private phaseT = 0;
  private acc = 0;
  private last = 0;
  private endTimer = -1;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private playerPitch = 0;
  private oppPitch = 0;
  private cdLabel = "";
  private autopilot: Bot | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    trackDef: TrackDef,
    private character: CharacterDef,
    private opponentDef: OpponentDef,
  ) {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch || devicePixelRatio < 2, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fovBase, 1, 0.3, 4000);

    this.track = new Track(trackDef);
    this.world = buildWorld(this.scene, this.track);
    this.scene.add(this.dust.points);

    this.playerModel = new RiderModel(character);
    this.oppModel = new RiderModel(opponentDef);
    this.scene.add(this.playerModel.root, this.oppModel.root);
    const shadowTex = makeShadowTexture();
    for (let i = 0; i < 2; i++) {
      const sh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 1.8),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
      );
      sh.rotation.order = "YXZ";
      this.shadows.push(sh);
      this.scene.add(sh);
    }

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
      if ((e.code === "Enter" || e.code === "Space") && (this.phase === "menu" || (this.phase === "end" && this.endTimer < 0))) {
        if (e.code === "Enter" || this.phase === "end") this.startRace();
      }
    });

    window.addEventListener("resize", () => this.resize());
    // La zone 3D change de taille quand les boutons apparaissent
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    this.resetRiders();
    this.placeMenuCamera(0);
    this.hud.show("menu", this.input.isTouch);
    this.last = performance.now();
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  private resize() {
    const c = this.renderer.domElement;
    const w = Math.max(1, c.clientWidth);
    const h = Math.max(1, c.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = this.verticalFov(CONFIG.camera.fovBase);
    this.camera.updateProjectionMatrix();
  }

  private resetRiders() {
    this.player = new RiderSim(this.track, -1);
    if (this.reference) {
      this.opponent = new OpponentRunner(this.track, this.opponentDef, this.reference.run, this.reference.time);
    }
  }

  private toMenu() {
    this.phase = "menu";
    this.phaseT = 0;
    this.resetRiders();
    this.hud.show("menu", this.input.isTouch);
  }

  private startRace() {
    this.audio.unlock();
    tryFullscreenLandscape();
    if (!this.reference) {
      this.hud.show("loading", this.input.isTouch);
      // Laisse le temps d'afficher l'ecran de chargement
      setTimeout(() => {
        const c = calibrate(this.track, this.opponentDef.successRate);
        this.reference = { run: c.median, time: c.meanTime };
        this.startRace();
      }, 30);
      return;
    }
    this.resetRiders();
    // ?debug=bot : pilote automatique (verification visuelle)
    this.autopilot = location.search.includes("debug=bot") ? new Bot(this.player, 0.6, Math.random) : null;
    this.phase = "countdown";
    this.phaseT = 0;
    this.endTimer = -1;
    this.cdLabel = "";
    this.hud.show("race", this.input.isTouch);
    this.hud.setCountdown("");
    this.hud.setHype(0, false);
    this.input.consume();
  }

  // ------------------------------------------------------------------ boucle
  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.phaseT += dt;

    if (this.phase === "countdown") this.updateCountdown();
    if (this.phase === "race" || this.phase === "end") {
      this.acc += dt;
      let intent = this.phase === "race" && this.player.state === "racing" ? this.input.consume() : (this.input.consume(), emptyIntent());
      if (this.autopilot && this.player.state === "racing") intent = this.autopilotIntent();
      let first = true;
      while (this.acc >= SIM_DT) {
        this.acc -= SIM_DT;
        // Les appuis (fronts) ne comptent qu'une fois
        const it = first ? intent : { ...intent, upPressed: false, downPressed: false, trickPressed: false, trickDirPressed: null };
        first = false;
        this.player.step(SIM_DT, it);
        this.handleEvents();
        this.opponent.step(SIM_DT);
      }
      this.updateRaceFlow(dt);
    }

    this.updateModels(dt);
    if (this.phase === "menu") this.placeMenuCamera(dt);
    else this.updateCamera(dt);

    const excitement = this.player.hypeRatio + (this.player.boostTime > 0 ? 0.5 : 0);
    this.world.update(dt, this.phase === "menu" ? 0.2 : excitement);
    this.dust.update(dt);
    this.audio.update(this.phase === "race" ? this.player.v : 0, this.phase === "menu" ? 0 : Math.min(1, excitement));
    this.hud.setHype(this.player.hypeRatio, this.player.boostTime > 0);
    this.renderer.render(this.scene, this.camera);
  }

  private updateCountdown() {
    const step = CONFIG.ui.countdownStep;
    const n = 3 - Math.floor(this.phaseT / step);
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
      this.opponent.go();
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

  private handleEvents() {
    const p = this.player;
    for (const e of p.events) {
      switch (e.type) {
        case "perfect":
          this.hud.popup(e.streak > 2 ? `PERFECT x${e.streak}` : "PERFECT", "perfect");
          break;
        case "schralp":
          this.hud.popup("SCHRALP !", "schralp");
          this.audio.skid();
          this.world.crowd.burst(0.6);
          this.dust.emit(this.riderWorldPos(), 26, 3, 2.2, this.lateralDir(-(this.track.bankAt(p.s).outside || 1) * 2));
          break;
        case "trick":
          this.hud.popup(CONFIG.trick.list[e.id].label, "trick");
          this.world.crowd.burst(e.hype >= 30 ? 1.2 : 0.7);
          this.audio.cheer(e.hype >= 30 ? 1.2 : 0.7);
          break;
        case "hypeFull":
          this.hud.popup("BOOST !", "boost");
          this.audio.cheer(1.4);
          break;
        case "land":
          this.audio.thud();
          this.dust.emit(this.riderWorldPos(), e.quality === "perfect" ? 8 : 16, 1.6, 1.2);
          if (e.quality === "bad") this.hud.popup(e.ratio < 0 ? "Casé…" : "Trop long…", "bad");
          break;
        case "crash":
          this.audio.thud();
          this.dust.emit(this.riderWorldPos(), 30, 2.5, 1.8);
          this.hud.popup("CHUTE !", "bad");
          break;
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
    if (this.player.state !== "racing" || p.airborne) {
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
    // Aide au pompage : bas allume dans les descentes des bosses
    const inBump = CONFIG.ui.pumpHints && this.track.features.some((b) => b.kind === "bump" && p.s >= b.windowStart && p.s < b.windowEnd);
    this.input.setHint(inBump && this.track.slopeAt(p.s) < -0.03 ? ["down"] : []);
  }

  private showEnd() {
    const p = this.player;
    const o = this.opponent;
    const fmt = (t: number) => (isFinite(t) ? `${t.toFixed(2)} s` : "—");
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

  // ------------------------------------------------------------------ rendu
  private tmp = { x: 0, z: 0 };

  private riderWorldPos(): THREE.Vector3 {
    const p = this.player;
    const P = this.track.posAt(p.s, this.track.laneCenter(-1) + p.u, this.tmp);
    return new THREE.Vector3(P.x, p.y, P.z);
  }

  private lateralDir(scale: number): THREE.Vector3 {
    const h = this.track.headingAt(this.player.s);
    return new THREE.Vector3(Math.cos(h) * scale, 0, -Math.sin(h) * scale);
  }

  private updateModels(dt: number) {
    const tr = this.track;
    const p = this.player;
    // Joueur
    {
      const lat = tr.laneCenter(-1) + p.u;
      const P = tr.posAt(p.s, lat, this.tmp);
      const root = this.playerModel.root;
      root.position.set(P.x, p.y, P.z);
      const target = p.airborne
        ? Math.atan2(p.vy, p.vx) * 0.55
        : Math.atan((tr.heightAt(p.s + 0.6) - tr.heightAt(p.s - 0.6)) / 1.2);
      this.playerPitch += (target - this.playerPitch) * Math.min(1, dt * (p.airborne ? 4 : 14));
      const k = tr.curvatureAt(p.s);
      const roll = p.airborne ? 0 : Math.max(-0.7, Math.min(0.7, Math.atan((p.v * p.v * k) / 9.81)));
      root.rotation.set(this.playerPitch, tr.headingAt(p.s), roll + (p.schralpTime > 0 ? Math.sign(k) * 0.25 : 0), "YXZ");
      this.playerModel.update(dt, {
        crouch: Math.max(p.pumpAnim, p.state === "ready" ? 0.2 : 0),
        extend: p.pullAnim,
        steer: p.steerAnim,
        trick: p.trick?.id ?? null,
        trickT: p.trick?.t ?? 0,
        crashT: p.state === "crashed" ? p.crashT : 0,
        crashSide: p.crashSide,
        speed: p.airborne ? p.vx : p.v,
        airborne: p.airborne,
      });
      this.placeShadow(0, p.s, lat, p.u, p.y);
      if (p.schralpTime > 0.6 && Math.random() < 0.5) this.dust.emit(root.position, 2, 1.5, 1);
    }
    // Adversaire
    const o = this.opponent;
    if (o) {
      const lat = tr.laneCenter(1) + o.u;
      const P = tr.posAt(o.s, lat, this.tmp);
      const root = this.oppModel.root;
      root.position.set(P.x, o.y, P.z);
      this.oppPitch += (o.pitch() - this.oppPitch) * Math.min(1, dt * 10);
      const k = tr.curvatureAt(o.s);
      const roll = o.airborne ? 0 : Math.max(-0.7, Math.min(0.7, Math.atan((o.v * o.v * k) / 9.81)));
      root.rotation.set(this.oppPitch, tr.headingAt(o.s), roll, "YXZ");
      this.oppModel.update(dt, {
        crouch: o.started ? 0.15 + 0.15 * Math.max(0, Math.sin(o.s * 1.4)) : 0.2,
        extend: 0,
        steer: 0,
        trick: o.trick?.id ?? null,
        trickT: o.trick?.t ?? 0,
        crashT: 0,
        crashSide: 1,
        speed: o.v,
        airborne: o.airborne,
      });
      this.placeShadow(1, o.s, lat, o.u, o.y);
    } else {
      const P = tr.posAt(tr.startS, tr.laneCenter(1), this.tmp);
      this.oppModel.root.position.set(P.x, tr.surfaceY(tr.startS, 0), P.z);
      this.oppModel.root.rotation.set(0, tr.headingAt(tr.startS), 0, "YXZ");
      this.placeShadow(1, tr.startS, tr.laneCenter(1), 0, tr.surfaceY(tr.startS, 0));
    }
  }

  private placeShadow(i: number, s: number, lat: number, u: number, y: number) {
    const sh = this.shadows[i];
    const P = this.track.posAt(s, lat, this.tmp);
    const gy = this.track.surfaceY(s, Math.max(-1.2, Math.min(1.2, u)));
    const hgt = Math.max(0, y - gy);
    sh.position.set(P.x, gy + 0.06, P.z);
    sh.rotation.set(-Math.PI / 2, this.track.headingAt(s), 0, "YXZ");
    const sc = 1 / (1 + hgt * 0.35);
    sh.scale.set(sc, sc, 1);
    (sh.material as THREE.MeshBasicMaterial).opacity = 0.55 * sc;
  }

  private updateCamera(dt: number) {
    const C = CONFIG.camera;
    const p = this.player;
    const tr = this.track;
    const h = tr.headingAt(p.s);
    const fx = -Math.sin(h);
    const fz = -Math.cos(h);
    const root = this.playerModel.root.position;
    let dist = C.distance;
    let height = C.height;
    if (this.phase === "countdown") {
      // Descente de camera pendant le compte a rebours
      const k = Math.max(0, 1 - this.phaseT / (CONFIG.ui.countdownStep * 3));
      dist += k * 7;
      height += k * 5;
    }
    const gy = tr.heightAt(p.s);
    const camY = Math.max(gy, p.airborne ? p.y * 0.6 + gy * 0.4 : p.y) + height;
    const want = new THREE.Vector3(root.x - fx * dist, camY, root.z - fz * dist);
    const look = new THREE.Vector3(root.x + fx * C.lookAhead, (p.airborne ? p.y * 0.5 + gy * 0.5 : p.y) + 0.9, root.z + fz * C.lookAhead);
    if (p.state === "crashed") look.set(root.x, p.y + 0.4, root.z);
    const k = this.phase === "countdown" && this.phaseT < 0.05 ? 1 : 1 - Math.exp(-C.smoothing * dt);
    this.camPos.lerp(want, k);
    this.camLook.lerp(look, Math.min(1, k * 1.6));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    const fov = this.verticalFov(C.fovBase + Math.max(0, p.v - CONFIG.speed.cruise) * C.fovSpeedGain + (p.boostTime > 0 ? 6 : 0));
    this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 3);
    this.camera.updateProjectionMatrix();
  }

  /** Champ de vision vertical pour garder un champ horizontal donne (ecran vertical) */
  private verticalFov(horizontalDeg: number): number {
    const h = (horizontalDeg * Math.PI) / 180;
    const v = 2 * Math.atan(Math.tan(h / 2) / this.camera.aspect);
    return Math.min(CONFIG.camera.maxVerticalFov, Math.max(CONFIG.camera.minVerticalFov, (v * 180) / Math.PI));
  }

  private menuT = 0;
  private placeMenuCamera(dt: number) {
    if (location.search.includes("debug=top")) {
      // Vue de dessus de toute la piste (reglage du trace)
      const tr = this.track;
      const m = tr.posAt(tr.length / 2, 0, this.tmp);
      this.camera.position.set(m.x, 160, m.z + 0.01);
      this.camera.lookAt(m.x, 0, m.z);
      return;
    }
    if (location.search.includes("debug=side")) {
      // Gros plan de profil sur les riders (verification des modeles)
      const r = this.playerModel.root.position;
      this.camera.position.set(r.x - 4.2, r.y + 1.3, r.z - 1.2);
      this.camera.lookAt(r.x + 1.5, r.y + 0.9, r.z - 0.3);
      return;
    }
    // Plan large qui tourne lentement au-dessus du depart
    this.menuT += dt;
    const tr = this.track;
    const s = tr.startS + 4;
    const P = tr.posAt(s, 0, this.tmp);
    const a = this.menuT * 0.12 + 0.6;
    const r = 13;
    this.camera.position.set(P.x + Math.sin(a) * r, tr.heightAt(s) + 6.5, P.z + Math.cos(a) * r);
    this.camera.lookAt(P.x, tr.heightAt(s) + 0.5, P.z - 2);
    this.camPos.copy(this.camera.position);
    this.camLook.set(P.x, tr.heightAt(s) + 1, P.z);
  }
}

function makeShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, "rgba(0,0,0,0.75)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function tryFullscreenLandscape() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  const touch = "ontouchstart" in window;
  if (!touch || document.fullscreenElement) return;
  try {
    const p = el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.();
    Promise.resolve(p)
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("portrait"))
      .catch(() => {});
  } catch {
    /* iOS Safari : pas de plein ecran, ce n'est pas bloquant */
  }
}
