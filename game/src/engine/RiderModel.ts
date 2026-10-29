// Modele 3D low-poly d'un rider sur son VTT, avec poses (pump, tirage, tricks, chute).
// Un seul modele pour tous : seules les couleurs et les accessoires changent.

import * as THREE from "three";
import type { TrickId } from "../config";
import type { CharacterDef } from "../data/types";

const mat = (color: string | number) => new THREE.MeshLambertMaterial({ color, flatShading: true });

function beamGeo(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  const geo = new THREE.BoxGeometry(t, len, t);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  geo.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
  return geo;
}

interface Limb {
  upper: THREE.Group;
  lower: THREE.Group;
  l1: number;
  l2: number;
  /** +1 : articulation vers l'avant (genou), -1 : vers le bas/arriere (coude) */
  bend: 1 | -1;
}

function makeLimb(l1: number, l2: number, t1: number, t2: number, m1: THREE.Material, m2: THREE.Material, bend: 1 | -1, end?: THREE.Mesh): Limb {
  const upper = new THREE.Group();
  const a = new THREE.Mesh(new THREE.BoxGeometry(t1, l1, t1), m1);
  a.position.y = -l1 / 2;
  upper.add(a);
  const lower = new THREE.Group();
  lower.position.y = -l1;
  const b = new THREE.Mesh(new THREE.BoxGeometry(t2, l2, t2), m2);
  b.position.y = -l2 / 2;
  lower.add(b);
  if (end) {
    end.position.y = -l2;
    lower.add(end);
  }
  upper.add(lower);
  return { upper, lower, l1, l2, bend };
}

/** IK 2 os dans le plan YZ (racine et cible en coordonnees du parent) */
function solveLimb(limb: Limb, root: THREE.Vector3, target: THREE.Vector3) {
  limb.upper.position.copy(root);
  const dy = target.y - root.y;
  const dz = target.z - root.z;
  const dx = target.x - root.x;
  const d = Math.min(Math.max(Math.hypot(dy, dz), 0.05), limb.l1 + limb.l2 - 0.001);
  const phi = Math.atan2(-dz, -dy);
  const cosA = (limb.l1 * limb.l1 + d * d - limb.l2 * limb.l2) / (2 * limb.l1 * d);
  const cosB = (limb.l1 * limb.l1 + limb.l2 * limb.l2 - d * d) / (2 * limb.l1 * limb.l2);
  const alpha = Math.acos(Math.min(1, Math.max(-1, cosA)));
  const beta = Math.acos(Math.min(1, Math.max(-1, cosB)));
  limb.upper.rotation.set(phi + limb.bend * alpha, 0, Math.atan2(dx, Math.max(0.2, d)) * 0.9, "XZY");
  limb.lower.rotation.set(-limb.bend * (Math.PI - beta), 0, 0);
}

export interface PoseInput {
  crouch: number;
  extend: number;
  steer: number;
  trick: TrickId | null;
  trickT: number;
  crashT: number;
  crashSide: number;
  speed: number;
  airborne: boolean;
}

export class RiderModel {
  readonly root = new THREE.Group();
  /** Pivot au centre de gravite : rotations des flips / 360 */
  readonly pivot = new THREE.Group();
  private bike = new THREE.Group();
  private rear = new THREE.Group();
  private front = new THREE.Group();
  private rider = new THREE.Group();
  private torso = new THREE.Group();
  private wheels: THREE.Object3D[] = [];
  private legs: Limb[] = [];
  private arms: Limb[] = [];
  private r: number;
  private headTube = new THREE.Vector3(0, 0.98, -0.44);

  constructor(def: CharacterDef) {
    const o = def.outfit;
    const enduro = def.bike === "enduro";
    const r = (this.r = enduro ? 0.37 : 0.36);
    const tire = enduro ? 0.075 : 0.055;

    this.root.add(this.pivot);
    this.pivot.position.y = 0.9;
    this.bike.position.y = -0.9;
    this.rider.position.y = -0.9;
    this.pivot.add(this.bike, this.rider);

    // ---------------------------------------------------------------- velo
    const frameMat = mat(o.bike);
    const black = mat(0x1d1d1d);
    const metal = mat(0x9a9a9a);
    const wheelGeo = new THREE.TorusGeometry(r - tire, tire, 4, 12);
    wheelGeo.rotateY(Math.PI / 2);
    const spokeGeo = new THREE.CylinderGeometry(r - tire, r - tire, 0.02, 8);
    spokeGeo.rotateZ(Math.PI / 2);
    const mkWheel = () => {
      const w = new THREE.Group();
      w.add(new THREE.Mesh(wheelGeo, black));
      const disc = new THREE.Mesh(spokeGeo, new THREE.MeshLambertMaterial({ color: 0x777777, transparent: true, opacity: 0.35 }));
      w.add(disc);
      w.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2 * (r - tire), 0.03), metal));
      return w;
    };
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const ht = this.headTube;
    const rearAxle = P(0, r, 0.58);
    const bb = P(0, 0.34, 0.1);
    const seatTop = P(0, 0.92, 0.22);
    const headLow = P(0, 0.84, -0.47);
    const frontAxle = P(0, r, -0.66);
    const tt = enduro ? 0.075 : 0.06;

    // Arriere (tourne autour de la douille pour le tailwhip)
    this.rear.position.copy(ht);
    const rel = (v: THREE.Vector3) => v.clone().sub(ht);
    const rearParts = [
      beamGeo(rel(bb), rel(seatTop), tt),
      beamGeo(rel(bb), rel(headLow), tt * 1.15),
      beamGeo(rel(seatTop), rel(P(0, ht.y - 0.04, ht.z + 0.02)), tt),
      beamGeo(rel(bb), rel(rearAxle), tt * 0.7),
      beamGeo(rel(P(0, 0.82, 0.2)), rel(rearAxle), tt * 0.6),
    ];
    for (const g of rearParts) this.rear.add(new THREE.Mesh(g, frameMat));
    if (enduro) {
      const shock = new THREE.Mesh(beamGeo(rel(P(0, 0.5, 0.05)), rel(P(0, 0.78, -0.18)), 0.06), mat(0xd9a400));
      this.rear.add(shock);
    }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.26), black);
    seat.position.copy(rel(P(0, 0.97, 0.25)));
    this.rear.add(seat);
    const rw = mkWheel();
    rw.position.copy(rel(rearAxle));
    this.rear.add(rw);
    this.wheels.push(rw);
    const crank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.1), metal);
    crank.position.copy(rel(P(0, 0.36, 0.1)));
    this.rear.add(crank);
    this.bike.add(this.rear);

    // Avant
    this.front.add(new THREE.Mesh(beamGeo(headLow, frontAxle, enduro ? 0.075 : 0.05), enduro ? mat(0x222222) : metal));
    this.front.add(new THREE.Mesh(beamGeo(headLow, P(0, ht.y + 0.08, ht.z + 0.02), 0.06), frameMat));
    const bars = new THREE.Mesh(new THREE.BoxGeometry(enduro ? 0.8 : 0.72, 0.035, 0.035), black);
    bars.position.set(0, ht.y + 0.1, ht.z + 0.02);
    this.front.add(bars);
    const fw = mkWheel();
    fw.position.copy(frontAxle);
    this.front.add(fw);
    this.wheels.push(fw);
    this.bike.add(this.front);

    // ---------------------------------------------------------------- rider
    const suit = def.model === "suit-laptop";
    const top = mat(o.jersey);
    const pants = mat(o.pants);
    const skin = mat(o.skin);
    const shoe = mat(suit ? 0x5a3a1e : 0x1a1a1a);
    const glove = suit ? skin : mat(0x1a1a1a);

    const torsoLen = 0.56;
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, torsoLen, 0.22), top);
    torsoMesh.position.y = torsoLen / 2;
    this.torso.add(torsoMesh);
    if (suit) {
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.02), mat(0xf4f4f4));
      shirt.position.set(0, torsoLen - 0.12, -0.115);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.26, 0.02), mat(0xc0281e));
      tie.position.set(0, torsoLen - 0.19, -0.125);
      this.torso.add(shirt, tie);
      // Ordi portable coince sous le bras gauche
      const laptop = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.34), mat(0xc9ccd1));
      const logo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), mat(0xffffff));
      laptop.add(shell, logo);
      laptop.position.set(-0.22, torsoLen - 0.2, 0.02);
      laptop.rotation.x = 0.25;
      this.torso.add(laptop);
    } else {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.08, 0.23), mat(0xffffff));
      stripe.position.y = torsoLen * 0.62;
      this.torso.add(stripe);
    }
    const head = new THREE.Group();
    head.position.y = torsoLen + 0.17;
    head.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), skin));
    if (suit) {
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, 0.26), mat(o.helmet));
      hair.position.set(0, 0.1, 0.01);
      const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.02), mat(0x111111));
      glasses.position.set(0, 0.02, -0.125);
      head.add(hair, glasses);
    } else {
      const helmet = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), mat(o.helmet));
      helmet.scale.set(1, 1, 1.1);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.05), mat(0x1a1a1a));
      visor.position.set(0, 0.01, -0.16);
      const chin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.08), mat(o.helmet));
      chin.position.set(0, -0.1, -0.13);
      const peak = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.1), mat(o.jersey));
      peak.position.set(0, 0.13, -0.15);
      head.add(helmet, visor, chin, peak);
    }
    this.torso.add(head);
    this.rider.add(this.torso);

    for (const side of [-1, 1]) {
      const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoe);
      footMesh.position.z = -0.05;
      const leg = makeLimb(0.46, 0.46, 0.15, 0.12, pants, pants, 1, footMesh);
      this.legs.push(leg);
      this.rider.add(leg.upper);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), glove);
      const arm = makeLimb(0.3, 0.3, 0.1, 0.085, top, suit ? top : skin, -1, hand);
      this.arms.push(arm);
      this.rider.add(arm.upper);
      void side;
    }

    this.root.traverse((ob) => {
      ob.frustumCulled = false;
    });
  }

  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();

  update(dt: number, p: PoseInput) {
    // Roues
    for (const w of this.wheels) w.rotation.x -= (p.speed * dt) / this.r;

    const t = Math.min(1, Math.max(0, p.trickT));
    const w = Math.sin(Math.PI * t); // poids d'une figure de style (0 -> 1 -> 0)
    const ease = t * t * (3 - 2 * t);
    const trick = p.trick;

    this.pivot.rotation.set(0, 0, 0);
    this.rear.rotation.set(0, 0, 0);
    this.bike.rotation.set(0, 0, 0);
    this.bike.position.set(0, -0.9, 0);
    this.rider.rotation.set(0, 0, 0);

    let hipY = 1.03 - 0.2 * p.crouch + 0.08 * p.extend;
    let hipZ = 0.16 + 0.06 * p.crouch - 0.04 * p.extend;
    let lean = 0.62 + 0.28 * p.crouch - 0.25 * p.extend;
    const feet = [new THREE.Vector3(-0.13, 0.36, 0.08), new THREE.Vector3(0.13, 0.36, 0.08)];
    const ht = this.headTube;
    const hands = [new THREE.Vector3(-0.33, ht.y + 0.1, ht.z + 0.02), new THREE.Vector3(0.33, ht.y + 0.1, ht.z + 0.02)];

    if (!p.airborne) this.pivot.rotation.z = -p.steer * 0.12;

    switch (trick) {
      case "frontflip":
        this.pivot.rotation.x = -ease * Math.PI * 2;
        hipY -= 0.1;
        lean += 0.2;
        break;
      case "backflip":
        this.pivot.rotation.x = ease * Math.PI * 2;
        hipY -= 0.1;
        break;
      case "threesixty":
        this.pivot.rotation.y = ease * Math.PI * 2;
        this.pivot.rotation.z = 0.25 * w;
        break;
      case "tailwhip":
        this.rear.rotation.y = ease * Math.PI * 2;
        hipY += 0.18 * w;
        feet[0].set(-0.5, 0.55 + 0.2 * w, 0.15);
        feet[1].set(0.5, 0.55 + 0.2 * w, 0.15);
        break;
      case "suicide":
        hands[0].lerp(this.tmpA.set(-0.55, 1.35, 0.55), w);
        hands[1].lerp(this.tmpA.set(0.55, 1.35, 0.55), w);
        lean -= 0.4 * w;
        hipY += 0.1 * w;
        break;
      case "tbog":
        this.bike.rotation.z = 1.1 * w;
        this.rider.rotation.z = -0.3 * w;
        break;
      case "superman":
        hipY += 0.35 * w;
        hipZ += 0.25 * w;
        lean += 0.8 * w;
        feet[0].lerp(this.tmpA.set(-0.12, 1.25, 1.0), w);
        feet[1].lerp(this.tmpA.set(0.12, 1.2, 1.0), w);
        break;
      case "nofootcan":
        feet[0].lerp(this.tmpA.set(0.45, 0.75, -0.05), w);
        feet[1].lerp(this.tmpA.set(0.62, 0.65, 0.05), w);
        this.rider.rotation.z = -0.1 * w;
        break;
      default:
        break;
    }

    // Chute : le velo se couche, le rider glisse vers la rubalise
    if (p.crashT > 0) {
      const k = Math.min(1, p.crashT * 2.2);
      this.bike.rotation.z = p.crashSide * -1.45 * k;
      this.bike.position.y = -0.9 + 0.1 * k;
      this.rider.rotation.z = p.crashSide * -1.4 * Math.min(1, p.crashT * 2.8);
      this.rider.position.x = p.crashSide * 0.6 * k;
      hipY -= 0.25 * k;
      hands[0].set(-0.5, 0.9, -0.2);
      hands[1].set(0.5, 0.9, -0.2);
    } else {
      this.rider.position.x = 0;
    }

    this.torso.position.set(0, hipY, hipZ);
    this.torso.rotation.x = -lean;
    const torsoLen = 0.56;
    const shoulderY = hipY + Math.cos(lean) * (torsoLen - 0.06);
    const shoulderZ = hipZ - Math.sin(lean) * (torsoLen - 0.06);

    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -1 : 1;
      solveLimb(this.legs[i], this.tmpA.set(sx * 0.1, hipY, hipZ), feet[i]);
      // Le guidon tourne avec l'avant ; pendant le tailwhip les mains restent au guidon
      solveLimb(this.arms[i], this.tmpB.set(sx * 0.2, shoulderY, shoulderZ), hands[i]);
    }
  }
}
