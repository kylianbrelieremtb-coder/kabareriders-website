// Interface DOM : barre de hype, compte a rebours, popups, ecrans menu / fin.

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export class Hud {
  readonly hud = $("hud");
  readonly touch = $("touch");
  private hype = $("hype");
  private fill = this.hype.querySelector(".fill") as HTMLElement;
  private countdown = $("countdown");
  private popups = $("popups");
  private hint = $("hint");
  readonly menu = $("screen-menu");
  readonly loading = $("screen-loading");
  readonly end = $("screen-end");
  private lastHype = -1;

  setMenuInfo(track: string, player: string, opponent: string) {
    $("menu-track").textContent = track;
    $("menu-player").textContent = player;
    $("menu-opponent").textContent = opponent;
  }

  show(screen: "menu" | "loading" | "race" | "end", touch: boolean) {
    this.menu.classList.toggle("hidden", screen !== "menu");
    this.loading.classList.toggle("hidden", screen !== "loading");
    this.end.classList.toggle("hidden", screen !== "end");
    this.hud.classList.toggle("hidden", screen !== "race");
    this.touch.classList.toggle("hidden", !(screen === "race" && touch));
  }

  setHype(ratio: number, boosting: boolean) {
    const pct = Math.round(ratio * 100);
    if (pct !== this.lastHype) {
      this.fill.style.width = `${pct}%`;
      this.lastHype = pct;
    }
    this.hype.classList.toggle("boost", boosting);
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

  showEnd(o: { title: string; reason: string; times: [string, string, boolean][]; tricks: string[] }) {
    $("end-title").textContent = o.title;
    $("end-reason").textContent = o.reason;
    $("end-times").innerHTML = o.times
      .map(([who, t, win]) => `<span class="${win ? "win" : ""}">${who}</span><span class="${win ? "win" : ""}">${t}</span>`)
      .join("");
    $("end-tricks").textContent = o.tricks.length ? o.tricks.join(" · ") : "Aucun… la prochaine fois !";
  }
}
