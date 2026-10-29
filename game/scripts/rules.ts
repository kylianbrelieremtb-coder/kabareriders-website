// Verifie les regles de chute et les tricks avec des scenarios scriptes.
// Usage : npm run test:rules
import { Track } from "../src/engine/Track";
import { RiderSim } from "../src/engine/RiderSim";
import { Bot, mulberry32 } from "../src/engine/Bot";
import { emptyIntent, type Intent } from "../src/engine/intent";
import { TRACKS, DEFAULT_TRACK } from "../src/data/tracks";

const track = new Track(TRACKS[DEFAULT_TRACK]);
const jumps = track.features.filter((f) => f.kind === "jump");
const small = jumps[0];
const big = jumps[jumps.length - 1];
let failed = 0;

/** Fait rouler le bot (parfait) et laisse `hook` modifier l'intention */
function run(hook: (sim: RiderSim, it: Intent) => void, maxT = 40) {
  const rand = mulberry32(3);
  const sim = new RiderSim(track, -1, rand);
  const bot = new Bot(sim, 1, rand);
  sim.go();
  for (let t = 0; t < maxT && sim.state === "racing"; t += 1 / 120) {
    const it = bot.intent();
    hook(sim, it);
    sim.step(1 / 120, it);
  }
  return sim;
}
function check(name: string, sim: RiderSim, expect: string | null) {
  const ok = expect === null ? sim.state === "finished" : sim.state === "crashed" && sim.crashReason.includes(expect);
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${name} -> ${sim.state}${sim.crashReason ? " (" + sim.crashReason + ")" : ""}`);
}
const trickDir = (it: Intent, d: Intent["trickDir"]) => {
  Object.assign(it, emptyIntent(), { trick: true, trickDir: d, trickDirPressed: d });
};

check("run parfait sans trick", run(() => {}), null);

let done = false;
check("backflip au decollage du gros kicker", run((s, it) => {
  if (!done && s.s > big.s - s.v * 0.3 && s.s < big.s) { trickDir(it, "down"); done = true; }
}), null);

done = false;
check("frontflip lance trop tot", run((s, it) => {
  if (!done && s.s > big.s - 7.5) { trickDir(it, "up"); done = true; }
}), "trop tôt");

done = false;
check("360 lance en l'air", run((s, it) => {
  if (!done && s.airborne && s.s > big.s) { trickDir(it, "right"); done = true; }
}), "en l'air");

done = false;
check("backflip sur le petit kicker", run((s, it) => {
  if (!done && s.s > small.s - s.v * 0.3 && s.s < small.s) { trickDir(it, "down"); done = true; }
}), "");

done = false;
check("tailwhip en l'air sur le gros kicker", run((s, it) => {
  if (!done && s.airborne && s.s > big.s && s.vy > 2) { trickDir(it, "left"); done = true; }
}), null);

done = false;
check("trick de style sur le gros kicker", run((s, it) => {
  if (!done && s.airborne && s.s > big.s && s.vy > 3) { Object.assign(it, emptyIntent(), { trick: true, trickPressed: true }); done = true; }
}), null);

check("sortie de piste (direction a fond d un cote)", run((_s, it) => { it.steer = 1; }), "Sortie");

check("trop vite sans raser (boost permanent)", run((s, it) => {
  if (s.s > big.s - 25) { s.v = 17.5; it.up = it.down = it.upPressed = it.downPressed = false; }
}), "Trop long");

check("trop lent sans tirer", run((s, it) => {
  if (s.s > big.s - 25) { s.v = Math.min(s.v, 3.5); it.up = it.down = it.upPressed = it.downPressed = false; }
}), "casé");

done = false;
check("trick en rasant une bosse", run((s, it) => {
  const bump = track.features.find((f) => f.kind === "bump")!;
  if (!done && s.s > bump.s + 0.2) { trickDir(it, "up"); done = true; }
}), "rasant");

console.log(failed ? `${failed} echec(s)` : "Toutes les regles sont respectees.");
if (failed) throw new Error("rules");
