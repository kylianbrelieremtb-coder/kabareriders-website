// Construction du decor 3D low-poly a partir d'une Track : terrain, butte, lignes,
// kickers bois, rubalise, barrieres, pylone, arbres, plan d'eau, depart et arrivee.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Track } from "./Track";
import { Crowd } from "./Crowd";

const BRAND = { ocre: "#C76520", vert: "#C2A833", marron: "#704916", beige: "#EFE6CE" };

export interface WorldBuild {
  crowd: Crowd;
  update(dt: number, excitement: number): void;
}

const lambert = (opts: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(opts);

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function buildWorld(scene: THREE.Scene, track: Track): WorldBuild {
  const def = track.def;
  const d = def.decor;

  // ------------------------------------------------------------- ciel + lumiere
  const skyGeo = new THREE.SphereGeometry(900, 16, 12);
  const top = new THREE.Color(d.sky.top);
  const hor = new THREE.Color(d.sky.horizon);
  const cols: number[] = [];
  const pos = skyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i) / 900);
    const c = hor.clone().lerp(top, Math.pow(t, 0.6));
    cols.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  const sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(sky);
  scene.fog = new THREE.Fog(hor, 90, 420);

  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x8a6a3a, 1.25));
  const sun = new THREE.DirectionalLight(0xffd7a0, 1.9);
  sun.position.set(-60, 45, 30);
  scene.add(sun);

  // ------------------------------------------------------------- terrain
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < track.n; i += 10) {
    minX = Math.min(minX, track.x[i]); maxX = Math.max(maxX, track.x[i]);
    minZ = Math.min(minZ, track.z[i]); maxZ = Math.max(maxZ, track.z[i]);
  }
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const size = 700;
  const seg = 110;
  const terrain = new THREE.PlaneGeometry(size, size, seg, seg);
  terrain.rotateX(-Math.PI / 2);
  terrain.translate(cx, 0, cz);
  const grass = new THREE.Color(d.grass);
  const grassDry = new THREE.Color("#9aa652");
  const dirt = new THREE.Color(d.dirt);
  const centers: [number, number][] = [];
  for (let i = 0; i < track.n; i += 8) centers.push([track.x[i], track.z[i]]);
  const tp = terrain.attributes.position;
  const tcol: number[] = [];
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i);
    const z = tp.getZ(i);
    let dmin = Infinity;
    for (const [px, pz] of centers) {
      const dd = (px - x) * (px - x) + (pz - z) * (pz - z);
      if (dd < dmin) dmin = dd;
    }
    const dist = Math.sqrt(dmin);
    const n = hash(i * 0.37);
    const g = grass.clone().lerp(grassDry, n * 0.45);
    const k = Math.min(1, Math.max(0, (dist - 9) / 9));
    const c = dirt.clone().multiplyScalar(0.92 + n * 0.12).lerp(g, k);
    tcol.push(c.r, c.g, c.b);
    tp.setY(i, (n - 0.5) * 0.12 - (dist < 12 ? 0.02 : 0));
  }
  terrain.setAttribute("color", new THREE.Float32BufferAttribute(tcol, 3));
  terrain.computeVertexNormals();
  scene.add(new THREE.Mesh(terrain, lambert({ vertexColors: true, flatShading: true })));

  // ------------------------------------------------------------- plan d'eau
  if (d.lake) {
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(1, 24),
      lambert({ color: 0x4f8fb5, emissive: 0x0d2a40 }),
    );
    lake.rotation.x = -Math.PI / 2;
    lake.scale.set(d.lake.w / 2, d.lake.d / 2, 1);
    lake.position.set(cx + d.lake.x, 0.05, cz + d.lake.z);
    scene.add(lake);
  }

  // ------------------------------------------------------------- butte + lignes
  scene.add(buildMound(track));
  scene.add(buildLanes(track));
  scene.add(buildFinishLine(track));
  const tapes = buildTapes(track);
  scene.add(tapes);

  // ------------------------------------------------------------- depart / arrivee
  scene.add(buildArch(track, track.startS - 1.2, "KABARE • ROULE LA PISTE", false));
  scene.add(buildArch(track, track.finishS, "ARRIVÉE", true));

  // ------------------------------------------------------------- pylone
  if (d.pylon) {
    const s = track.moduleStarts[d.pylon.nearModule] + 4;
    const p = track.posAt(s, d.pylon.side * (track.laneSpacing / 2 + track.laneWidth + d.pylon.distance));
    const pylon = buildPylon();
    pylon.position.set(p.x, 0, p.z);
    pylon.rotation.y = track.headingAt(s) + 0.5;
    scene.add(pylon);
  }

  // ------------------------------------------------------------- arbres
  // Arbres (on ignore ceux qui tomberaient sur la piste ou le public)
  const clear = (x: number, z: number) => centers.every(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 > 16 * 16);
  const trees = buildTrees(
    d.trees.map((t) => ({ x: cx + t.x, z: cz + t.z, s: t.s ?? 1 })).filter((t) => clear(t.x, t.z)),
  );
  scene.add(trees);

  // ------------------------------------------------------------- public + barrieres
  const crowd = new Crowd(track);
  scene.add(crowd.group);
  scene.add(buildBarriers(track));

  return {
    crowd,
    update(dt, excitement) {
      crowd.update(dt, excitement);
    },
  };
}

// =============================================================================

function sampleList(track: Track, step: number): number[] {
  const list: number[] = [];
  for (let s = 0; s <= track.length; s += step) list.push(s);
  // Levres nettes : echantillons juste avant/apres chaque levre de saut
  for (const f of track.features) if (f.kind === "jump") list.push(f.s - 0.01, f.s + 0.01);
  return list.sort((a, b) => a - b);
}

function moundEdge(track: Track) {
  return track.laneSpacing / 2 + track.laneWidth / 2 + 0.7;
}

/** Hauteur de la butte (plateau) a une position laterale donnee */
export function moundHeight(track: Track, s: number, lat: number): number {
  const h = track.heightAt(s);
  const e = moundEdge(track);
  const a = Math.abs(lat);
  if (a <= e) return h;
  const wood = track.wood[track.index(s)] === 1;
  const sh = wood ? 0.01 : h * 1.25 + 0.4;
  return Math.max(0, h * (1 - (a - e) / sh));
}

function buildMound(track: Track): THREE.Mesh {
  const list = sampleList(track, 0.5);
  const e = moundEdge(track);
  const dirt = new THREE.Color(track.def.decor.dirt);
  const dark = dirt.clone().multiplyScalar(0.78);
  const wood = new THREE.Color("#8a5a2b");
  const lats = (h: number, isWood: boolean) => {
    const sh = isWood ? 0.01 : h * 1.25 + 0.4;
    return [-e - sh, -e, -e / 3, e / 3, e, e + sh];
  };
  const verts: number[] = [];
  const colors: number[] = [];
  const idx: number[] = [];
  const P = { x: 0, z: 0 };
  list.forEach((s, row) => {
    const h = track.heightAt(s);
    const isWood = track.wood[track.index(s)] === 1;
    const L = lats(h, isWood);
    L.forEach((lat, k) => {
      track.posAt(s, lat, P);
      const outer = k === 0 || k === L.length - 1;
      verts.push(P.x, outer ? -0.05 : h, P.z);
      const c = outer ? (isWood ? wood : dark) : dirt.clone().multiplyScalar(0.95 + hash(row * 7 + k) * 0.08);
      colors.push(c.r, c.g, c.b);
    });
    if (row > 0) {
      const a = (row - 1) * 6;
      const b = row * 6;
      for (let k = 0; k < 5; k++) idx.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, lambert({ vertexColors: true, side: THREE.DoubleSide }));
}

function buildLanes(track: Track): THREE.Mesh {
  const list = sampleList(track, 0.25);
  const w = track.laneWidth;
  const cols = 7;
  const dirt = new THREE.Color("#c27a3e");
  const dirt2 = new THREE.Color("#b06c33");
  const plank1 = new THREE.Color("#b07a43");
  const plank2 = new THREE.Color("#94612f");
  const side = new THREE.Color("#7d4a1f");
  const verts: number[] = [];
  const colors: number[] = [];
  const idx: number[] = [];
  const P = { x: 0, z: 0 };
  let base = 0;
  for (const lane of [-1, 1] as const) {
    const c0 = track.laneCenter(lane);
    list.forEach((s, row) => {
      const isWood = track.wood[track.index(s)] === 1;
      const h = track.heightAt(s);
      // surface : cols points, puis 2 points de jupe (gauche/droite) sous les bords
      for (let k = 0; k < cols; k++) {
        const u = -w / 2 + (w * k) / (cols - 1);
        track.posAt(s, c0 + u, P);
        verts.push(P.x, track.surfaceY(s, u) + 0.03, P.z);
        let c: THREE.Color;
        if (isWood) c = Math.floor(s / 0.3) % 2 ? plank1 : plank2;
        else {
          const rut = Math.abs(u) < 0.35 ? 0.9 : 1;
          c = dirt.clone().lerp(dirt2, hash(row * 13 + k)).multiplyScalar(rut);
        }
        colors.push(c.r, c.g, c.b);
      }
      for (const edge of [-1, 1]) {
        track.posAt(s, c0 + (edge * w) / 2, P);
        verts.push(P.x, h - 0.02, P.z);
        colors.push(side.r, side.g, side.b);
      }
      if (row > 0) {
        const stride = cols + 2;
        const a = base + (row - 1) * stride;
        const b = base + row * stride;
        for (let k = 0; k < cols - 1; k++) idx.push(a + k, b + k, a + k + 1, a + k + 1, b + k, b + k + 1);
        // jupes
        const L = cols, R = cols + 1;
        idx.push(a + L, b + L, a + 0, a + 0, b + L, b + 0);
        idx.push(a + cols - 1, b + cols - 1, a + R, a + R, b + cols - 1, b + R);
      }
    });
    base += list.length * (cols + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, lambert({ vertexColors: true, side: THREE.DoubleSide }));
}

/** Rubalise rouge/blanche : bords exterieurs + separation centrale */
function buildTapes(track: Track): THREE.Group {
  const group = new THREE.Group();
  const e = track.laneSpacing / 2 + track.laneWidth / 2 + 0.45;
  const step = 2.5;
  const postH = 0.95;
  const posts: THREE.Vector3[] = [];
  const jumps = track.features.filter((f) => f.kind === "jump");
  const inJump = (s: number) =>
    jumps.some((f) => s > f.s - (f.jumpType === "kicker" ? 6 : 2.5) && s < (f.landEnd ?? f.s) + 0.5);

  const verts: number[] = [];
  const colors: number[] = [];
  const red = new THREE.Color("#d42a1e");
  const white = new THREE.Color("#f4f1ea");
  const P = { x: 0, z: 0 };

  for (const lat of [-e, 0, e]) {
    let prev: THREE.Vector3 | null = null;
    let segI = 0;
    for (let s = track.startS + 1; s <= track.finishS + 12; s += step) {
      if (lat === 0 && (inJump(s) || s > track.finishS - 1)) {
        prev = null;
        continue;
      }
      track.posAt(s, lat, P);
      const y = lat === 0 ? track.heightAt(s) : moundHeight(track, s, lat);
      const p = new THREE.Vector3(P.x, y + postH, P.z);
      posts.push(new THREE.Vector3(P.x, y, P.z));
      if (prev) {
        const c = segI++ % 2 ? red : white;
        const hh = 0.07;
        verts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z, prev.x, prev.y - hh, prev.z);
        verts.push(prev.x, prev.y - hh, prev.z, p.x, p.y, p.z, p.x, p.y - hh, p.z);
        for (let k = 0; k < 6; k++) colors.push(c.r, c.g, c.b);
      }
      prev = p;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  group.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));

  const postGeo = new THREE.BoxGeometry(0.05, postH, 0.05);
  postGeo.translate(0, postH / 2, 0);
  const inst = new THREE.InstancedMesh(postGeo, lambert({ color: 0xe8e2d0 }), posts.length);
  const m = new THREE.Matrix4();
  posts.forEach((p, i) => {
    m.makeTranslation(p.x, p.y, p.z);
    inst.setMatrixAt(i, m);
  });
  group.add(inst);
  return group;
}

function brandTexture(text: string, checker: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d")!;
  if (checker) {
    const sq = 32;
    for (let x = 0; x < c.width; x += sq)
      for (let y = 0; y < c.height; y += sq) {
        g.fillStyle = (x / sq + y / sq) % 2 ? "#111" : "#f4f1ea";
        g.fillRect(x, y, sq, sq);
      }
    g.fillStyle = BRAND.ocre;
    g.fillRect(260, 16, 504, 96);
  } else {
    g.fillStyle = BRAND.ocre;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = BRAND.marron;
    g.fillRect(0, 112, c.width, 16);
  }
  g.fillStyle = BRAND.beige;
  g.font = "bold 78px 'Squada One', Impact, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function buildArch(track: Track, s: number, text: string, checker: boolean): THREE.Group {
  const g = new THREE.Group();
  const half = track.laneSpacing / 2 + track.laneWidth / 2 + 0.6;
  const h = track.heightAt(s);
  const postMat = lambert({ color: BRAND.marron });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), postMat);
    post.position.set(side * half, 1.8, 0);
    g.add(post);
  }
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(half * 2 + 0.4, 0.9, 0.12),
    [postMat, postMat, postMat, postMat, new THREE.MeshBasicMaterial({ map: brandTexture(text, checker) }), new THREE.MeshBasicMaterial({ map: brandTexture(text, checker) })],
  );
  banner.position.set(0, 3.5, 0);
  g.add(banner);
  const P = track.posAt(s, 0);
  g.position.set(P.x, h, P.z);
  g.rotation.y = track.headingAt(s);
  return g;
}

function buildFinishLine(track: Track): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const g = c.getContext("2d")!;
  for (let x = 0; x < 256; x += 16)
    for (let y = 0; y < 32; y += 16) {
      g.fillStyle = (x / 16 + y / 16) % 2 ? "#111" : "#f4f1ea";
      g.fillRect(x, y, 16, 16);
    }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const w = track.laneSpacing + track.laneWidth;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.6), new THREE.MeshBasicMaterial({ map: tex }));
  m.rotation.order = "YXZ";
  m.rotation.y = track.headingAt(track.finishS);
  m.rotation.x = -Math.PI / 2;
  const P = track.posAt(track.finishS, 0);
  m.position.set(P.x, track.heightAt(track.finishS) + 0.06, P.z);
  return m;
}

function buildPylon(): THREE.Group {
  const parts: THREE.BufferGeometry[] = [];
  const H = 30;
  const baseHalf = 3.2;
  const topHalf = 0.9;
  const beam = (a: THREE.Vector3, b: THREE.Vector3, t = 0.12) => {
    const len = a.distanceTo(b);
    const geo = new THREE.BoxGeometry(t, len, t);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    geo.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
    parts.push(geo);
  };
  const corner = (y: number, sx: number, sz: number) => {
    const half = baseHalf + (topHalf - baseHalf) * Math.min(1, y / (H * 0.75));
    return new THREE.Vector3(sx * half, y, sz * half);
  };
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const levels = [0, 4, 8, 12, 16, 20, 23.5, 27, H];
  for (const [sx, sz] of corners) for (let i = 0; i < levels.length - 1; i++) beam(corner(levels[i], sx, sz), corner(levels[i + 1], sx, sz), 0.2);
  for (let i = 1; i < levels.length; i++) {
    for (let c = 0; c < 4; c++) {
      const [ax, az] = corners[c];
      const [bx, bz] = corners[(c + 1) % 4];
      beam(corner(levels[i], ax, az), corner(levels[i], bx, bz));
      beam(corner(levels[i - 1], ax, az), corner(levels[i], bx, bz), 0.08);
      beam(corner(levels[i - 1], bx, bz), corner(levels[i], ax, az), 0.08);
    }
  }
  // Bras porteurs
  for (const y of [20, 25]) {
    const w = y === 20 ? 9 : 7;
    beam(new THREE.Vector3(-w, y, 0), new THREE.Vector3(w, y, 0), 0.25);
    beam(new THREE.Vector3(-w, y, 0), corner(y + 2.5, -1, 0), 0.1);
    beam(new THREE.Vector3(w, y, 0), corner(y + 2.5, 1, 0), 0.1);
    for (const x of [-w + 0.3, w - 0.3]) beam(new THREE.Vector3(x, y, 0), new THREE.Vector3(x, y - 1.8, 0), 0.18);
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(mergeGeometries(parts), lambert({ color: 0x9aa0a6 })));
  // Cables
  const wire = new THREE.LineBasicMaterial({ color: 0x333333 });
  for (const y of [20, 25]) {
    const w = y === 20 ? 8.7 : 6.7;
    for (const x of [-w, w]) {
      const pts = [new THREE.Vector3(x, y - 1.8, -260), new THREE.Vector3(x, y - 1.8, 260)];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
    }
  }
  // Grillage autour du pied
  const fence = new THREE.Mesh(
    new THREE.BoxGeometry(9, 1.6, 9),
    new THREE.MeshBasicMaterial({ color: 0x5a6b4a, wireframe: true }),
  );
  fence.position.y = 0.8;
  g.add(fence);
  return g;
}

function buildTrees(list: { x: number; z: number; s: number }[]): THREE.Group {
  const g = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.2, 5);
  trunkGeo.translate(0, 1.1, 0);
  const crownGeo = new THREE.IcosahedronGeometry(2.2, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, lambert({ color: 0x6b4a2b, flatShading: true }), list.length);
  const crowns = new THREE.InstancedMesh(crownGeo, lambert({ color: 0xffffff, flatShading: true }), list.length * 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const greens = ["#5f8f2f", "#4f7d2a", "#77a33a", "#3f6b26"].map((c) => new THREE.Color(c));
  list.forEach((t, i) => {
    m.compose(new THREE.Vector3(t.x, 0, t.z), q, new THREE.Vector3(t.s, t.s, t.s));
    trunks.setMatrixAt(i, m);
    for (let k = 0; k < 2; k++) {
      const sc = t.s * (k ? 0.75 : 1);
      q.setFromEuler(new THREE.Euler(hash(i + k) * 3, hash(i * 3 + k) * 3, 0));
      m.compose(new THREE.Vector3(t.x + (k ? 0.8 : 0) * t.s, (2.9 + k * 1.4) * t.s, t.z), q, new THREE.Vector3(sc, sc * 0.9, sc));
      crowns.setMatrixAt(i * 2 + k, m);
      crowns.setColorAt(i * 2 + k, greens[(i + k) % greens.length]);
    }
    q.identity();
  });
  g.add(trunks, crowns);
  return g;
}

function buildBarriers(track: Track): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(2.2, 1.0, 0.06);
  geo.translate(0, 0.5, 0);
  const items: { x: number; z: number; rot: number }[] = [];
  const banners: { x: number; z: number; rot: number }[] = [];
  const P = { x: 0, z: 0 };
  for (const zone of track.def.crowd) {
    const s0 = Math.max(track.startS, track.moduleStarts[zone.fromModule]);
    const s1 =
      zone.toModule + 1 < track.moduleStarts.length ? track.moduleStarts[zone.toModule + 1] : track.length;
    for (const side of zone.side === 0 ? [-1, 1] : [zone.side]) {
      let k = 0;
      for (let s = s0; s < s1; s += 2.3) {
        const lat = side * Crowd.barrierLateral(track, s);
        track.posAt(s, lat, P);
        const it = { x: P.x, z: P.z, rot: track.headingAt(s) + Math.PI / 2 };
        // Les baches regardent la piste (sinon le texte apparait a l'envers)
        if (k++ % 4 === 1) banners.push({ ...it, rot: it.rot + (side > 0 ? Math.PI : 0) });
        else items.push(it);
      }
    }
  }
  const inst = new THREE.InstancedMesh(geo, lambert({ color: 0xb8bcc0 }), items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  items.forEach((it, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.rot);
    m.compose(new THREE.Vector3(it.x, 0, it.z), q, one);
    inst.setMatrixAt(i, m);
  });
  g.add(inst);
  // Baches KABARE sur certaines barrieres
  const tex = brandTexture("KABARE", false);
  const bmat = new THREE.MeshBasicMaterial({ map: tex });
  const bgeo = new THREE.PlaneGeometry(2.2, 0.9);
  bgeo.translate(0, 0.5, 0);
  const binst = new THREE.InstancedMesh(bgeo, bmat, banners.length);
  banners.forEach((it, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.rot);
    m.compose(new THREE.Vector3(it.x, 0, it.z), q, one);
    binst.setMatrixAt(i, m);
  });
  g.add(binst);
  return g;
}
