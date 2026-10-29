// Verifie les reglages : temps de course selon le taux de reussite, et deroule d'un run.
// Usage : npm run calibrate
declare const process: { argv: string[] };
import { Track } from "../src/engine/Track";
import { calibrate, simulateRun } from "../src/engine/Bot";
import { TRACKS, DEFAULT_TRACK } from "../src/data/tracks";

const track = new Track(TRACKS[DEFAULT_TRACK]);
console.log(`Piste ${track.def.name} : ${track.length.toFixed(0)} m, arrivee a ${track.finishS.toFixed(0)} m`);
for (const f of track.features.filter((f) => f.kind === "jump"))
  console.log(`  saut ${f.jumpType} h=${f.height} levre s=${f.s.toFixed(1)} pente=${track.slopeBefore(f.s).toFixed(2)}`);
for (const p of [0, 0.3, 0.6, 1]) {
  const c = calibrate(track, p, 20);
  console.log(`reussite ${p * 100}% -> temps moyen ${c.meanTime.toFixed(2)} s (${c.finished}/20 arrives, perfects reels ${(c.median.success * 100).toFixed(0)}%)`);
}
const verbose = simulateRun(track, Number(process.argv[2] ?? 0.3), 7, true);
console.log(verbose.log.join("\n"));
console.log("temps", verbose.time.toFixed(2), verbose.crashed ? "CHUTE" : "");
