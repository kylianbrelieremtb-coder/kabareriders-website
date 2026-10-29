// Interface DOM : barre de hype, compte a rebours, popups, ecrans menu / fin.

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class Hud {
  readonly hud = $("hud");
  readonly pad = $("pad");
  private hype = $("hype");
  private fill = this.hype.querySelector(".fill") as HTMLElement;
  private countdown = $("countdown");
  private popups = $("popups");
  private hint = $("hint");
  private speed = $("speed");
  private otb = $("otb");
  private lastOtb = "";
  private speedVal = this.speed.querySelector("b") as HTMLElement;
  private lastSpeed = -1;
  readonly menu = $("screen-menu");
  readonly loading = $("screen-loading");
  readonly end = $("screen-end");
  readonly bracket = $("screen-bracket");
  private lastHype = -1;

  setMenuInfo(track: string, player: string, opponent: string) {
    $("menu-track").textContent = track;
    $("menu-player").textContent = player;
    const opp = document.getElementById("menu-opponent");
    if (opp) opp.textContent = opponent;
  }

  show(screen: "menu" | "loading" | "race" | "end" | "bracket", touch: boolean) {
    this.menu.classList.toggle("hidden", screen !== "menu");
    this.bracket.classList.toggle("hidden", screen !== "bracket");
    this.loading.classList.toggle("hidden", screen !== "loading");
    this.end.classList.toggle("hidden", screen !== "end");
    this.hud.classList.toggle("hidden", screen !== "race");
    this.pad.classList.toggle("hidden", screen !== "race");
    void touch;
  }

  setHype(ratio: number, boosting: boolean) {
    const pct = Math.round(ratio * 100);
    if (pct !== this.lastHype) {
      this.fill.style.width = `${pct}%`;
      this.lastHype = pct;
    }
    this.hype.classList.toggle("boost", boosting);
  }

  /** Compteur de vitesse (version Affiche) */
  setSpeed(kmh: number, boosting: boolean) {
    const v = Math.round(kmh);
    if (v !== this.lastSpeed) {
      this.speedVal.textContent = String(v);
      this.lastSpeed = v;
    }
    this.speed.classList.toggle("boost", boosting);
  }

  /** Compte a rebours avant l'OTB (poids sur l'avant trop longtemps) */
  setOtb(secondsLeft: number | null) {
    const txt = secondsLeft === null ? "" : `SOLEIL DANS ${Math.ceil(secondsLeft)}…`;
    if (txt === this.lastOtb) return;
    this.lastOtb = txt;
    this.otb.textContent = txt;
    this.otb.classList.toggle("show", !!txt);
  }

  setCountdown(text: string) {
    if (this.countdown.textContent === text) return;
    this.countdown.textContent = text;
    this.countdown.classList.remove("pop");
    void this.countdown.offsetWidth;
    if (text) this.countdown.classList.add("pop");
  }

  popup(text: string, kind: "perfect" | "schralp" | "trick" | "boost" | "bad") {
    const el = document.createElement("div");
    el.className = `popup ${kind}`;
    el.textContent = text;
    this.popups.appendChild(el);
    while (this.popups.children.length > 3) this.popups.firstChild?.remove();
    setTimeout(() => el.remove(), 1150);
  }

  setHint(text: string) {
    if (text) this.hint.textContent = text;
    this.hint.classList.toggle("show", !!text);
  }

  /** Tableau du tournoi : tour en cours, adversaire tire au sort, parcours des tours */
  showBracket(o: { round: string; me: string; opp: string; bike: string; rows: { round: string; who: string; state: "done" | "current" | "todo" }[] }) {
    $("br-round").textContent = o.round;
    $("br-me").textContent = o.me;
    $("br-opp").textContent = o.opp;
    $("br-bike").textContent = o.bike;
    $("br-list").innerHTML = o.rows.map((r) => `<li class="${r.state}"><span>${r.round}</span><b>${r.who}</b></li>`).join("");
  }

  showEnd(o: { title: string; reason: string; times: [string, string, boolean][]; tricks: string[]; next?: string }) {
    if (o.next) $("btn-replay").textContent = o.next;
    $("end-title").textContent = o.title;
    $("end-reason").textContent = o.reason;
    $("end-times").innerHTML = o.times
      .map(([who, t, win]) => `<span class="${win ? "win" : ""}">${who}</span><span class="${win ? "win" : ""}">${t}</span>`)
      .join("");
    $("end-tricks").textContent = o.tricks.length ? o.tricks.join(" · ") : "Aucun… la prochaine fois !";
  }
}
