// Vitesse d'arrivee sur chaque saut selon le niveau du rider (bot), pour dimensionner les modules.
import { Track } from "../src/engine/Track";
import { RiderSim } from "../src/engine/RiderSim";
import { Bot, mulberry32 } from "../src/engine/Bot";
import { TRACKS, DEFAULT_TRACK } from "../src/data/tracks";
const track = new Track(TRACKS[DEFAULT_TRACK]);
const jumps = track.features.filter((f) => f.kind === "jump");
for (const p of [0, 0.3, 0.6, 1]) {
  const acc = jumps.map(() => [] as number[]);
  for (let seed = 0; seed < 20; seed++) {
    const rand = mulberry32(seed + 50);
    const sim = new RiderSim(track, -1, rand);
    const bot = new Bot(sim, p, rand);
    sim.go();
    for (let t = 0; t < 40 && sim.state === "racing"; t += 1 / 120) {
      sim.step(1 / 120, bot.intent());
      for (const e of sim.events) if (e.type === "takeoff") acc[jumps.indexOf(e.feature)].push(sim.v);
    }
  }
  console.log(`reussite ${p * 100}% : ` + acc.map((a, i) => `${jumps[i].jumpType}${jumps[i].height} ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)} (${Math.min(...a).toFixed(1)}-${Math.max(...a).toFixed(1)})`).join(" | "));
}
