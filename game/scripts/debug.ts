// Matrice : pour chaque saut et chaque vitesse, resultat de chaque action (P=perfect, o=ok, b=mauvais, X=chute)
import { Track } from "../src/engine/Track";
import { RiderSim } from "../src/engine/RiderSim";
import { TRACKS, DEFAULT_TRACK } from "../src/data/tracks";
const track = new Track(TRACKS[DEFAULT_TRACK]);
const sim = new RiderSim(track, 1);
const q = (r: string) => ({ perfect: "P", ok: "o", bad: "b", crash: "X" })[r];
const speeds = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
console.log("v:            " + speeds.map((v) => String(v).padStart(4)).join(""));
for (const f of track.features.filter((f) => f.kind === "jump")) {
  for (const a of ["none", "pull", "scrub"] as const) {
    const row = speeds.map((v) => { const p = sim.predictJump(f, v, a, 0); return (q(p.quality) + p.air.toFixed(1).slice(1)).padStart(4); }).join("");
    console.log(`${f.jumpType!.padEnd(6)} h${f.height} ${a.padEnd(5)} ${row}`);
  }
}
