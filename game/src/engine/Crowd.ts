// Public low-poly derriere les barrieres, en instancie (perf mobile).
// Il saute et leve les bras quand la hype monte.

import * as THREE from "three";
import type { Track } from "./Track";

interface Person {
  x: number;
  y: number;
  z: number;
  rot: number;
  phase: number;
  energy: number;
}

const SHIRTS = ["#C76520", "#C2A833", "#704916", "#EFE6CE", "#2e6db4", "#d94f3d", "#3a3a3a", "#ffffff", "#7a9c3c", "#e0a030"];
const SKINS = ["#f0c8a0", "#e7b98f", "#c68c5a", "#8d5a3a", "#f5d5b5"];

export class Crowd {
  readonly group = new THREE.Group();
  private people: Person[] = [];
  private bodies: THREE.InstancedMesh;
  private heads: THREE.InstancedMesh;
  private arms: THREE.InstancedMesh;
  private time = 0;
  private cheer = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private one = new THREE.Vector3(1, 1, 1);
  private e = new THREE.Euler();

  /** Distance laterale des barrieres depuis l'axe central */
  static barrierLateral(track: Track, s: number) {
    const e = track.laneSpacing / 2 + track.laneWidth / 2 + 0.7;
    return e + track.heightAt(s) * 1.25 + 1.6;
  }

  constructor(track: Track) {
    const P = { x: 0, z: 0 };
    let seed = 1;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const zone of track.def.crowd) {
      const s0 = Math.max(track.startS, track.moduleStarts[zone.fromModule]);
      const s1 = zone.toModule + 1 < track.moduleStarts.length ? track.moduleStarts[zone.toModule + 1] : track.length;
      const density = zone.density ?? 1;
      for (const side of zone.side === 0 ? [-1, 1] : [zone.side]) {
        for (let s = s0; s < s1; s += 1.0 / density) {
          const rows = rnd() < 0.5 ? 1 : 2;
          for (let r = 0; r < rows; r++) {
            const lat = side * (Crowd.barrierLateral(track, s) + 0.7 + r * 0.9 + rnd() * 0.4);
            track.posAt(s + rnd() * 0.6, lat, P);
            this.people.push({
              x: P.x,
              y: 0,
              z: P.z,
              rot: track.headingAt(s) + (side > 0 ? Math.PI / 2 : -Math.PI / 2),
              phase: rnd() * Math.PI * 2,
              energy: 0.6 + rnd() * 0.6,
            });
          }
        }
      }
    }
    const n = this.people.length;
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.75, 0.26);
    bodyGeo.translate(0, 1.0, 0);
    const legGeo = new THREE.BoxGeometry(0.36, 0.62, 0.22);
    legGeo.translate(0, 0.31, 0);
    const merged = new THREE.BufferGeometry();
    {
      // Corps + jambes dans une seule geometrie
      const a = bodyGeo.toNonIndexed();
      const b = legGeo.toNonIndexed();
      const pos = new Float32Array(a.attributes.position.array.length + b.attributes.position.array.length);
      pos.set(a.attributes.position.array as Float32Array, 0);
      pos.set(b.attributes.position.array as Float32Array, a.attributes.position.array.length);
      merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      merged.computeVertexNormals();
    }
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    this.bodies = new THREE.InstancedMesh(merged, mat, n);
    const headGeo = new THREE.IcosahedronGeometry(0.15, 0);
    headGeo.translate(0, 1.55, 0);
    this.heads = new THREE.InstancedMesh(headGeo, mat, n);
    const armGeo = new THREE.BoxGeometry(0.1, 0.55, 0.1);
    armGeo.translate(0, -0.25, 0);
    this.arms = new THREE.InstancedMesh(armGeo, mat, n * 2);
    const c = new THREE.Color();
    this.people.forEach((_p, i) => {
      c.set(SHIRTS[i % SHIRTS.length]);
      this.bodies.setColorAt(i, c);
      this.arms.setColorAt(i * 2, c);
      this.arms.setColorAt(i * 2 + 1, c);
      c.set(SKINS[(i * 7) % SKINS.length]);
      this.heads.setColorAt(i, c);
    });
    for (const im of [this.bodies, this.heads, this.arms]) im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.bodies, this.heads, this.arms);
    this.update(0, 0);
  }

  /** Grosse reaction ponctuelle (trick pose, schralp) */
  burst(amount = 1) {
    this.cheer = Math.min(1.5, this.cheer + amount);
  }

  update(dt: number, excitement: number) {
    this.time += dt;
    this.cheer = Math.max(0, this.cheer - dt * 0.6);
    const ex = Math.min(1.4, 0.15 + excitement * 0.7 + this.cheer);
    const { m, q, v, one, e } = this;
    this.people.forEach((p, i) => {
      const k = ex * p.energy;
      const bounce = Math.max(0, Math.sin(this.time * 9 + p.phase)) * 0.18 * Math.max(0, k - 0.4);
      q.setFromAxisAngle(v.set(0, 1, 0), p.rot);
      m.compose(v.set(p.x, p.y + bounce, p.z), q, one);
      this.bodies.setMatrixAt(i, m);
      this.heads.setMatrixAt(i, m);
      // Bras : le long du corps -> leves au-dessus de la tete
      const raise = Math.min(1, Math.max(0, k - 0.3 + Math.sin(this.time * 6 + p.phase) * 0.25));
      for (const side of [-1, 1]) {
        const ang = raise * 2.8;
        e.set(0, p.rot, side * ang, "YXZ");
        q.setFromEuler(e);
        const sx = Math.cos(p.rot) * 0.27 * side;
        const sz = -Math.sin(p.rot) * 0.27 * side;
        m.compose(v.set(p.x + sx, p.y + bounce + 1.32, p.z + sz), q, one);
        this.arms.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), m);
      }
    });
    this.bodies.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
    this.arms.instanceMatrix.needsUpdate = true;
  }
}
