// Decor 3D d'apres les photos de la piste d'Apt : butte de terre damee bordee de gravier,
// kickers en planches, butte de depart en herbe et copeaux, pins parasols, peupliers,
// plan d'eau avec structures gonflables, Luberon au loin, pylone et sa palissade.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Landmark } from "../data/types";
import type { Track } from "./Track";
import { Crowd } from "./Crowd";
import { barrierLateral, moundEdge, moundHeight, moundTop, sampleKind, shoulderWidth } from "./layout";
import { chipsTexture, dirtTexture, grassTexture, gravelTexture, paintedTexture, woodTexture } from "./Textures";

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

interface Mats {
  dirt: THREE.Material;
  gravel: THREE.Material;
  grass: THREE.Material;
  wood: THREE.Material;
  woodSide: THREE.Material;
  chips: THREE.Material;
}

export function buildWorld(scene: THREE.Scene, track: Track): WorldBuild {
  const d = track.def.decor;
  const tex = {
    dirt: dirtTexture(),
    gravel: gravelTexture(),
    grass: grassTexture(),
    wood: woodTexture(),
    chips: chipsTexture(),
  };
  const mats: Mats = {
    dirt: lambert({ map: tex.dirt, vertexColors: true }),
    gravel: lambert({ map: tex.gravel, vertexColors: true }),
    grass: lambert({ map: tex.grass, vertexColors: true }),
    wood: lambert({ map: tex.wood, vertexColors: true }),
    woodSide: lambert({ map: tex.wood, color: 0xb59a7a, vertexColors: true }),
    chips: lambert({ map: tex.chips, vertexColors: true }),
  };

  // ------------------------------------------------------------- ciel, soleil, lumiere
  const skyGeo = new THREE.SphereGeometry(1500, 20, 12);
  const top = new THREE.Color(d.sky.top);
  const hor = new THREE.Color(d.sky.horizon);
  const cols: number[] = [];
  const pos = skyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i) / 1500);
    const c = hor.clone().lerp(top, Math.pow(t, 0.45));
    cols.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
  scene.fog = new THREE.Fog(hor, 160, 1300);

  // Soleil devant, un peu a droite et bas (contre-jour des photos)
  const sunDir = new THREE.Vector3(0.45, 0.3, -1).normalize();
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), fog: false, depthWrite: false, transparent: true }));
  sun.position.copy(sunDir).multiplyScalar(1200);
  sun.scale.set(260, 260, 1);
  scene.add(sun);

  scene.add(new THREE.HemisphereLight(0xe4f1ff, 0x8a7a5a, 1.55));
  const light = new THREE.DirectionalLight(0xfff1d6, 1.5);
  light.position.copy(sunDir).multiplyScalar(100);
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-30, 40, 60);
  scene.add(fill);

  // ------------------------------------------------------------- terrain
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < track.n; i += 10) {
    minX = Math.min(minX, track.x[i]); maxX = Math.max(maxX, track.x[i]);
    minZ = Math.min(minZ, track.z[i]); maxZ = Math.max(maxZ, track.z[i]);
  }
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  scene.add(buildGround(track, cx, cz, tex.grass));
  scene.add(buildMountains(cx, cz));

  // ------------------------------------------------------------- plan d'eau
  if (d.lake) scene.add(buildLake(cx + d.lake.x, cz + d.lake.z, d.lake.w, d.lake.d, d.lake.inflatables ?? 6));

  // ------------------------------------------------------------- piste
  scene.add(buildMound(track, mats));
  scene.add(buildLanes(track, mats));
  scene.add(buildKickerSupports(track));
  scene.add(buildFinishLine(track));
  scene.add(buildTapes(track));
  scene.add(buildArch(track, track.startS - 1.2, "KABARE • ROULE LA PISTE", false, mats.woodSide));
  scene.add(buildArch(track, track.finishS, "ARRIVÉE", true, mats.woodSide));

  // ------------------------------------------------------------- pylone
  if (d.pylon) {
    const s = track.moduleStarts[d.pylon.nearModule] + 3;
    const lat = d.pylon.side * (moundEdge(track) + shoulderWidth(track, s) + d.pylon.distance);
    const p = track.posAt(s, lat);
    const pylon = buildPylon();
    pylon.position.set(p.x, 0, p.z);
    pylon.rotation.y = track.headingAt(s) + 0.35;
    scene.add(pylon);
  }

  // ------------------------------------------------------------- arbres, buissons, camionnette
  scene.add(buildLandmarks(track, d.landmarks, cx, cz));

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
//  Sol

function buildGround(track: Track, cx: number, cz: number, grassTex: THREE.CanvasTexture): THREE.Group {
  const g = new THREE.Group();
  // Grand fond d'herbe
  const far = grassTex.clone();
  far.needsUpdate = true;
  far.repeat.set(400, 400);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), lambert({ map: far, color: 0xc8d8a8 }));
  outer.rotation.x = -Math.PI / 2;
  outer.position.set(cx, -0.12, cz);
  g.add(outer);

  // Zone peinte autour de la piste : herbe, terre tassee, chemin de gravier
  const S = 380;
  const px = 2048;
  const k = px / S;
  const X = (x: number) => (x - (cx - S / 2)) * k;
  const Z = (z: number) => (z - (cz - S / 2)) * k;
  const map = paintedTexture(px, (ctx) => {
    const pat = ctx.createPattern(grassTex.image as HTMLCanvasElement, "repeat")!;
    pat.setTransform(new DOMMatrix().scale(0.16));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, px, px);
    // Taches d'herbe seche
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(${170 + hash(i) * 30},${165 + hash(i + 1) * 20},90,${0.12 + hash(i + 2) * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(hash(i * 3) * px, hash(i * 7) * px, 20 + hash(i * 11) * 70, 10 + hash(i * 13) * 40, hash(i) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const stroke = (lat: number, width: number, color: string, blur: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width * k;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.filter = blur ? `blur(${blur}px)` : "none";
      ctx.beginPath();
      const P = { x: 0, z: 0 };
      for (let s = -4; s <= track.length + 4; s += 1) {
        track.posAt(Math.min(Math.max(s, 0), track.length), lat, P);
        if (s === -4) ctx.moveTo(X(P.x), Z(P.z));
        else ctx.lineTo(X(P.x), Z(P.z));
      }
      ctx.stroke();
      ctx.restore();
    };
    // Terre tassee et cailloux autour de la butte
    stroke(0, (moundEdge(track) + 9) * 2, "rgba(150,132,104,0.9)", 18);
    stroke(0, (moundEdge(track) + 5) * 2, "rgba(140,124,100,0.95)", 6);
    // Chemin pieton en gravier blanc (vue drone)
    stroke(-24, 2.4, "rgba(210,204,190,0.95)", 2);
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(S, S), lambert({ map }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.04, cz);
  g.add(ground);
  return g;
}

function buildMountains(cx: number, cz: number): THREE.Group {
  const g = new THREE.Group();
  const ridge = (radius: number, color: number, hMin: number, hMax: number, seed: number) => {
    const verts: number[] = [];
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const noise =
        Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 7 + seed * 2) * 0.3 + Math.sin(a * 17 + seed * 3) * 0.2;
      // Le Luberon : plus haut devant (vers -Z)
      const front = Math.max(0, -Math.cos(a));
      const h = hMin + (hMax - hMin) * (0.5 + 0.5 * noise) * (0.45 + 0.55 * front);
      const x = cx + Math.sin(a) * radius;
      const z = cz + Math.cos(a) * radius;
      verts.push(x, -10, z, x, h, z);
    }
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })));
  };
  ridge(1050, 0x9fb3c8, 40, 150, 2);
  ridge(800, 0x7e9456, 10, 45, 5);
  return g;
}

function buildLake(x: number, z: number, w: number, dd: number, inflatables: number): THREE.Group {
  const g = new THREE.Group();
  const shore = new THREE.Mesh(new THREE.CircleGeometry(1, 40), lambert({ color: 0x8f8a6e }));
  shore.rotation.x = -Math.PI / 2;
  shore.scale.set(w / 2 + 4, dd / 2 + 4, 1);
  shore.position.set(x, 0.01, z);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), lambert({ color: 0x4a9fd0, emissive: 0x0e3554 }));
  water.rotation.x = -Math.PI / 2;
  water.scale.set(w / 2, dd / 2, 1);
  water.position.set(x, 0.05, z);
  g.add(shore, water);

  // Parc aquatique gonflable (bleu, jaune, blanc), aligne pres de la rive
  const parts: THREE.BufferGeometry[] = [];
  const colors = [new THREE.Color("#1f7fe0"), new THREE.Color("#f6c700"), new THREE.Color("#f2f2f2"), new THREE.Color("#1f7fe0")];
  for (let i = 0; i < inflatables; i++) {
    const kind = i % 3;
    let geo: THREE.BufferGeometry;
    if (kind === 0) geo = new THREE.BoxGeometry(7, 1.2, 2.2);
    else if (kind === 1) {
      geo = new THREE.CylinderGeometry(0.2, 2.2, 3.6, 4);
      geo.rotateY(Math.PI / 4);
    } else geo = new THREE.BoxGeometry(2.4, 2.2, 2.4);
    const px = x - w * 0.25 + i * (w * 0.5) / Math.max(1, inflatables - 1);
    const pz = z + dd * 0.33 + Math.sin(i * 1.7) * 5;
    geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(px, 0.6, pz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.4), new THREE.Vector3(1, 1, 1)));
    paint(geo, colors[i % colors.length]);
    parts.push(geo);
  }
  g.add(new THREE.Mesh(mergeGeometries(parts), lambert({ vertexColors: true, flatShading: true })));
  return g;
}

// =============================================================================
//  Butte et lignes

interface Builder {
  pos: number[];
  uv: number[];
  col: number[];
  buckets: Map<THREE.Material, number[]>;
}
const newBuilder = (): Builder => ({ pos: [], uv: [], col: [], buckets: new Map() });

function quad(b: Builder, m: THREE.Material, a: number, c: number, e: number, f: number) {
  if (!b.buckets.has(m)) b.buckets.set(m, []);
  b.buckets.get(m)!.push(a, e, c, c, e, f);
}

function toMesh(b: Builder): THREE.Mesh {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(b.pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(b.col, 3));
  const idx: number[] = [];
  const materials: THREE.Material[] = [];
  b.buckets.forEach((list, m) => {
    g.addGroup(idx.length, list.length, materials.length);
    materials.push(m);
    idx.push(...list);
  });
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, materials.map((m) => {
    (m as THREE.MeshLambertMaterial).side = THREE.DoubleSide;
    return m;
  }));
}

function sampleList(track: Track, step: number): number[] {
  const list: number[] = [];
  for (let s = 0; s <= track.length; s += step) list.push(s);
  // Levres et debuts de kickers nets
  for (const f of track.features) if (f.kind === "jump") list.push(f.s - 0.01, f.s + 0.01);
  track.def.modules.forEach((m, i) => {
    if (m.type === "kicker") list.push(track.moduleStarts[i] - 0.01, track.moduleStarts[i] + 0.01);
  });
  return list.sort((a, b) => a - b);
}

function buildMound(track: Track, mats: Mats): THREE.Mesh {
  const b = newBuilder();
  const list = sampleList(track, 0.5);
  const e = moundEdge(track);
  const P = { x: 0, z: 0 };
  const per = 6;
  list.forEach((s, row) => {
    const h = moundTop(track, s);
    const sh = shoulderWidth(track, s);
    const lats = [-e - sh, -e, -e / 3, e / 3, e, e + sh];
    lats.forEach((lat, k) => {
      track.posAt(s, lat, P);
      const outer = k === 0 || k === per - 1;
      b.pos.push(P.x, outer ? -0.06 : h, P.z);
      b.uv.push(lat / 2.2, s / 2.2);
      // Touffes d'herbe dans le gravier des talus
      const weed = outer ? 0 : hash(Math.floor(s / 1.5) * 13 + k) > 0.82 ? 1 : 0;
      const n = 0.9 + hash(row * 7 + k) * 0.12;
      if (weed) b.col.push(0.55, 0.85, 0.4);
      else b.col.push(n, n, n);
    });
    if (row > 0) {
      const kind = sampleKind(track, s);
      const a0 = (row - 1) * per;
      const b0 = row * per;
      for (let k = 0; k < per - 1; k++) {
        const shoulder = k === 0 || k === per - 2;
        const m = kind === "start" ? (shoulder ? mats.grass : mats.chips) : shoulder ? mats.gravel : mats.dirt;
        quad(b, m, a0 + k, a0 + k + 1, b0 + k, b0 + k + 1);
      }
    }
  });
  return toMesh(b);
}

function buildLanes(track: Track, mats: Mats): THREE.Mesh {
  const b = newBuilder();
  const list = sampleList(track, 0.25);
  const w = track.laneWidth;
  const cols = 7;
  const stride = cols + 4;
  const P = { x: 0, z: 0 };
  let base = 0;
  for (const lane of [-1, 1] as const) {
    const c0 = track.laneCenter(lane);
    list.forEach((s, row) => {
      const kind = sampleKind(track, s);
      const wood = track.wood[track.index(s)] === 1;
      const floor = kind === "wood" ? moundTop(track, s) : track.heightAt(s) - 0.02;
      // Surface (cols points)
      for (let k = 0; k < cols; k++) {
        const u = -w / 2 + (w * k) / (cols - 1);
        track.posAt(s, c0 + u, P);
        b.pos.push(P.x, track.surfaceY(s, u) + 0.03, P.z);
        b.uv.push(wood ? (u + w / 2) / w : u / 2, wood ? s / 2.2 : s / 2);
        // Traces de roues plus sombres au centre
        const rut = !wood && Math.abs(u - 0.15) < 0.3 ? 0.86 : 1;
        const n = rut * (0.93 + hash(row * 13 + k) * 0.1);
        b.col.push(n, n, n);
      }
      // Jupes : haut et bas de chaque cote
      for (const edge of [-1, 1]) {
        const u = (edge * w) / 2;
        track.posAt(s, c0 + u, P);
        const yTop = track.surfaceY(s, u) + 0.03;
        b.pos.push(P.x, yTop, P.z, P.x, floor, P.z);
        b.uv.push(s / 2, yTop / 2, s / 2, floor / 2);
        const sc = wood ? 0.8 : 0.72;
        b.col.push(sc, sc, sc, sc * 0.8, sc * 0.8, sc * 0.8);
      }
      if (row > 0) {
        const a0 = base + (row - 1) * stride;
        const b0 = base + row * stride;
        const surf = wood ? mats.wood : kind === "start" ? mats.chips : mats.dirt;
        for (let k = 0; k < cols - 1; k++) quad(b, surf, a0 + k, a0 + k + 1, b0 + k, b0 + k + 1);
        const side = wood ? mats.woodSide : mats.dirt;
        for (const j of [cols, cols + 2]) quad(b, side, a0 + j, a0 + j + 1, b0 + j, b0 + j + 1);
      }
    });
    base += list.length * stride;
  }
  return toMesh(b);
}

/** Montants et traverses sous les kickers en bois */
function buildKickerSupports(track: Track): THREE.Mesh {
  const parts: THREE.BufferGeometry[] = [];
  const P = { x: 0, z: 0 };
  track.def.modules.forEach((m, i) => {
    if (m.type !== "kicker") return;
    const s0 = track.moduleStarts[i];
    const floor = track.heightAt(s0);
    for (const lane of [-1, 1] as const) {
      for (let s = s0 + 0.6; s <= s0 + m.length; s += 0.8) {
        for (const edge of [-1, 1]) {
          const u = edge * (track.laneWidth / 2 - 0.06);
          const top = track.surfaceY(s, u);
          if (top - floor < 0.15) continue;
          track.posAt(s, track.laneCenter(lane) + u, P);
          const geo = new THREE.BoxGeometry(0.12, top - floor, 0.12);
          geo.translate(P.x, floor + (top - floor) / 2, P.z);
          parts.push(geo);
        }
      }
      // Traverse arriere sous la levre
      const sl = s0 + m.length - 0.08;
      const top = track.heightAt(sl);
      const a = track.posAt(sl, track.laneCenter(lane) - track.laneWidth / 2);
      const bb = track.posAt(sl, track.laneCenter(lane) + track.laneWidth / 2);
      const geo = new THREE.BoxGeometry(track.laneWidth, 0.14, 0.14);
      geo.rotateY(track.headingAt(sl));
      geo.translate((a.x + bb.x) / 2, top - 0.12, (a.z + bb.z) / 2);
      parts.push(geo);
    }
  });
  if (!parts.length) return new THREE.Mesh();
  return new THREE.Mesh(mergeGeometries(parts), lambert({ color: 0x9a7448 }));
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

// =============================================================================
//  Depart, arrivee

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

function buildArch(track: Track, s: number, text: string, checker: boolean, postMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const half = track.laneSpacing / 2 + track.laneWidth / 2 + 0.6;
  const h = track.heightAt(s);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), postMat);
    post.position.set(side * half, 1.8, 0);
    g.add(post);
  }
  const bt = brandTexture(text, checker);
  const face = new THREE.MeshBasicMaterial({ map: bt });
  const banner = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 0.4, 0.9, 0.12), [postMat, postMat, postMat, postMat, face, face]);
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

// =============================================================================
//  Pylone haute tension + palissade

function beam(parts: THREE.BufferGeometry[], a: THREE.Vector3, b: THREE.Vector3, t = 0.12) {
  const len = a.distanceTo(b);
  const geo = new THREE.BoxGeometry(t, len, t);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  geo.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
  parts.push(geo);
}

function buildPylon(): THREE.Group {
  const parts: THREE.BufferGeometry[] = [];
  const H = 32;
  const baseHalf = 3.4;
  const topHalf = 0.9;
  const corner = (y: number, sx: number, sz: number) => {
    const half = baseHalf + (topHalf - baseHalf) * Math.min(1, y / (H * 0.75));
    return new THREE.Vector3(sx * half, y, sz * half);
  };
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const levels = [0, 4, 8, 12, 16, 20, 24, 28, H];
  for (const [sx, sz] of corners)
    for (let i = 0; i < levels.length - 1; i++) beam(parts, corner(levels[i], sx, sz), corner(levels[i + 1], sx, sz), 0.22);
  for (let i = 1; i < levels.length; i++) {
    for (let c = 0; c < 4; c++) {
      const [ax, az] = corners[c];
      const [bx, bz] = corners[(c + 1) % 4];
      beam(parts, corner(levels[i], ax, az), corner(levels[i], bx, bz));
      beam(parts, corner(levels[i - 1], ax, az), corner(levels[i], bx, bz), 0.08);
      beam(parts, corner(levels[i - 1], bx, bz), corner(levels[i], ax, az), 0.08);
    }
  }
  const arms = [21, 26.5];
  for (const y of arms) {
    const w = y === arms[0] ? 9 : 7;
    beam(parts, new THREE.Vector3(-w, y, 0), new THREE.Vector3(w, y, 0), 0.3);
    beam(parts, new THREE.Vector3(-w, y, 0), corner(y + 2.5, -1, 0), 0.1);
    beam(parts, new THREE.Vector3(w, y, 0), corner(y + 2.5, 1, 0), 0.1);
    for (const x of [-w + 0.3, w - 0.3]) beam(parts, new THREE.Vector3(x, y, 0), new THREE.Vector3(x, y - 1.8, 0), 0.2);
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(mergeGeometries(parts), lambert({ color: 0x55605a })));

  // Cables avec leur fleche
  const wire = new THREE.LineBasicMaterial({ color: 0x2a2a2a });
  for (const y of arms) {
    const w = y === arms[0] ? 8.7 : 6.7;
    for (const x of [-w, w]) {
      for (const dir of [-1, 1]) {
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 20; k++) {
          const t = k / 20;
          pts.push(new THREE.Vector3(x, y - 1.8 - Math.sin(t * Math.PI) * 7, dir * t * 320));
        }
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
      }
    }
  }

  // Palissade en bois autour du pied
  const fence: THREE.BufferGeometry[] = [];
  const R = 5;
  for (let side = 0; side < 4; side++) {
    for (let k = -R; k < R; k += 0.22) {
      const geo = new THREE.BoxGeometry(0.18, 1.8 + hash(k * 9 + side) * 0.15, 0.06);
      const x = side % 2 === 0 ? k : side === 1 ? R : -R;
      const z = side % 2 === 0 ? (side === 0 ? -R : R) : k;
      if (side % 2 === 1) geo.rotateY(Math.PI / 2);
      geo.translate(x, 0.9, z);
      fence.push(geo);
    }
  }
  g.add(new THREE.Mesh(mergeGeometries(fence), lambert({ color: 0x6e4c2c })));
  return g;
}

// =============================================================================
//  Vegetation et objets (une seule geometrie fusionnee, couleurs par sommet)

function paint(geo: THREE.BufferGeometry, color: THREE.Color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([color.r, color.g, color.b], i * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  if (geo.index) {
    const ni = geo.toNonIndexed();
    geo.copy(ni);
  }
  geo.deleteAttribute("uv");
}

function part(geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rotY = 0, rotX = 0) {
  geo.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0)),
      new THREE.Vector3(sx, sy, sz),
    ),
  );
  paint(geo, new THREE.Color(color));
  return geo;
}

function addLandmark(parts: THREE.BufferGeometry[], kind: Landmark["kind"], x: number, z: number, s: number, rot: number, seed: number) {
  const r = (k: number) => hash(seed * 31 + k);
  switch (kind) {
    case "pine": {
      // Pin parasol : tronc haut et penche, couronne large et plate
      const lean = (r(1) - 0.5) * 0.25;
      parts.push(part(new THREE.CylinderGeometry(0.22 * s, 0.38 * s, 8 * s, 6), "#5a4030", x, 4 * s, z, 1, 1, 1, 0, lean));
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + r(k);
        const rr = k === 0 ? 0 : 2.6 * s;
        parts.push(part(new THREE.IcosahedronGeometry(2.4 * s, 1), k % 2 ? "#3f5f2b" : "#4a6c31", x + Math.cos(a) * rr + lean * 8 * s, (8.4 + r(k + 9)) * s, z + Math.sin(a) * rr, 1.2, 0.45, 1.2, a));
      }
      break;
    }
    case "poplar":
      parts.push(part(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 3 * s, 5), "#5a4636", x, 1.5 * s, z));
      parts.push(part(new THREE.IcosahedronGeometry(1, 1), "#4e7a32", x, 8 * s, z, 1.9 * s, 7 * s, 1.9 * s, rot));
      parts.push(part(new THREE.IcosahedronGeometry(1, 0), "#5f8c3a", x + 0.4 * s, 10 * s, z, 1.3 * s, 4 * s, 1.3 * s, rot));
      break;
    case "round":
      parts.push(part(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 3 * s, 5), "#5d4433", x, 1.5 * s, z));
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + r(k);
        parts.push(part(new THREE.IcosahedronGeometry(2.2 * s, 1), k % 2 ? "#5b8a33" : "#6a9a3c", x + Math.cos(a) * 1.4 * s, (4.6 + r(k) * 1.2) * s, z + Math.sin(a) * 1.4 * s, 1, 0.9, 1, a));
      }
      break;
    case "willow":
      parts.push(part(new THREE.CylinderGeometry(0.3 * s, 0.45 * s, 3.4 * s, 5), "#6a553f", x, 1.7 * s, z));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + r(k);
        parts.push(part(new THREE.IcosahedronGeometry(2 * s, 1), k % 2 ? "#9cbf55" : "#86ad47", x + Math.cos(a) * 2 * s, (4 + r(k + 3)) * s, z + Math.sin(a) * 2 * s, 1, 1.25, 1, a));
      }
      break;
    case "bush":
      for (let k = 0; k < 3; k++)
        parts.push(part(new THREE.IcosahedronGeometry((0.8 + r(k) * 0.5) * s, 0), k % 2 ? "#4f7a2c" : "#5e8a34", x + (k - 1) * 0.9 * s, 0.6 * s, z + (r(k + 5) - 0.5) * s, 1, 0.8, 1, r(k) * 3));
      break;
    case "van": {
      // Camionnette blanche
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      const at = (lx: number, lz: number): [number, number] => [x + lx * c + lz * sn, z - lx * sn + lz * c];
      let p = at(0, 0.4);
      parts.push(part(new THREE.BoxGeometry(1.9, 1.7, 3.4), "#f1f1f1", p[0], 1.25, p[1], 1, 1, 1, rot));
      p = at(0, -1.7);
      parts.push(part(new THREE.BoxGeometry(1.9, 1.2, 1.0), "#f1f1f1", p[0], 1.0, p[1], 1, 1, 1, rot));
      p = at(0, -1.25);
      parts.push(part(new THREE.BoxGeometry(1.86, 0.6, 0.1), "#26323d", p[0], 1.75, p[1], 1, 1, 1, rot, -0.5));
      for (const lx of [-0.95, 0.95])
        for (const lz of [-1.4, 1.5]) {
          p = at(lx, lz);
          parts.push(part(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 10).rotateZ(Math.PI / 2), "#1b1b1b", p[0], 0.38, p[1], 1, 1, 1, rot));
        }
      p = at(0, 0.4);
      parts.push(part(new THREE.BoxGeometry(1.2, 0.12, 2.2), "#333333", p[0], 2.16, p[1], 1, 1, 1, rot));
      break;
    }
  }
}

function buildLandmarks(track: Track, list: Landmark[], cx: number, cz: number): THREE.Mesh {
  const parts: THREE.BufferGeometry[] = [];
  const centers: [number, number][] = [];
  for (let i = 0; i < track.n; i += 8) centers.push([track.x[i], track.z[i]]);
  const clear = (x: number, z: number, r: number) => centers.every(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 > r * r);
  list.forEach((l, i) => {
    let x: number;
    let z: number;
    let rot = hash(i) * 6;
    if (l.nearModule !== undefined) {
      const s = Math.min(track.length, track.moduleStarts[l.nearModule] + (l.along ?? 0));
      const side = l.side ?? 1;
      const lat = side * (barrierLateral(track, s) + (l.distance ?? 6));
      const p = track.posAt(s, lat);
      x = p.x;
      z = p.z;
      rot = track.headingAt(s);
    } else {
      x = cx + (l.x ?? 0);
      z = cz + (l.z ?? 0);
      if (!clear(x, z, 14)) return;
    }
    addLandmark(parts, l.kind, x, z, l.s ?? 1, rot, i + 1);
  });
  if (!parts.length) return new THREE.Mesh();
  return new THREE.Mesh(mergeGeometries(parts), lambert({ vertexColors: true, flatShading: true }));
}

// =============================================================================
//  Barrieres

function buildBarriers(track: Track): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(2.2, 1.0, 0.06);
  geo.translate(0, 0.5, 0);
  const items: { x: number; y: number; z: number; rot: number }[] = [];
  const banners: { x: number; y: number; z: number; rot: number }[] = [];
  const P = { x: 0, z: 0 };
  for (const zone of track.def.crowd) {
    const s0 = Math.max(track.startS, track.moduleStarts[zone.fromModule]);
    const s1 = zone.toModule + 1 < track.moduleStarts.length ? track.moduleStarts[zone.toModule + 1] : track.length;
    for (const side of zone.side === 0 ? [-1, 1] : [zone.side]) {
      let k = 0;
      for (let s = s0; s < s1; s += 2.3) {
        const lat = side * barrierLateral(track, s);
        track.posAt(s, lat, P);
        const it = { x: P.x, y: moundHeight(track, s, lat), z: P.z, rot: track.headingAt(s) + Math.PI / 2 };
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
  const up = new THREE.Vector3(0, 1, 0);
  items.forEach((it, i) => {
    q.setFromAxisAngle(up, it.rot);
    m.compose(new THREE.Vector3(it.x, it.y, it.z), q, one);
    inst.setMatrixAt(i, m);
  });
  g.add(inst);
  const bgeo = new THREE.PlaneGeometry(2.2, 0.9);
  bgeo.translate(0, 0.5, 0);
  const binst = new THREE.InstancedMesh(bgeo, new THREE.MeshBasicMaterial({ map: brandTexture("KABARE", false) }), banners.length);
  banners.forEach((it, i) => {
    q.setFromAxisAngle(up, it.rot);
    m.compose(new THREE.Vector3(it.x, it.y, it.z), q, one);
    binst.setMatrixAt(i, m);
  });
  g.add(binst);
  return g;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,250,1)");
  grd.addColorStop(0.12, "rgba(255,252,235,0.95)");
  grd.addColorStop(0.3, "rgba(255,240,200,0.35)");
  grd.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
