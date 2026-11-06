// Sons synthetises (WebAudio), aucun fichier a charger : foule, vent, bips, poussiere.

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private crowdGain!: GainNode;
  private windGain!: GainNode;
  private noise!: AudioBuffer;
  muted = false;

  /** A appeler sur un geste utilisateur (contrainte navigateurs mobiles) */
  unlock() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Foule : bruit filtre module
    const crowd = ctx.createBufferSource();
    crowd.buffer = this.noise;
    crowd.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    this.crowdGain = ctx.createGain();
    this.crowdGain.gain.value = 0;
    crowd.connect(bp).connect(this.crowdGain).connect(this.master);
    crowd.start();

    // Vent : bruit grave proportionnel a la vitesse
    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    wind.playbackRate.value = 0.7;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    wind.connect(lp).connect(this.windGain).connect(this.master);
    wind.start();
  }

  // Musique de fond des menus (carte, choix du perso, tableau) : public/audio/menu.mp3
  // Lue en Web Audio (boucle sans trou), demarree au premier geste du joueur.
  private musicUrl = "";
  private musicLoopEnd = 0;
  private musicGain: GainNode | null = null;
  private musicStarted = false;

  /** Prepare la musique ; loopEnd = fin exacte de la boucle en secondes (0 = tout le fichier) */
  initMusic(src: string, loopEnd = 0) {
    this.musicUrl = src;
    this.musicLoopEnd = loopEnd;
    const go = () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
      this.unlock();
      void this.startMusic();
    };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
  }

  private async startMusic() {
    const ctx = this.ctx;
    if (!ctx || this.musicStarted || !this.musicUrl) return;
    this.musicStarted = true;
    try {
      const res = await fetch(this.musicUrl);
      if (!res.ok) return;
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = this.musicLoopEnd > 0 ? Math.min(this.musicLoopEnd, buf.duration) : buf.duration;
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0;
      src.connect(this.musicGain).connect(this.master);
      src.start();
    } catch {
      /* pas de musique : le jeu continue sans */
    }
  }

  /** Fondu de la musique selon l'ecran : a appeler chaque frame */
  tickMusic(wanted: boolean, _dt: number) {
    if (!this.ctx || !this.musicGain) return;
    const target = wanted ? 0.5 : 0;
    // montee douce (~1,5 s), coupure plus rapide (~0,4 s) au depart de la course
    this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, target > 0 ? 0.5 : 0.12);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.value = m ? 0 : 0.8;
  }

  update(speed: number, excitement: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.crowdGain.gain.setTargetAtTime(0.04 + excitement * 0.16, t, 0.3);
    this.windGain.gain.setTargetAtTime(Math.min(0.35, speed * 0.025), t, 0.2);
  }

  private burst(dur: number, freq: number, type: BiquadFilterType, gain: number, q = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.15, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  cheer(strength = 1) {
    this.burst(1.6, 1100, "bandpass", 0.35 * strength, 0.5);
    this.burst(1.2, 2400, "bandpass", 0.12 * strength, 1);
  }

  /** Houle du public : montee lente, longue retombee (figures) */
  roar(strength = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (const [freq, q, gain, dur] of [[520, 0.7, 0.45, 2.8], [1100, 0.9, 0.22, 2.4], [2300, 1.2, 0.08, 1.8]]) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * strength, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(this.master);
      src.start(t, Math.random());
      src.stop(t + dur + 0.1);
    }
  }

  skid() {
    this.burst(0.5, 3000, "highpass", 0.25);
  }

  thud() {
    this.burst(0.18, 160, "lowpass", 0.5);
  }

  beep(high = false) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = high ? 880 : 440;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (high ? 0.5 : 0.22));
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.6);
  }
}
