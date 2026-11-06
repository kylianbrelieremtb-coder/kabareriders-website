// Classement en ligne sur l'ecran de fin : le joueur ecrit son prenom une fois (garde sur son
// telephone), chaque course terminee envoie son temps, et on affiche le top de la piste.
// Le classement est servi par le site (/api/jeu/scores) : hors du site (dev, apercu), il est masque.

const API = "/api/jeu/scores";
const KEY = "rlp:prenom";
const SHOWN = 5;

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
    /* navigation privee : le prenom sera redemande */
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (t: number) => `${t.toFixed(2)} s`;

export class Leaderboard {
  private name = loadName();
  private piste = "";
  private time: number | null = null;
  private req = 0;

  constructor() {
    $("board-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const n = ($("board-name") as HTMLInputElement).value.trim().replace(/\s+/g, " ");
      if (!n) return;
      this.name = n;
      saveName(n);
      ($("board-name") as HTMLInputElement).blur();
      void this.refresh();
    });
    $("board-rename").addEventListener("click", () => {
      ($("board-name") as HTMLInputElement).value = this.name;
      this.setForm(true);
      ($("board-name") as HTMLInputElement).focus();
    });
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

  private setForm(on: boolean) {
    $("board-form").classList.toggle("hidden", !on);
    $("board-rename").classList.toggle("hidden", on || !this.name);
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
    if (res.status === 400 && send && data?.error?.startsWith("Prénom")) {
      // Prenom refuse (caracteres speciaux...) : on le redemande
      this.name = "";
      saveName("");
      $("board-msg").textContent = "Prénom invalide : lettres et chiffres, 16 caractères max.";
      $("end-board").classList.remove("hidden");
      this.setForm(true);
      return;
    }
    if (!res.ok) {
      if (res.status === 429) $("board-msg").textContent = "Trop d'envois, réessaie plus tard.";
      else return;
    }
    if (!data?.top) return;
    this.render(data, send);
  }

  private render(b: Board, sent: boolean) {
    $("end-board").classList.remove("hidden");
    // Pas encore de prenom : on le demande seulement s'il y a un temps a enregistrer
    this.setForm(!this.name && this.time !== null);
    const me = b.moi;
    if (!this.name) {
      $("board-msg").textContent = this.time !== null ? "Écris ton prénom pour entrer au classement :" : "";
    } else if (me) {
      const best = sent && this.time !== null && Math.abs(me.temps - this.time) < 0.005;
      $("board-msg").textContent = `${best ? "Nouveau record" : "Ton record"} : ${fmt(me.temps)} · ${me.rang}${me.rang === 1 ? "er" : "e"} sur ${b.total}`;
    } else {
      $("board-msg").textContent = `${this.name} : termine une course pour entrer au classement`;
    }
    const rows = b.top.slice(0, SHOWN);
    let html = rows.length
      ? rows.map((r) => `<li class="${r.moi ? "me" : ""}"><span>${r.rang}</span><b>${esc(r.nom)}</b><span>${fmt(r.temps)}</span></li>`).join("")
      : `<li class="empty">Personne encore : sois le premier !</li>`;
    if (me && me.rang > SHOWN) html += `<li class="me"><span>${me.rang}</span><b>${esc(this.name)}</b><span>${fmt(me.temps)}</span></li>`;
    $("board-list").innerHTML = html;
  }
}
