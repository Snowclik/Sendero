/**
 * IsoWorld.ts
 * Motor de Sendero: vista isométrica fija (estilo dungeon-crawler), mundo de bloques en rejilla.
 *
 * Rendimiento para equipos rurales de gama baja:
 * - Todo lo estático (suelo, árboles, casas) es UN solo InstancedMesh de cubos -> ~3 draw calls.
 * - MeshLambertMaterial (más barato que PBR), sin sombras en tiempo real (manchas falsas bajo árboles).
 * - pixelRatio limitado a 1.5; el navegador pausa el bucle si la pestaña no está visible.
 *
 * Controles: clic/toque para caminar (A* en la rejilla), WASD/flechas, rueda para zoom.
 */
import * as THREE from 'three';
import type { MissionId } from '../data/missionsData';

const W = 36;
const D = 28;
const RIVER_X0 = 21; // río: columnas 21..24 (4 bloques = 12 m, 3 m por bloque)
const RIVER_X1 = 24;
const BRIDGE_Z = [16, 17];

export const STATION_TILES: Record<MissionId, { x: number; z: number }> = {
  'mision-1-agua': { x: 17, z: 8 },
  'mision-2-rumor': { x: 10, z: 12 },
  'mision-3-puente': { x: 19, z: 16 },
  'mision-4-bosque': { x: 29, z: 12 },
};
const STATION_ORDER: MissionId[] = ['mision-1-agua', 'mision-2-rumor', 'mision-3-puente', 'mision-4-bosque'];
const START = { x: 6.5, z: 21.5 };

export type StationState = 'locked' | 'open' | 'done';

export interface WorldCallbacks {
  onNear: (id: MissionId | null) => void;
  onInteract: (id: MissionId) => void;
}

// Paleta diurna suave (Low-Arousal): saturación media, sin contrastes agresivos
const C = {
  grass: [0x9ad97a, 0x8fd16e, 0xa3dd84],
  path: 0xead6a6,
  sand: 0xf0e2b6,
  dirt: 0xc49a6c,
  plaza: 0xdedad0,
  trunk: 0x9c6b43,
  leaves: [0x5fbf6a, 0x6cc874, 0x55b463, 0x7fd07f],
  rock: 0xb8bfc6,
  wood: 0xc28a52,
  woodDark: 0x9a6a3c,
  cream: 0xfbf3df,
  roof: 0xd9734e,
  water: 0x6fc7f2,
  sky: 0x38bdf8,
  amber: 0xf59e0b,
  emerald: 0x10b981,
  slate: 0xcbd5e1,
  rose: 0xf43f5e,
};

const idx = (x: number, z: number) => z * W + x;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Box {
  x: number; y: number; z: number; sx: number; sy: number; sz: number; color: number; ry?: number;
}

export class IsoWorld {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private timer = new THREE.Timer();
  private walked = 0; // bloques caminados desde la última lectura
  private raf = 0;
  private cb: WorldCallbacks;

  private blocked = new Uint8Array(W * D); // 1 = no se puede caminar
  private water = new Uint8Array(W * D);
  private bridgeWalkable = false;

  private player = new THREE.Group();
  // Chispa la ardilla: compañera que sigue al jugador
  private squirrel = new THREE.Group();
  private sqTail: THREE.Group | null = null;
  private sqPos = new THREE.Vector3(START.x + 1, 0, START.z + 1);
  private sqHop = 0;
  private sqCheer = 0;
  /** Div posicionado cada frame sobre la cabeza de la ardilla: la UI dibuja ahí su globo. */
  public readonly squirrelAnchor: HTMLDivElement;
  private limbs: { legL: THREE.Mesh; legR: THREE.Mesh; armL: THREE.Mesh; armR: THREE.Mesh } | null = null;
  private pos = new THREE.Vector3(START.x, 0, START.z);
  private path: { x: number; z: number }[] = [];
  private pendingInteract: MissionId | null = null;
  private keys = new Set<string>();
  private walkT = 0;
  private nearId: MissionId | null = null;
  private inputEnabled = true;
  private calm = false;

  private zoom = 12;
  private userZoom = 12; // zoom elegido con la rueda; se restaura al salir de una misión
  private camTarget = new THREE.Vector3(START.x, 0, START.z);
  private focus: MissionId | null = null;
  private camOffset = new THREE.Vector3(1, 1.15, 1).normalize().multiplyScalar(60);

  private objective: MissionId | null = null;
  private beacon: THREE.Group;
  private arrow: THREE.Mesh;
  private moveMarker: THREE.Mesh;
  private rings: Partial<Record<MissionId, THREE.Mesh>> = {};
  private flags: Partial<Record<MissionId, THREE.Mesh>> = {};
  private labels: Partial<Record<MissionId, HTMLDivElement>> = {};
  private stationStates: Record<string, StationState> = {};
  private waterMesh!: THREE.InstancedMesh;

  // Piezas dinámicas de las misiones
  private tankWater!: THREE.Mesh;
  private tankLevel = 0;
  private tankTarget = 0;
  private filters: THREE.Mesh[] = [];
  private gauge!: THREE.Mesh;
  private gaugeTarget = 0;
  private fountainWater!: THREE.Mesh;
  private boardBanner!: THREE.Mesh;
  private beams: THREE.Mesh[] = [];
  private pillars: THREE.Mesh[] = [];
  private rails!: THREE.Group;
  private brokenPlank!: THREE.Mesh;
  private gardenCover!: THREE.Group;

  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private downAt: { x: number; y: number } | null = null;
  private disposers: (() => void)[] = [];
  private mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private unitBox = new THREE.BoxGeometry(1, 1, 1);

  constructor(container: HTMLElement, cb: WorldCallbacks) {
    this.container = container;
    this.cb = cb;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr < 1.5, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0xdff3fb);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa9cf94, 1.9));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.4);
    sun.position.set(0.5, 1, 0.3);
    this.scene.add(sun);

    this.buildWorld();
    this.buildPlayer();
    this.buildSquirrel();
    this.squirrelAnchor = document.createElement('div');
    this.squirrelAnchor.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:15;';
    container.appendChild(this.squirrelAnchor);

    this.beacon = this.buildBeacon();
    this.arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.6, 3).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: C.sky, transparent: true, opacity: 0.85 })
    );
    this.scene.add(this.arrow);
    this.moveMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.38, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    this.moveMarker.visible = false;
    this.scene.add(this.moveMarker);

    this.bindInput();
    this.resize();
    this.loop();
  }

  // ==========================================================================
  // CONSTRUCCIÓN DEL MAPA
  // ==========================================================================
  private buildWorld() {
    const boxes: Box[] = [];
    const rnd = mulberry32(2026);
    const tileType = new Array<string>(W * D).fill('grass');

    // Río
    for (let z = 0; z < D; z++) for (let x = RIVER_X0; x <= RIVER_X1; x++) tileType[idx(x, z)] = 'water';
    // Arena en las orillas
    for (let z = 0; z < D; z++) {
      tileType[idx(RIVER_X0 - 1, z)] = 'sand';
      tileType[idx(RIVER_X1 + 1, z)] = 'sand';
    }

    // Sendero principal: campamento -> tablón -> planta -> puente -> cabaña
    const route = [
      [6, 21], [8, 15], [10, 12], [13, 10], [17, 8], [18, 12], [19, 16], [20, 16],
      [25, 16], [27, 14], [29, 12],
    ];
    for (let i = 0; i < route.length - 1; i++) {
      const [ax, az] = route[i];
      const [bx, bz] = route[i + 1];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(ax + ((bx - ax) * s) / steps);
        const z = Math.round(az + ((bz - az) * s) / steps);
        for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const t = idx(x + dx, z + dz);
          if (tileType[t] !== 'water') tileType[t] = 'path';
        }
      }
    }
    // Plaza del tablón y patio del campamento
    for (let z = 10; z <= 13; z++) for (let x = 8; x <= 12; x++) tileType[idx(x, z)] = 'plaza';
    for (let z = 18; z <= 24; z++) for (let x = 3; x <= 9; x++) if (tileType[idx(x, z)] === 'grass') tileType[idx(x, z)] = 'path';
    // Huerto escolar (tierra)
    for (let z = 11; z <= 13; z++) for (let x = 31; x <= 33; x++) tileType[idx(x, z)] = 'dirt';

    // Zonas protegidas (sin árboles): alrededor de estaciones y campamento
    const clear = new Uint8Array(W * D);
    const clearAround = (cx: number, cz: number, r: number) => {
      for (let z = cz - r; z <= cz + r; z++)
        for (let x = cx - r; x <= cx + r; x++) if (x >= 0 && z >= 0 && x < W && z < D) clear[idx(x, z)] = 1;
    };
    Object.values(STATION_TILES).forEach((s) => clearAround(s.x, s.z, 3));
    clearAround(6, 21, 4);
    clearAround(4, 18, 2);

    // Suelo
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const t = tileType[idx(x, z)];
        if (t === 'water') {
          this.water[idx(x, z)] = 1;
          this.blocked[idx(x, z)] = 1;
          boxes.push({ x: x + 0.5, y: -0.9, z: z + 0.5, sx: 1, sy: 1, sz: 1, color: C.sand });
          continue;
        }
        const jitter = t === 'grass' ? rnd() * 0.05 : 0;
        const color =
          t === 'grass' ? C.grass[Math.floor(rnd() * 3)] : t === 'path' ? C.path : t === 'sand' ? C.sand : t === 'dirt' ? C.dirt : C.plaza;
        boxes.push({ x: x + 0.5, y: -0.5 + jitter, z: z + 0.5, sx: 1, sy: 1, sz: 1, color });
      }
    }

    // Árboles: borde denso + dispersos (semilla fija = mapa idéntico siempre)
    const tree = (x: number, z: number) => {
      this.blocked[idx(x, z)] = 1;
      const h = 0.9 + rnd() * 0.5;
      const leaf = C.leaves[Math.floor(rnd() * C.leaves.length)];
      boxes.push({ x: x + 0.5, y: h / 2, z: z + 0.5, sx: 0.32, sy: h, sz: 0.32, color: C.trunk });
      boxes.push({ x: x + 0.5, y: h + 0.45, z: z + 0.5, sx: 1.05, sy: 0.9, sz: 1.05, color: leaf });
      boxes.push({ x: x + 0.5, y: h + 1.05, z: z + 0.5, sx: 0.65, sy: 0.5, sz: 0.65, color: leaf });
      boxes.push({ x: x + 0.5, y: 0.01, z: z + 0.5, sx: 1.2, sy: 0.02, sz: 1.2, color: 0x7dbd5f }); // sombra falsa
    };
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const t = tileType[idx(x, z)];
        if (t !== 'grass' || clear[idx(x, z)]) continue;
        const border = x < 2 || z < 2 || x >= W - 2 || z >= D - 2;
        if (border ? rnd() < 0.85 : rnd() < 0.1) tree(x, z);
        else if (!border && rnd() < 0.03) {
          this.blocked[idx(x, z)] = 1;
          boxes.push({ x: x + 0.5, y: 0.25, z: z + 0.5, sx: 0.7, sy: 0.5, sz: 0.6, color: C.rock, ry: rnd() });
        } else if (!border && rnd() < 0.06) {
          boxes.push({ x: x + 0.3 + rnd() * 0.4, y: 0.12, z: z + 0.3 + rnd() * 0.4, sx: 0.18, sy: 0.18, sz: 0.18, color: [0xfde68a, 0xfbcfe8, 0xffffff][Math.floor(rnd() * 3)] });
        }
      }
    }
    // Bordes del mapa siempre bloqueados
    for (let x = 0; x < W; x++) { this.blocked[idx(x, 0)] = 1; this.blocked[idx(x, D - 1)] = 1; }
    for (let z = 0; z < D; z++) { this.blocked[idx(0, z)] = 1; this.blocked[idx(W - 1, z)] = 1; }

    this.buildCamp(boxes);
    this.buildWaterPlant(boxes);
    this.buildBoard(boxes);
    this.buildCabin(boxes);
    this.buildBridgeParts();

    // Suelo exterior infinito para que no se vea el vacío
    const outside = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x86c96a }));
    outside.position.set(W / 2, -1.0, D / 2); // al fondo de los bloques: no tapa el río
    this.scene.add(outside);

    // Un solo InstancedMesh para todo lo estático
    const inst = new THREE.InstancedMesh(this.unitBox, this.mat, boxes.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    boxes.forEach((b, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.ry ?? 0);
      m.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.sx, b.sy, b.sz));
      inst.setMatrixAt(i, m);
      inst.setColorAt(i, col.setHex(b.color));
    });
    this.scene.add(inst);

    // Agua (transparente, aparte)
    const waterTiles: number[] = [];
    this.water.forEach((v, i) => v && waterTiles.push(i));
    this.waterMesh = new THREE.InstancedMesh(
      this.unitBox,
      new THREE.MeshLambertMaterial({ color: C.water, transparent: true, opacity: 0.82 }),
      waterTiles.length
    );
    waterTiles.forEach((t, i) => {
      m.compose(new THREE.Vector3((t % W) + 0.5, -0.35, Math.floor(t / W) + 0.5), new THREE.Quaternion(), new THREE.Vector3(1, 0.3, 1));
      this.waterMesh.setMatrixAt(i, m);
    });
    this.scene.add(this.waterMesh);

    // Anillos de estación + banderas + etiquetas HTML
    for (const id of STATION_ORDER) {
      const s = STATION_TILES[id];
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 0.95, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: C.slate, transparent: true, opacity: 0.9 })
      );
      ring.position.set(s.x + 0.5, 0.03, s.z + 0.5);
      this.scene.add(ring);
      this.rings[id] = ring;

      const flag = this.box(0.5, 0.32, 0.04, C.emerald);
      flag.position.set(s.x + 0.85, 1.35, s.z - 0.2);
      const pole = this.box(0.05, 1.5, 0.05, 0xffffff);
      pole.position.set(-0.27, -0.6, 0);
      flag.add(pole);
      flag.visible = false;
      this.scene.add(flag);
      this.flags[id] = flag;

      const label = document.createElement('div');
      label.className = 'iso-label';
      label.style.cssText =
        'position:absolute;left:0;top:0;pointer-events:none;white-space:nowrap;font:800 13px system-ui,sans-serif;padding:5px 12px;border-radius:14px;border:3px solid #fff;box-shadow:0 4px 0 rgba(146,112,52,.22);transform:translate(-50%,-100%);';
      this.container.appendChild(label);
      this.labels[id] = label;
    }
  }

  private box(sx: number, sy: number, sz: number, color: number, opts: Partial<THREE.MeshLambertMaterialParameters> = {}) {
    return new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshLambertMaterial({ color, ...opts }));
  }

  private block(x0: number, z0: number, x1: number, z1: number) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) this.blocked[idx(x, z)] = 1;
  }

  private buildCamp(boxes: Box[]) {
    // Carpas del albergue (pirámides de 4 lados)
    const tents: [number, number, number][] = [[3.5, 23.5, C.sky], [8.5, 24, C.amber], [3.5, 20, 0x2dd4bf]];
    for (const [x, z, color] of tents) {
      const tent = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 4), new THREE.MeshLambertMaterial({ color }));
      tent.rotation.y = Math.PI / 4;
      tent.position.set(x, 0.7, z);
      this.scene.add(tent);
      this.blocked[idx(Math.floor(x), Math.floor(z))] = 1;
    }
    // Fuente del campamento (seca hasta restaurar la planta de agua)
    boxes.push({ x: 4.5, y: 0.2, z: 17.5, sx: 1.6, sy: 0.4, sz: 1.6, color: C.rock });
    this.fountainWater = this.box(1.2, 0.1, 1.2, C.water);
    this.fountainWater.position.set(4.5, 0.42, 17.5);
    this.fountainWater.visible = false;
    this.scene.add(this.fountainWater);
    this.block(4, 17, 4, 17);
    // Panel solar del campamento (los 3 soles del día)
    boxes.push({ x: 8.5, y: 0.6, z: 19.5, sx: 0.12, sy: 1.2, sz: 0.12, color: 0x94a3b8 });
    boxes.push({ x: 8.5, y: 1.25, z: 19.5, sx: 1.1, sy: 0.08, sz: 0.8, color: 0x1d4ed8, ry: 0.3 });
    this.block(8, 19, 8, 19);
  }

  private buildWaterPlant(boxes: Box[]) {
    // Tanque de 2x2 sobre base, en x 16..18, z 4..6
    boxes.push({ x: 17, y: 0.1, z: 5, sx: 2.4, sy: 0.2, sz: 2.4, color: C.rock });
    this.block(16, 4, 17, 5);
    const glass = this.box(2, 2.2, 2, 0xe0f2fe, { transparent: true, opacity: 0.35 });
    glass.position.set(17, 1.3, 5);
    this.scene.add(glass);
    this.tankWater = this.box(1.9, 1, 1.9, C.water, { transparent: true, opacity: 0.9 });
    this.tankWater.position.set(17, 0.2, 5);
    this.tankWater.scale.y = 0.001;
    this.scene.add(this.tankWater);
    // Marca de 24 litros (franja ámbar)
    const mark = this.box(2.04, 0.06, 2.04, C.amber);
    mark.position.set(17, 0.2 + 1.6, 5);
    this.scene.add(mark);
    // Tubería al río
    boxes.push({ x: 19.5, y: 0.35, z: 5, sx: 3.2, sy: 0.25, sz: 0.25, color: 0x94a3b8 });
    this.block(18, 5, 20, 5);
    // 6 filtros en fila frente al tanque
    for (let i = 0; i < 6; i++) {
      const f = this.box(0.42, 0.42, 0.42, C.slate);
      f.position.set(15.15 + i * 0.75, 0.21, 6.75);
      this.scene.add(f);
      this.filters.push(f);
    }
    this.block(15, 6, 18, 6);
    // Manómetro (barra que sube con la presión)
    boxes.push({ x: 18.6, y: 0.9, z: 3.9, sx: 0.5, sy: 1.8, sz: 0.12, color: 0xffffff });
    this.gauge = this.box(0.3, 1, 0.14, C.amber);
    this.gauge.position.set(18.6, 0.1, 3.95);
    this.gauge.scale.y = 0.001;
    this.scene.add(this.gauge);
    this.block(18, 3, 18, 3);
  }

  private buildBoard(boxes: Box[]) {
    // Tablón del pueblo con 3 mensajes
    boxes.push({ x: 9.3, y: 0.8, z: 10.5, sx: 0.15, sy: 1.6, sz: 0.15, color: C.woodDark });
    boxes.push({ x: 11.7, y: 0.8, z: 10.5, sx: 0.15, sy: 1.6, sz: 0.15, color: C.woodDark });
    boxes.push({ x: 10.5, y: 1.3, z: 10.5, sx: 2.6, sy: 1.0, sz: 0.12, color: C.wood });
    boxes.push({ x: 9.8, y: 1.35, z: 10.58, sx: 0.5, sy: 0.6, sz: 0.04, color: 0xfef9c3, ry: 0.06 });
    boxes.push({ x: 10.5, y: 1.3, z: 10.58, sx: 0.5, sy: 0.6, sz: 0.04, color: 0xffffff });
    boxes.push({ x: 11.2, y: 1.35, z: 10.58, sx: 0.5, sy: 0.6, sz: 0.04, color: 0xfecdd3, ry: -0.05 });
    this.block(9, 10, 11, 10);
    this.boardBanner = this.box(2.6, 0.3, 0.14, C.emerald);
    this.boardBanner.position.set(10.5, 1.95, 10.5);
    this.boardBanner.visible = false;
    this.scene.add(this.boardBanner);
  }

  private buildCabin(boxes: Box[]) {
    // Cabaña de la abuela en x 29..31, z 8..10
    boxes.push({ x: 30.5, y: 0.9, z: 9, sx: 3, sy: 1.8, sz: 2.4, color: C.cream });
    boxes.push({ x: 30.5, y: 2.05, z: 9, sx: 3.3, sy: 0.5, sz: 2.7, color: C.roof });
    boxes.push({ x: 30.5, y: 2.5, z: 9, sx: 2.4, sy: 0.4, sz: 1.8, color: C.roof });
    boxes.push({ x: 30.5, y: 0.55, z: 10.22, sx: 0.6, sy: 1.1, sz: 0.06, color: C.woodDark });
    boxes.push({ x: 29.6, y: 1.1, z: 10.22, sx: 0.45, sy: 0.4, sz: 0.06, color: 0xbae6fd });
    this.block(29, 8, 31, 9);
    // Brotes del huerto
    for (let z = 11; z <= 13; z++)
      for (let x = 31; x <= 33; x++) boxes.push({ x: x + 0.5, y: 0.12, z: z + 0.5, sx: 0.15, sy: 0.25, sz: 0.15, color: 0x65a30d });
    // Cobertura (aparece al restaurar): hojas de plátano + fila de piedras
    this.gardenCover = new THREE.Group();
    for (let z = 11; z <= 13; z++) {
      const leaf = this.box(3, 0.06, 0.8, 0x4ade80);
      leaf.position.set(32.5, 0.28, z + 0.5);
      this.gardenCover.add(leaf);
    }
    for (let x = 31; x <= 33; x++) {
      const stone = this.box(0.8, 0.35, 0.4, C.rock);
      stone.position.set(x + 0.5, 0.18, 14.25);
      this.gardenCover.add(stone);
    }
    this.gardenCover.visible = false;
    this.scene.add(this.gardenCover);
  }

  private buildBridgeParts() {
    const zc = BRIDGE_Z[0] + 1; // centro z del puente (2 bloques de ancho)
    for (let i = 0; i < 6; i++) {
      const b = this.box(0.96, 0.16, 2, C.wood);
      b.position.set(RIVER_X0 + i + 0.5, -0.05, zc);
      b.visible = false;
      this.scene.add(b);
      this.beams.push(b);
    }
    for (let i = 0; i < 4; i++) {
      const p = this.box(0.4, 1, 2.5, C.woodDark); // más ancho que el tablero: asoma por los lados
      p.visible = false;
      this.scene.add(p);
      this.pillars.push(p);
    }
    this.rails = new THREE.Group();
    for (const z of [BRIDGE_Z[0] + 0.05, BRIDGE_Z[1] + 0.95]) {
      const rail = this.box(4, 0.08, 0.08, C.woodDark);
      rail.position.set(RIVER_X0 + 2, 0.6, z);
      this.rails.add(rail);
      for (let k = 0; k <= 4; k++) {
        const post = this.box(0.1, 0.65, 0.1, C.woodDark);
        post.position.set(RIVER_X0 + k, 0.3, z);
        this.rails.add(post);
      }
    }
    this.rails.visible = false;
    this.scene.add(this.rails);
    this.brokenPlank = this.box(0.9, 0.12, 1.6, C.wood);
    this.brokenPlank.position.set(RIVER_X0 + 0.6, -0.12, zc);
    this.brokenPlank.rotation.set(0.15, 0.5, 0.25);
    this.scene.add(this.brokenPlank);
  }

  private buildPlayer() {
    const mk = (sx: number, sy: number, sz: number, color: number, x: number, y: number, z: number, pivotTop = false) => {
      const g = new THREE.BoxGeometry(sx, sy, sz);
      if (pivotTop) g.translate(0, -sy / 2, 0);
      const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      this.player.add(mesh);
      return mesh;
    };
    const legL = mk(0.2, 0.45, 0.22, 0x475569, -0.12, 0.45, 0, true);
    const legR = mk(0.2, 0.45, 0.22, 0x475569, 0.12, 0.45, 0, true);
    mk(0.5, 0.5, 0.3, 0x0ea5e9, 0, 0.7, 0); // túnica cielo
    mk(0.36, 0.38, 0.14, C.amber, 0, 0.72, -0.21); // mochila
    const armL = mk(0.15, 0.45, 0.18, 0x0284c7, -0.33, 0.92, 0, true);
    const armR = mk(0.15, 0.45, 0.18, 0x0284c7, 0.33, 0.92, 0, true);
    mk(0.42, 0.42, 0.42, 0xf2c9a0, 0, 1.17, 0); // cabeza
    mk(0.46, 0.14, 0.46, 0x5b3a22, 0, 1.4, 0); // cabello
    mk(0.08, 0.08, 0.02, 0x1e293b, -0.09, 1.2, 0.215); // ojos
    mk(0.08, 0.08, 0.02, 0x1e293b, 0.09, 1.2, 0.215);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 })
    );
    shadow.position.y = 0.02;
    this.player.add(shadow);
    this.limbs = { legL, legR, armL, armR };
    this.player.position.copy(this.pos);
    this.scene.add(this.player);
  }

  private buildSquirrel() {
    const m = (sx: number, sy: number, sz: number, color: number, x: number, y: number, z: number, parent: THREE.Object3D = this.squirrel) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const orange = 0xf08c3c;
    m(0.3, 0.28, 0.42, orange, 0, 0.2, 0); // cuerpo
    m(0.2, 0.18, 0.05, 0xfde7c8, 0, 0.2, 0.21); // pancita
    m(0.3, 0.28, 0.28, orange, 0, 0.44, 0.16); // cabeza
    m(0.18, 0.12, 0.06, 0xfde7c8, 0, 0.4, 0.31); // hocico
    m(0.05, 0.05, 0.02, 0x3b2a1a, -0.07, 0.49, 0.31); // ojos
    m(0.05, 0.05, 0.02, 0x3b2a1a, 0.07, 0.49, 0.31);
    m(0.07, 0.12, 0.05, orange, -0.09, 0.62, 0.14); // orejas
    m(0.07, 0.12, 0.05, orange, 0.09, 0.62, 0.14);
    const tail = new THREE.Group();
    tail.position.set(0, 0.2, -0.22);
    m(0.2, 0.36, 0.18, 0xe8833a, 0, 0.2, -0.05, tail);
    m(0.22, 0.24, 0.2, 0xf6b26b, 0, 0.44, -0.12, tail);
    m(0.18, 0.16, 0.16, 0xe8833a, 0, 0.58, -0.02, tail);
    this.squirrel.add(tail);
    this.sqTail = tail;
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14 })
    );
    shadow.position.y = 0.02;
    shadow.name = 'shadow';
    this.squirrel.add(shadow);
    this.squirrel.position.copy(this.sqPos);
    this.scene.add(this.squirrel);
  }

  private updateSquirrel(dt: number, t: number) {
    // Se queda atrás y a un lado del jugador
    const ry = this.player.rotation.y;
    const tx = this.pos.x - Math.sin(ry) * 0.8 + Math.cos(ry) * 0.6;
    const tz = this.pos.z - Math.cos(ry) * 0.8 - Math.sin(ry) * 0.6;
    const dx = tx - this.sqPos.x;
    const dz = tz - this.sqPos.z;
    const dist = Math.hypot(dx, dz);
    const moving = dist > 0.2;
    if (dist > 6) this.sqPos.set(tx, 0, tz); // si se quedó muy atrás, aparece junto al jugador
    else if (moving) {
      const step = Math.min(dist, Math.max(3, dist * 4) * dt);
      this.sqPos.x += (dx / dist) * step;
      this.sqPos.z += (dz / dist) * step;
      this.squirrel.rotation.y = Math.atan2(dx, dz);
    } else {
      // Quieta: mira hacia el jugador
      const fx = this.pos.x - this.sqPos.x;
      const fz = this.pos.z - this.sqPos.z;
      let diff = Math.atan2(fx, fz) - this.squirrel.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.squirrel.rotation.y += diff * Math.min(1, dt * 4);
    }
    this.sqHop = moving ? this.sqHop + dt * 14 : 0;
    this.sqCheer = Math.max(0, this.sqCheer - dt);
    let y = moving && !this.calm ? Math.abs(Math.sin(this.sqHop)) * 0.18 : 0;
    if (this.sqCheer > 0) y = Math.abs(Math.sin(this.sqCheer * 9)) * 0.45;
    this.squirrel.position.set(this.sqPos.x, y, this.sqPos.z);
    const sh = this.squirrel.getObjectByName('shadow');
    if (sh) sh.position.y = 0.02 - y;
    if (this.sqTail && !this.calm) this.sqTail.rotation.x = Math.sin(t * 3) * 0.12;
  }

  /** La ardilla da saltitos de alegría. */
  cheer() {
    this.sqCheer = 1.2;
  }

  private buildBeacon() {
    const g = new THREE.Group();
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 9, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: C.sky, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })
    );
    column.position.y = 4.5;
    g.add(column);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), new THREE.MeshLambertMaterial({ color: C.amber, emissive: 0x7c4a03 }));
    gem.position.y = 2.6;
    gem.name = 'gem';
    g.add(gem);
    g.visible = false;
    this.scene.add(g);
    return g;
  }

  // ==========================================================================
  // ENTRADA
  // ==========================================================================
  private bindInput() {
    const el = this.renderer.domElement;
    const isTyping = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement)?.tagName;
      return t === 'INPUT' || t === 'TEXTAREA';
    };
    const kd = (e: KeyboardEvent) => {
      if (!this.inputEnabled || isTyping(e)) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        this.keys.add(k);
        this.path = [];
        this.pendingInteract = null;
        this.moveMarker.visible = false;
        e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const blur = () => this.keys.clear();
    const pd = (e: PointerEvent) => (this.downAt = { x: e.clientX, y: e.clientY });
    const pu = (e: PointerEvent) => {
      if (!this.downAt || !this.inputEnabled) return;
      const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
      this.downAt = null;
      if (moved < 10) this.handleClick(e.clientX, e.clientY);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (this.focus) return;
      this.zoom = this.userZoom = THREE.MathUtils.clamp(this.zoom + Math.sign(e.deltaY) * 1.2, 8, 20);
      this.resize();
    };
    const resize = () => this.resize();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    window.addEventListener('resize', resize);
    el.addEventListener('pointerdown', pd);
    el.addEventListener('pointerup', pu);
    el.addEventListener('wheel', wheel, { passive: false });
    this.disposers.push(() => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
      window.removeEventListener('resize', resize);
      el.removeEventListener('pointerdown', pd);
      el.removeEventListener('pointerup', pu);
      el.removeEventListener('wheel', wheel);
    });
  }

  private handleClick(cx: number, cy: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, hit)) return;

    // ¿Tocó cerca de una estación? Caminar hasta ella y entrar al llegar
    let target = { x: Math.floor(hit.x), z: Math.floor(hit.z) };
    this.pendingInteract = null;
    for (const id of STATION_ORDER) {
      const s = STATION_TILES[id];
      if (Math.hypot(hit.x - (s.x + 0.5), hit.z - (s.z + 0.5)) < 2) {
        target = { x: s.x, z: s.z };
        this.pendingInteract = id;
        break;
      }
    }
    const goal = this.nearestWalkable(target.x, target.z);
    if (!goal) return;
    const path = this.findPath(Math.floor(this.pos.x), Math.floor(this.pos.z), goal.x, goal.z);
    if (!path) return;
    this.path = path.map((p) => ({ x: p.x + 0.5, z: p.z + 0.5 }));
    this.moveMarker.position.set(goal.x + 0.5, 0.04, goal.z + 0.5);
    this.moveMarker.visible = !this.pendingInteract;
  }

  private walkable(x: number, z: number) {
    if (x < 0 || z < 0 || x >= W || z >= D) return false;
    if (this.bridgeWalkable && x >= RIVER_X0 && x <= RIVER_X1 && BRIDGE_Z.includes(z)) return true;
    return !this.blocked[idx(x, z)];
  }

  private nearestWalkable(x: number, z: number) {
    for (let r = 0; r <= 2; r++)
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) if (this.walkable(x + dx, z + dz)) return { x: x + dx, z: z + dz };
    return null;
  }

  /** A* en 8 direcciones sin cortar esquinas. La rejilla es pequeña (~1000 nodos): búsqueda lineal basta. */
  private findPath(sx: number, sz: number, gx: number, gz: number) {
    const start = idx(sx, sz);
    const goal = idx(gx, gz);
    const g = new Float32Array(W * D).fill(Infinity);
    const f = new Float32Array(W * D).fill(Infinity);
    const from = new Int32Array(W * D).fill(-1);
    const closed = new Uint8Array(W * D);
    const open = new Set<number>([start]);
    const h = (i: number) => {
      const dx = Math.abs((i % W) - gx);
      const dz = Math.abs(Math.floor(i / W) - gz);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
    };
    g[start] = 0;
    f[start] = h(start);
    while (open.size) {
      let cur = -1;
      for (const o of open) if (cur < 0 || f[o] < f[cur]) cur = o;
      if (cur === goal) {
        const out: { x: number; z: number }[] = [];
        for (let c = cur; c !== start; c = from[c]) out.unshift({ x: c % W, z: Math.floor(c / W) });
        return out;
      }
      open.delete(cur);
      closed[cur] = 1;
      const cx = cur % W;
      const cz = Math.floor(cur / W);
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const nx = cx + dx;
          const nz = cz + dz;
          if (!this.walkable(nx, nz)) continue;
          if (dx && dz && (!this.walkable(cx + dx, cz) || !this.walkable(cx, cz + dz))) continue;
          const n = idx(nx, nz);
          if (closed[n]) continue;
          const cost = g[cur] + (dx && dz ? 1.414 : 1);
          if (cost < g[n]) {
            from[n] = cur;
            g[n] = cost;
            f[n] = cost + h(n);
            open.add(n);
          }
        }
    }
    return null;
  }

  // ==========================================================================
  // BUCLE
  // ==========================================================================
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1); // hasta 10 FPS sin cámara lenta (equipos de gama baja)
    const t = this.timer.getElapsed();
    this.updatePlayer(dt);
    this.updateSquirrel(dt, t);
    this.updateCamera(dt);

    // Animaciones suaves (desactivadas en modo calma)
    this.tankLevel += (this.tankTarget - this.tankLevel) * Math.min(1, dt * 4);
    this.tankWater.scale.y = Math.max(0.001, this.tankLevel * 2);
    this.tankWater.position.y = 0.2 + this.tankLevel;
    const gy = this.gauge.scale.y + (this.gaugeTarget - this.gauge.scale.y) * Math.min(1, dt * 5);
    this.gauge.scale.y = Math.max(0.001, gy);
    this.gauge.position.y = 0.1 + gy / 2;
    if (!this.calm) {
      this.waterMesh.position.y = Math.sin(t * 1.2) * 0.025;
      const gem = this.beacon.getObjectByName('gem');
      if (gem) {
        gem.rotation.y = t * 1.2;
        gem.position.y = 2.6 + Math.sin(t * 2) * 0.12;
      }
    }

    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  };

  private updatePlayer(dt: number) {
    let mx = 0;
    let mz = 0;
    if (this.inputEnabled && this.keys.size) {
      // Ejes isométricos: arriba en pantalla = (-1,-1), derecha = (1,-1)
      if (this.keys.has('w') || this.keys.has('arrowup')) { mx -= 1; mz -= 1; }
      if (this.keys.has('s') || this.keys.has('arrowdown')) { mx += 1; mz += 1; }
      if (this.keys.has('d') || this.keys.has('arrowright')) { mx += 1; mz -= 1; }
      if (this.keys.has('a') || this.keys.has('arrowleft')) { mx -= 1; mz += 1; }
    } else if (this.path.length) {
      const wp = this.path[0];
      mx = wp.x - this.pos.x;
      mz = wp.z - this.pos.z;
      if (Math.hypot(mx, mz) < 0.08) {
        this.path.shift();
        if (!this.path.length) this.moveMarker.visible = false;
        mx = mz = 0;
      }
    }

    const len = Math.hypot(mx, mz);
    const moving = len > 0;
    if (moving) {
      const speed = 4.2 * dt;
      const step = Math.min(speed, this.path.length && !this.keys.size ? len : speed);
      const dx = (mx / len) * step;
      const dz = (mz / len) * step;
      const r = 0.28;
      const bx = this.pos.x;
      const bz = this.pos.z;
      if (this.walkable(Math.floor(this.pos.x + dx + Math.sign(dx) * r), Math.floor(this.pos.z))) this.pos.x += dx;
      if (this.walkable(Math.floor(this.pos.x), Math.floor(this.pos.z + dz + Math.sign(dz) * r))) this.pos.z += dz;
      this.walked += Math.hypot(this.pos.x - bx, this.pos.z - bz);
      const targetRot = Math.atan2(mx, mz);
      let diff = targetRot - this.player.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.player.rotation.y += diff * Math.min(1, dt * 12);
      this.walkT += dt * 11;
    } else {
      this.walkT = 0;
    }
    if (this.limbs) {
      const s = moving ? Math.sin(this.walkT) * 0.7 : 0;
      this.limbs.legL.rotation.x = s;
      this.limbs.legR.rotation.x = -s;
      this.limbs.armL.rotation.x = -s * 0.8;
      this.limbs.armR.rotation.x = s * 0.8;
    }
    this.player.position.set(this.pos.x, moving && !this.calm ? Math.abs(Math.sin(this.walkT)) * 0.05 : 0, this.pos.z);

    // Proximidad a estaciones
    let near: MissionId | null = null;
    for (const id of STATION_ORDER) {
      const s = STATION_TILES[id];
      if (Math.hypot(this.pos.x - (s.x + 0.5), this.pos.z - (s.z + 0.5)) < 1.8) near = id;
    }
    if (near !== this.nearId) {
      this.nearId = near;
      this.cb.onNear(near);
    }
    if (this.pendingInteract && near === this.pendingInteract && !this.path.length) {
      const id = this.pendingInteract;
      this.pendingInteract = null;
      this.cb.onInteract(id);
    }

    // Flecha guía hacia el objetivo
    if (this.objective) {
      const s = STATION_TILES[this.objective];
      const ox = s.x + 0.5 - this.pos.x;
      const oz = s.z + 0.5 - this.pos.z;
      const dist = Math.hypot(ox, oz);
      this.arrow.visible = dist > 3 && this.inputEnabled;
      this.arrow.position.set(this.pos.x + (ox / dist) * 1.1, 0.08, this.pos.z + (oz / dist) * 1.1);
      this.arrow.rotation.y = Math.atan2(ox, oz);
    } else this.arrow.visible = false;
  }

  private updateCamera(dt: number) {
    const want = new THREE.Vector3(this.pos.x, 0, this.pos.z);
    if (this.focus) {
      const s = STATION_TILES[this.focus];
      want.set(s.x + 0.5, 0, s.z + 0.5);
      // En pantallas anchas el panel de misión ocupa la derecha: correr la estación a la izquierda
      if (this.container.clientWidth >= 1024) {
        const shift = (this.halfWidth() * 0.4) / Math.SQRT2;
        want.x += shift;
        want.z -= shift;
      }
    }
    this.camTarget.lerp(want, Math.min(1, dt * (this.calm ? 3 : 6)));
    this.camera.position.copy(this.camTarget).add(this.camOffset);
    this.camera.lookAt(this.camTarget);
  }

  private halfWidth() {
    return (this.camera.right - this.camera.left) / 2;
  }

  private updateLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const v = new THREE.Vector3();
    v.set(this.sqPos.x, 0.95, this.sqPos.z).project(this.camera);
    this.squirrelAnchor.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
    for (const id of STATION_ORDER) {
      const el = this.labels[id];
      if (!el) continue;
      const s = STATION_TILES[id];
      v.set(s.x + 0.5, 2.3, s.z - 0.5).project(this.camera);
      el.style.display = this.focus || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1 ? 'none' : 'block';
      el.style.left = `${((v.x + 1) / 2) * w}px`;
      el.style.top = `${((1 - v.y) / 2) * h}px`;
    }
  }

  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const aspect = w / h;
    const half = (this.zoom * Math.max(1, 1.1 / aspect)) / 2;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================
  setInputEnabled(on: boolean) {
    this.inputEnabled = on;
    if (!on) {
      this.keys.clear();
      this.path = [];
      this.pendingInteract = null;
      this.moveMarker.visible = false;
    }
  }

  setCalm(on: boolean) {
    this.calm = on;
  }

  focusStation(id: MissionId | null) {
    this.focus = id;
    this.zoom = id ? 9 : this.userZoom;
    this.resize();
  }

  /** Estado de cada estación + objetivo actual (faro y flecha). */
  setStations(states: Record<MissionId, StationState>, objective: MissionId | null, names: Record<MissionId, string>) {
    this.stationStates = states;
    this.objective = objective;
    for (const id of STATION_ORDER) {
      const st = states[id];
      const ring = this.rings[id]!;
      (ring.material as THREE.MeshBasicMaterial).color.setHex(st === 'done' ? C.emerald : st === 'open' ? C.sky : C.slate);
      this.flags[id]!.visible = st === 'done';
      const label = this.labels[id]!;
      label.textContent = names[id];
      label.style.color = st === 'locked' ? '#94a3b8' : st === 'done' ? '#ffffff' : '#0369a1';
      label.style.background = st === 'locked' ? '#f1f5f9' : st === 'done' ? '#22c55e' : '#fffaf0';
      label.style.opacity = st === 'locked' ? '0.75' : '1';
    }
    if (objective) {
      const s = STATION_TILES[objective];
      this.beacon.position.set(s.x + 0.5, 0, s.z + 0.5);
    }
    this.beacon.visible = !!objective;
    this.resetMissionVisuals();
  }

  /** Devuelve las piezas del mundo al estado guardado (al salir de una misión sin terminar). */
  resetMissionVisuals() {
    const done = (id: MissionId) => this.stationStates[id] === 'done';
    this.setFilters(done('mision-1-agua') ? 4 : 0, 6);
    this.setGauge(done('mision-1-agua') ? 10 : 0, 10);
    this.fountainWater.visible = done('mision-1-agua');
    this.boardBanner.visible = done('mision-2-rumor');
    const bridge = done('mision-3-puente');
    this.setBridge({ beams: bridge ? 4 : 0, pillars: bridge ? 2 : 0, rails: bridge });
    this.bridgeWalkable = bridge;
    this.gardenCover.visible = done('mision-4-bosque');
  }

  /** Misión 1: filtros encendidos -> el tanque sube (marca ámbar = la meta de litros). */
  setFilters(n: number, perUnit: number, target = 24) {
    this.filters.forEach((f, i) => (f.material as THREE.MeshLambertMaterial).color.setHex(i < n ? C.sky : C.slate));
    this.tankTarget = Math.min((n * perUnit) / target, 1.3) * 0.8; // 0.8 = altura de la marca
  }

  /** Metros caminados desde la última llamada (1 bloque = 3 m). */
  takeWalkedMeters() {
    const m = this.walked * 3;
    this.walked = 0;
    return m;
  }

  /** Misión 1: suma de válvulas en el manómetro. Verde = exacto. */
  setGauge(sum: number, target: number) {
    this.gaugeTarget = Math.max(0.001, (sum / (target * 1.5)) * 1.7);
    (this.gauge.material as THREE.MeshLambertMaterial).color.setHex(sum === target ? C.emerald : sum > target ? C.rose : C.amber);
  }

  /** Misión 3: el puente se construye pieza por pieza en vivo. */
  setBridge(p: { beams?: number; pillars?: number; rails?: boolean }) {
    if (p.beams !== undefined) {
      this.beams.forEach((b, i) => (b.visible = i < p.beams!));
      // Vigas de más quedan sobre la orilla lejana: se ve que "sobran"
      this.brokenPlank.visible = p.beams === 0;
    }
    if (p.pillars !== undefined) {
      const n = p.pillars;
      this.pillars.forEach((pl, i) => {
        pl.visible = i < n;
        pl.position.set(RIVER_X0 + (4 * (i + 1)) / (n + 1), -0.56, BRIDGE_Z[0] + 1);
      });
    }
    if (p.rails !== undefined) this.rails.visible = p.rails;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.disposers.forEach((d) => d());
    Object.values(this.labels).forEach((l) => l?.remove());
    this.squirrelAnchor.remove();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
