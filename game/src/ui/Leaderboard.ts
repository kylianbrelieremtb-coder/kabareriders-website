// Classement en ligne : le joueur ecrit son prenom avant de jouer (ecran « Ton prenom », garde
// sur son telephone), chaque course terminee envoie son temps, et l'ecran de fin affiche le top de la piste.
// Le classement est servi par le site (/api/jeu/scores) : hors du site (dev, apercu), il est masque.

const API = "/api/jeu/scores";
const KEY = "rlp:prenom";
const SHOWN = 5;
/** Meme regle que l'API : lettres / chiffres, espaces, ' . -, 16 caracteres max */
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} '.\-]{0,15}$/u;

interface Row {
  rang: number;
  nom: string;
  temps: number;
  moi: boolean;
}
interface Board {
  total: number;
  top: Row[];
  moi: { rang: number; temps: number } | null;
}

const $ = (id: string) => document.getElementById(id)!;

function loadName(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function saveName(n: string) {
  try {
    localStorage.setItem(KEY, n);
  } catch {
    /* navigation privee : le prenom sera redemande a la prochaine visite */
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (t: number) => `${t.toFixed(2)} s`;

export class Leaderboard {
  name = loadName();
  private piste = "";
  private time: number | null = null;
  private req = 0;
  private onName: (() => void) | null = null;

  constructor() {
    $("name-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("name-input") as HTMLInputElement;
      const n = input.value.trim().replace(/\s+/g, " ");
      if (!NAME_RE.test(n)) {
        $("name-msg").textContent = n ? "Lettres et chiffres seulement, 16 caractères max." : "Écris ton prénom pour jouer.";
        return;
      }
      this.name = n;
      saveName(n);
      input.blur();
      $("screen-name").classList.add("hidden");
      this.updateTag();
      this.onName?.();
      this.onName = null;
    });
    this.updateTag();
  }

  /** Ecran « Ton prenom » par-dessus le jeu ; `done` est appele une fois le prenom valide */
  askName(done?: () => void) {
    this.onName = done ?? null;
    const input = $("name-input") as HTMLInputElement;
    input.value = this.name;
    $("name-msg").textContent = "";
    $("screen-name").classList.remove("hidden");
    // Sur ordinateur on peut taper directement ; sur telephone on laisse le joueur toucher le champ
    if (!("ontouchstart" in window)) setTimeout(() => input.focus(), 50);
  }

  private updateTag() {
    $("menu-pilot").textContent = this.name;
    $("pilot-tag").classList.toggle("hidden", !this.name);
  }

  /** A l'ecran de fin : `time` = temps affiche (s) si la course est terminee, null si chute */
  show(piste: string, pisteName: string, time: number | null) {
    this.piste = piste;
    this.time = time;
    $("board-piste").textContent = pisteName;
    $("board-msg").textContent = "";
    $("board-list").innerHTML = "";
    $("end-board").classList.add("hidden");
    void this.refresh();
  }

  private async refresh() {
    const id = ++this.req;
    const send = this.time !== null && this.name !== "";
    let res: Response;
    try {
      res = send
        ? await fetch(API, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ piste: this.piste, nom: this.name, temps: this.time }),
          })
        : await fetch(`${API}?piste=${encodeURIComponent(this.piste)}&nom=${encodeURIComponent(this.name)}`);
    } catch {
      return; // pas de serveur (dev / apercu) : pas de classement
    }
    if (id !== this.req) return;
    const data = (await res.json().catch(() => null)) as (Board & { error?: string }) | null;
    if (id !== this.req) return;
    if (res.status === 429) $("board-msg").textContent = "Trop d'envois, réessaie plus tard.";
    else if (!res.ok) return;
    if (!data?.top) {
      if (res.status === 429) $("end-board").classList.remove("hidden");
      return;
    }
    this.render(data, send);
  }

  private render(b: Board, sent: boolean) {
    $("end-board").classList.remove("hidden");
    const me = b.moi;
    if (me) {
      const best = sent && this.time !== null && Math.abs(me.temps - this.time) < 0.005;
      $("board-msg").textContent = `${best ? "Nouveau record" : "Ton record"} : ${fmt(me.temps)} · ${me.rang}${me.rang === 1 ? "er" : "e"} sur ${b.total}`;
    } else if (this.name) {
      $("board-msg").textContent = "Termine une course pour entrer au classement !";
    }
    const rows = b.top.slice(0, SHOWN);
    let html = rows.length
      ? rows.map((r) => `<li class="${r.moi ? "me" : ""}"><span>${r.rang}</span><b>${esc(r.nom)}</b><span>${fmt(r.temps)}</span></li>`).join("")
      : `<li class="empty">Personne encore : sois le premier !</li>`;
    if (me && me.rang > SHOWN) html += `<li class="me"><span>${me.rang}</span><b>${esc(this.name)}</b><span>${fmt(me.temps)}</span></li>`;
    $("board-list").innerHTML = html;
  }
}
