// Petites particules de poussiere (schralp, receptions) en un seul Points.

import * as THREE from "three";

const N = 120;

export class Dust {
  readonly points: THREE.Points;
  private pos = new Float32Array(N * 3);
  private vel = new Float32Array(N * 3);
  private life = new Float32Array(N);
  private next = 0;

  constructor() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d")!;
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, "rgba(214,170,120,0.9)");
    grd.addColorStop(1, "rgba(214,170,120,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    const mat = new THREE.PointsMaterial({
      size: 0.9,
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    for (let i = 0; i < N; i++) this.pos[i * 3 + 1] = -100;
  }

  emit(at: THREE.Vector3, count: number, spread: number, up: number, dir?: THREE.Vector3) {
    for (let k = 0; k < count; k++) {
      const i = this.next++ % N;
      this.pos.set([at.x + (Math.random() - 0.5) * 0.4, at.y + 0.1, at.z + (Math.random() - 0.5) * 0.4], i * 3);
      const dx = (Math.random() - 0.5) * spread + (dir?.x ?? 0);
      const dz = (Math.random() - 0.5) * spread + (dir?.z ?? 0);
      this.vel.set([dx, Math.random() * up, dz], i * 3);
      this.life[i] = 0.6 + Math.random() * 0.5;
    }
  }

  update(dt: number) {
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const j = i * 3;
      this.vel[j + 1] -= 2.5 * dt;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      if (this.life[i] <= 0) this.pos[j + 1] = -100;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
