import * as THREE from 'three';
import {
  ExplorerCharacter3D,
  createGuardianNPC,
  type CharacterOutfit,
  DEFAULT_OUTFIT,
} from './ExplorerCharacter3D';
import { CompanionSquirrel3D } from './CompanionSquirrel3D';
import { toonMat } from './toon';

export type CameraMode =
  | 'explore'
  | 'wardrobe'
  | 'fountain'
  | 'bridge'
  | 'sanctuary';

export interface CollectibleGem {
  id: string;
  group: THREE.Group;
  collected: boolean;
  position: THREE.Vector3;
}

export interface SquirrelDialog {
  title: string;
  text: string;
  stepNumber: number;
  totalSteps: number;
  completed: boolean;
}

export class WorldScene3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animId: number = 0;

  public explorer: ExplorerCharacter3D;
  public squirrel: CompanionSquirrel3D;
  private cameraMode: CameraMode = 'explore';

  // Cámara PC cinematográfica con seguimiento suave
  private cameraYaw = 0;
  private cameraPitch = 0.14;
  private camDistance = 5.2;
  private targetLookAt = new THREE.Vector3();
  private isPointerDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Sendero forestal lineal por niveles (Z avanza de 34 a -42)
  private pathPoints: THREE.Vector3[] = [];
  private pathCurve!: THREE.CatmullRomCurve3;

  // Coleccionables y elementos interactivos
  public gems: CollectibleGem[] = [];
  public collectedGemsCount = 0;
  private fountainWaterMesh: THREE.Mesh | null = null;
  private fountainParticles: THREE.Points | null = null;
  private bridgeGroup: THREE.Group | null = null;
  public bridgeBuilt = false;

  // Efectos ambientales vivos (hojas cayendo y esporas de luz solar)
  private fallingLeavesMesh: THREE.InstancedMesh | null = null;
  private leafData: { pos: THREE.Vector3; rot: THREE.Vector3; speed: number; rotSpeed: THREE.Vector3 }[] = [];
  private sunSporeParticles: THREE.Points | null = null;
  private grassInstanced: THREE.InstancedMesh | null = null;
  private kael: { group: THREE.Group; head: THREE.Group; sash: THREE.Mesh } | null = null;

  // Callbacks de interfaz
  private onGemCollected?: (count: number) => void;
  private onSquirrelPrompt?: (dialog: SquirrelDialog) => void;
  private onNearStationCallback?: (stationId: string | null) => void;
  private onSquirrelScreenUpdate?: (pos: { x: number; y: number; visible: boolean }) => void;

  private keys: Record<string, boolean> = {};
  private paused = false;
  private wardrobeAngle = 0;
  private distanceWalkedMeters = 0;
  private lastPos = new THREE.Vector3();

  // Nivel 1 Tutorial TDAH
  public tutorialState = {
    movedWASD: false,
    jumped: false,
    gemsFound: 0,
    reachedFountain: false,
  };

  constructor(
    container: HTMLElement,
    initialOutfit: CharacterOutfit = DEFAULT_OUTFIT,
    onGemCollected?: (count: number) => void,
    onSquirrelPrompt?: (dialog: SquirrelDialog) => void,
    onNearStation?: (stationId: string | null) => void,
    onSquirrelScreenUpdate?: (pos: { x: number; y: number; visible: boolean }) => void
  ) {
    this.container = container;
    this.onGemCollected = onGemCollected;
    this.onSquirrelPrompt = onSquirrelPrompt;
    this.onNearStationCallback = onNearStation;
    this.onSquirrelScreenUpdate = onSquirrelScreenUpdate;
    this.clock = new THREE.Clock();

    // 1. Escena con cielo cálido y niebla atmosférica verde-azulada para dar profundidad profunda
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6ebbe5);
    this.scene.fog = new THREE.FogExp2(0x86c8d8, 0.0075);

    // 2. Cámara PC en tercera persona
    this.camera = new THREE.PerspectiveCamera(
      44,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.15,
      350
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 3. Generar la ruta del sendero
    this.setupPathCurve();

    // 4. Construir el entorno con profundidad, capas de bosque y atmósfera viva
    this.setupLighting();
    this.buildSkyAndSunShafts();
    this.buildDistantMountainHorizon();
    this.buildDeepForestTerrain();
    this.buildLayeredGrandForestCanopy();
    this.buildRusticFencesAndTrailDetails();
    this.buildLushFountainOfSprings();
    this.buildGemsAlongPath();
    this.buildFallingLeavesSystem();
    this.buildSunlightDustSpores();
    this.buildWoodenBridgeCheckpoint();
    this.buildSanctuaryFinish();

    // 5. Protagonista y Chispa la Ardilla
    this.explorer = new ExplorerCharacter3D(initialOutfit);
    const startPt = this.pathPoints[0];
    this.explorer.group.position.copy(startPt);
    this.lastPos.copy(startPt);
    this.scene.add(this.explorer.group);

    this.squirrel = new CompanionSquirrel3D();
    this.squirrel.group.position.set(startPt.x + 1.25, startPt.y, startPt.z + 0.35);
    this.scene.add(this.squirrel.group);

    // Guardián Kael junto a la fuente (UBICADO DE FORMA SEGURA EN EL CAMINO, FUERA DEL AGUA)
    this.kael = createGuardianNPC({
      hairColor: 0xe6edf5,
      coatColor: 0x1b1e22,
      sashColor: 0x7c1d28,
    });
    const kaelY = this.getTerrainHeight(-1.8, 15.2);
    this.kael.group.position.set(-1.8, kaelY, 15.2);
    this.kael.group.rotation.y = -1.25;
    this.scene.add(this.kael.group);

    // Posición inicial de cámara perfectamente despejada (sin arbustos encima)
    this.camera.position.set(startPt.x, startPt.y + 2.1, startPt.z + 5.5);
    this.targetLookAt.set(startPt.x, startPt.y + 1.5, startPt.z - 8.0);
    this.camera.lookAt(this.targetLookAt);

    this.bindEvents();
    this.animate();
    this.updateSquirrelGuide();
  }

  // ============================================================================
  // TOPOGRAFÍA DEL SENDERO Y LÍMITES NATURALES DEL BOSQUE
  // ============================================================================
  private setupPathCurve() {
    this.pathPoints = [
      new THREE.Vector3(0, this.getTerrainHeight(0, 32), 32),
      new THREE.Vector3(-1.4, this.getTerrainHeight(-1.4, 23), 23),
      new THREE.Vector3(-3.0, this.getTerrainHeight(-3.0, 14), 14),
      new THREE.Vector3(0.6, this.getTerrainHeight(0.6, 5), 5),
      new THREE.Vector3(3.6, this.getTerrainHeight(3.6, -5), -5),
      new THREE.Vector3(1.2, this.getTerrainHeight(1.2, -15), -15),
      new THREE.Vector3(-2.2, this.getTerrainHeight(-2.2, -26), -26),
      new THREE.Vector3(0, this.getTerrainHeight(0, -38), -38),
    ];
    this.pathCurve = new THREE.CatmullRomCurve3(this.pathPoints);
  }

  public getPathPositionAtZ(z: number): { x: number; y: number } {
    const t = THREE.MathUtils.clamp((32 - z) / 70, 0, 1);
    const pt = this.pathCurve.getPoint(t);
    return { x: pt.x, y: pt.y };
  }

  public getTerrainHeight(x: number, z: number): number {
    // El sendero es suave, mientras que los laterales suben creando laderas de bosque
    const pathCenter = (32 - z) * 0.02 * Math.sin(z * 0.08);
    const distToPath = Math.abs(x - pathCenter);
    // Laderas elevadas a los costados para cerrar naturalmente el escenario
    const ridgeRise = Math.max(0, distToPath - 4.5) * 0.28;
    const gentleWaves = Math.sin(x * 0.08) * Math.cos(z * 0.06) * 1.2;
    const overallSlope = (32 - z) * 0.038;

    return Math.max(0.3, 1.2 + gentleWaves + ridgeRise + overallSlope);
  }

  // ============================================================================
  // ILUMINACIÓN CÁLIDA Y RAYOS VOLUMÉTRICOS DE SOL FILTRADOS
  // ============================================================================
  private setupLighting() {
    const hemi = new THREE.HemisphereLight(0xfff7e6, 0x3d7026, 1.55);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff3c4, 2.35);
    sun.position.set(-28, 48, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 140;
    const d = 40;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
  }

  private buildSkyAndSunShafts() {
    // Cielo soleado degradado
    const skyGeo = new THREE.SphereGeometry(220, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topCol: { value: new THREE.Color(0x358fd4) },
        midCol: { value: new THREE.Color(0x73c0ea) },
        botCol: { value: new THREE.Color(0xd7f1da) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topCol;
        uniform vec3 midCol;
        uniform vec3 botCol;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          vec3 col = mix(botCol, midCol, smoothstep(0.0, 0.35, max(0.0, h)));
          col = mix(col, topCol, smoothstep(0.35, 0.85, max(0.0, h)));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Rayos de sol dorados volumétricos filtrándose entre las copas
    const shaftsGroup = new THREE.Group();
    shaftsGroup.position.set(-16, 32, 0);

    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0xfffde0,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    for (let i = 0; i < 11; i++) {
      const angle = (i / 10 - 0.5) * 1.1;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(4.2, 75, 4, 1, true), shaftMat);
      cone.position.set(Math.sin(angle) * 16, -30, Math.cos(angle) * 12);
      cone.rotation.z = angle * 0.75;
      cone.rotation.x = -0.35;
      shaftsGroup.add(cone);
    }
    this.scene.add(shaftsGroup);
  }

  // ============================================================================
  // HORIZONTE PANORÁMICO 360: PICOS MONTAÑOSOS Y NUBES ESTILIZADAS (ZELDA / GENSHIN)
  // ============================================================================
  private buildDistantMountainHorizon() {
    const mountainMat1 = toonMat({ color: 0x3d6674, rimStrength: 0.2 });
    const mountainMat2 = toonMat({ color: 0x4d7a8c, rimStrength: 0.25 });
    const mountainMat3 = toonMat({ color: 0x2c4e5c, rimStrength: 0.15 });
    const mats = [mountainMat1, mountainMat2, mountainMat3];

    // Anillo de picos montañosos en 360 grados que cierran todo el horizonte
    const mountainCount = 20;
    for (let i = 0; i < mountainCount; i++) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const dist = 85 + Math.random() * 35;
      const mx = Math.cos(angle) * dist;
      const mz = Math.sin(angle) * dist;
      const height = 30 + Math.random() * 28;
      const radius = 20 + Math.random() * 16;

      const mGeo = new THREE.ConeGeometry(radius, height, 7);
      const mMesh = new THREE.Mesh(mGeo, mats[i % mats.length]);
      mMesh.position.set(mx, height * 0.38, mz);
      mMesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(mMesh);
    }

    // Nubes estilizadas en el horizonte
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
    });
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + 0.2;
      const dist = 75 + Math.random() * 25;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;
      const cy = 25 + Math.random() * 12;

      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cx, cy, cz);

      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3.5 + Math.random() * 2.5, 8, 6), cloudMat);
        puff.position.set((p - 1.5) * 3.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2);
        puff.scale.set(1.4, 0.7, 1.1);
        cloudGroup.add(puff);
      }
      this.scene.add(cloudGroup);
    }
  }

  // ============================================================================
  // TERRENO FORESTAL CON CAPAS DE VEGETACIÓN Y SENDERO REALISTA
  // ============================================================================
  private buildDeepForestTerrain() {
    const sizeX = 180;
    const sizeZ = 190;
    const segX = 130;
    const segZ = 145;
    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    const cPathSand = new THREE.Color(0xecd8b0);   // Arena y grava clara iluminada
    const cPathDirt = new THREE.Color(0xbfa577);   // Tierra arcillosa del borde
    const cMeadowLush = new THREE.Color(0x56a627); // Verde pradera vivo
    const cForestFloor = new THREE.Color(0x2f6b1e);// Verde profundo bajo los árboles
    const cDeepShade = new THREE.Color(0x1a4515);  // Sombra vegetal densa en los bordes
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getTerrainHeight(x, z);
      pos.setY(i, y);

      const pathCenter = this.getPathPositionAtZ(z);
      const dist = Math.abs(x - pathCenter.x);

      if (dist < 1.6) {
        // En el centro del camino: grava clara y suave
        const blend = dist / 1.6;
        tmp.copy(cPathSand).lerp(cPathDirt, blend * blend);
      } else if (dist < 2.8) {
        // Borde del camino con brotes de hierba
        const blend = (dist - 1.6) / 1.2;
        tmp.copy(cPathDirt).lerp(cMeadowLush, blend);
      } else if (dist < 8.5) {
        // Pradera con flores bordeando el camino
        const blend = (dist - 2.8) / 5.7;
        tmp.copy(cMeadowLush).lerp(cForestFloor, blend);
      } else {
        // Bosque denso en las laderas laterales (límite natural)
        const blend = THREE.MathUtils.clamp((dist - 8.5) / 18, 0, 1);
        tmp.copy(cForestFloor).lerp(cDeepShade, blend);
      }

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = toonMat({ vertexColors: true, rimStrength: 0.18 });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Instanciar briznas de hierba fina a lo largo de los bordes del camino
    this.buildInstancedGrassDetails();
  }

  private buildInstancedGrassDetails() {
    const count = 4800;
    const bladeGeo = new THREE.ConeGeometry(0.05, 0.45, 3);
    bladeGeo.translate(0, 0.225, 0);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x4da825 });

    this.grassInstanced = new THREE.InstancedMesh(bladeGeo, bladeMat, count);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    let placed = 0;
    for (let i = 0; i < count; i++) {
      const z = 33 - Math.random() * 68;
      const center = this.getPathPositionAtZ(z);
      // Colocar hierba en los bordes del camino (entre 1.8 y 7.5 metros del centro)
      const side = Math.random() > 0.5 ? 1 : -1;
      const dist = 1.9 + Math.random() * 5.8;
      const x = center.x + side * dist;
      const y = this.getTerrainHeight(x, z);

      dummy.position.set(x, y - 0.02, z);
      dummy.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, 0);
      dummy.scale.setScalar(0.7 + Math.random() * 0.7);
      dummy.updateMatrix();
      this.grassInstanced.setMatrixAt(placed, dummy.matrix);

      col.setHSL(0.26 + Math.random() * 0.06, 0.65, 0.38 + Math.random() * 0.18);
      this.grassInstanced.setColorAt(placed, col);
      placed++;
    }

    this.grassInstanced.instanceMatrix.needsUpdate = true;
    if (this.grassInstanced.instanceColor) this.grassInstanced.instanceColor.needsUpdate = true;
    this.scene.add(this.grassInstanced);
  }

  // ============================================================================
  // ÁRBOLES GRANDES MAJESTUOSOS Y CAPAS DE BOSQUE INFINITO EN EL HORIZONTE
  // ============================================================================
  private buildLayeredGrandForestCanopy() {
    const trunkMat = toonMat({ color: 0x54361e });
    const darkWoodMat = toonMat({ color: 0x3d2412 });

    const leafTones = [
      toonMat({ color: 0x48a825, rimStrength: 0.42 }), // Verde esmeralda vivo
      toonMat({ color: 0x62bf32, rimStrength: 0.52 }), // Verde dorado por el sol
      toonMat({ color: 0x317a1a, rimStrength: 0.32 }), // Verde oliva profundo
      toonMat({ color: 0x7ecc3e, rimStrength: 0.48 }), // Verde lima brillante
    ];

    // 1. ÁRBOLES GIGANTES EN PRIMERA FILA (Bordeando el sendero a partir de z = 28 para no tapar la cámara inicial)
    for (let z = 28; z >= -40; z -= 4.2) {
      const center = this.getPathPositionAtZ(z);

      // Lado izquierdo
      const lx = center.x - (3.8 + Math.random() * 2.2);
      this.createGrandOakTree(lx, z, 7.5 + Math.random() * 3.5, trunkMat, leafTones);

      // Lado derecho
      const rx = center.x + (3.8 + Math.random() * 2.2);
      this.createGrandOakTree(rx, z, 7.5 + Math.random() * 3.5, trunkMat, leafTones);
    }

    // 2. SEGUNDA FILA: BOSQUE MEDIO DENSO (Crea volumen y follaje intermedio)
    for (let z = 32; z >= -42; z -= 3.2) {
      const center = this.getPathPositionAtZ(z);
      [-1, 1].forEach((dir) => {
        const dist = 7.5 + Math.random() * 5.5;
        const x = center.x + dir * dist;
        this.createPineOrBroadTree(x, z, 8.0 + Math.random() * 4.0, darkWoodMat, leafTones);
      });
    }

    // 3. CAPA DE FONDO: MURO DE BOSQUE DENSO EN LAS LADERAS (LÍMITE NATURAL QUE CIERRA EL ESCENARIO)
    for (let z = 36; z >= -46; z -= 2.6) {
      const center = this.getPathPositionAtZ(z);
      [-1, 1].forEach((dir) => {
        for (let r = 0; r < 2; r++) {
          const dist = 14.5 + r * 7.5 + Math.random() * 4.0;
          const x = center.x + dir * dist;
          this.createBackgroundCanopyPuff(x, z, 10.0 + Math.random() * 5.0, leafTones);
        }
      });
    }

    // 4. BOSQUE TRASERO DENSO (CIERRA LA ESPALDA DEL JUGADOR ENTRE z = 36 Y z = 68 PARA QUE NUNCA SE VEA VACÍO)
    for (let z = 36; z <= 68; z += 4.5) {
      for (let x = -34; x <= 34; x += 5.2) {
        if (Math.abs(x) < 2.5 && z < 42) continue; // Despejado detrás de la espalda inmediata del spawn
        if (Math.random() > 0.4) {
          this.createPineOrBroadTree(x, z, 8.5 + Math.random() * 4.5, darkWoodMat, leafTones);
        } else {
          this.createBackgroundCanopyPuff(x, z, 9.5 + Math.random() * 4.0, leafTones);
        }
      }
    }

    // 5. BOSQUE DEL NORTE TRAS EL SANTUARIO (CIERRA EL FONDO ENTRE z = -40 Y z = -68)
    for (let z = -40; z >= -68; z -= 4.5) {
      for (let x = -34; x <= 34; x += 5.2) {
        if (Math.random() > 0.4) {
          this.createPineOrBroadTree(x, z, 8.5 + Math.random() * 4.5, darkWoodMat, leafTones);
        } else {
          this.createBackgroundCanopyPuff(x, z, 9.5 + Math.random() * 4.0, leafTones);
        }
      }
    }
  }

  private createGrandOakTree(
    x: number,
    z: number,
    height: number,
    trunkMat: THREE.Material,
    leafMats: THREE.Material[]
  ) {
    const y = this.getTerrainHeight(x, z);
    const tree = new THREE.Group();
    tree.position.set(x, y, z);

    // Tronco grueso y alto con ramas que se arquean hacia arriba
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.72, height * 0.48, 10),
      trunkMat
    );
    trunk.position.y = height * 0.24;
    trunk.castShadow = true;
    tree.add(trunk);

    // Ramas secundarias
    [-0.35, 0.35].forEach((dir, idx) => {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, height * 0.28, 8),
        trunkMat
      );
      branch.position.set(dir * 0.5, height * 0.38, (idx === 0 ? 0.3 : -0.3));
      branch.rotation.z = -dir * 0.55;
      branch.rotation.x = idx === 0 ? 0.25 : -0.25;
      tree.add(branch);
    });

    // Enorme copa frondosa multicapa que proyecta sombra sobre el sendero
    const canopyMat = leafMats[Math.floor(Math.random() * leafMats.length)];
    const topCanopyMat = leafMats[1]; // Tono más iluminado arriba

    const clusters = [
      [0, height * 0.58, 0, 2.6],
      [-1.4, height * 0.52, 0.6, 2.1],
      [1.4, height * 0.54, -0.5, 2.15],
      [0, height * 0.74, 0.2, 2.2],
      [-0.7, height * 0.68, -0.9, 1.8],
      [0.8, height * 0.66, 0.9, 1.85],
    ];

    clusters.forEach(([cx, cy, cz, r], idx) => {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 2),
        idx >= 3 ? topCanopyMat : canopyMat
      );
      m.position.set(cx, cy, cz);
      m.scale.set(1.15, 0.9, 1.15);
      m.castShadow = true;
      tree.add(m);
    });

    this.scene.add(tree);
  }

  private createPineOrBroadTree(
    x: number,
    z: number,
    height: number,
    trunkMat: THREE.Material,
    leafMats: THREE.Material[]
  ) {
    const y = this.getTerrainHeight(x, z);
    const tree = new THREE.Group();
    tree.position.set(x, y, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.55, height * 0.42, 8),
      trunkMat
    );
    trunk.position.y = height * 0.21;
    trunk.castShadow = true;
    tree.add(trunk);

    const mat = leafMats[Math.floor(Math.random() * leafMats.length)];
    // Estilo pino/ciprés cónico o copa alta
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, height * 0.45, 8), mat);
    cone1.position.y = height * 0.45;
    cone1.castShadow = true;
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.9, height * 0.38, 8), mat);
    cone2.position.y = height * 0.65;
    cone2.castShadow = true;
    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(1.3, height * 0.32, 8), mat);
    cone3.position.y = height * 0.82;
    cone3.castShadow = true;

    tree.add(cone1, cone2, cone3);
    this.scene.add(tree);
  }

  private createBackgroundCanopyPuff(
    x: number,
    z: number,
    height: number,
    leafMats: THREE.Material[]
  ) {
    const y = this.getTerrainHeight(x, z);
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.6 + Math.random() * 2.2, 1),
      leafMats[2]
    );
    puff.position.set(x, y + height * 0.5, z);
    puff.scale.set(1.3, 0.85, 1.3);
    this.scene.add(puff);
  }

  // ============================================================================
  // DETALLES RÚSTICOS: VALLAS DE MADERA, FAROLES Y FLORES (SIN ARBUSTOS EN CÁMARA)
  // ============================================================================
  private buildRusticFencesAndTrailDetails() {
    const woodMat = toonMat({ color: 0x784f2b });

    // Vallas rústicas de madera en tramos curvados del camino
    const fenceZSegments = [
      { zStart: 25, zEnd: 18, side: 1 },
      { zStart: 10, zEnd: 3, side: -1 },
      { zStart: -8, zEnd: -14, side: 1 },
    ];

    fenceZSegments.forEach((seg) => {
      for (let z = seg.zStart; z >= seg.zEnd; z -= 2.4) {
        const center = this.getPathPositionAtZ(z);
        const fx = center.x + seg.side * 2.1;
        const fy = this.getTerrainHeight(fx, z);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), woodMat);
        post.position.set(fx, fy + 0.55, z);
        post.castShadow = true;
        this.scene.add(post);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 2.45), woodMat);
        rail.position.set(fx, fy + 0.75, z - 1.2);
        this.scene.add(rail);
      }
    });

    // Arbustos decorativos colocados SOLO en los laterales lejanos (nunca detrás del jugador)
    const bushMat = toonMat({ color: 0x4aa625, rimStrength: 0.35 });
    for (let z = 24; z >= -34; z -= 5.5) {
      const center = this.getPathPositionAtZ(z);
      [-1, 1].forEach((dir) => {
        const bx = center.x + dir * (2.8 + Math.random() * 1.5);
        const by = this.getTerrainHeight(bx, z);
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), bushMat);
        bush.scale.set(1.3, 0.75, 1.2);
        bush.position.set(bx, by + 0.35, z);
        bush.castShadow = true;
        this.scene.add(bush);
      });
    }
  }

  // ============================================================================
  // FUENTE DE AGUA DEL MANANTIAL DE TRES NIVELES (INSPIRADA EN LA IMAGEN 1)
  // ============================================================================
  private buildLushFountainOfSprings() {
    const fx = -5.8;
    const fz = 14.5;
    const fy = this.getTerrainHeight(fx, fz);

    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(fx, fy, fz);

    const stoneMat = toonMat({ color: 0xd8ceb4, rimStrength: 0.28 });
    const goldMat = toonMat({ color: 0xe5a335, rimStrength: 0.5 });
    const waterMat = new THREE.MeshToonMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.88,
    });

    // Cuenca inferior amplia
    const basePool = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.0, 0.75, 24), stoneMat);
    basePool.position.y = 0.38;
    basePool.castShadow = true;
    basePool.receiveShadow = true;
    fountainGroup.add(basePool);

    const poolWater = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.1, 24), waterMat);
    poolWater.position.y = 0.72;
    fountainGroup.add(poolWater);

    // Pilar y segundo tazón
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 1.6, 16), stoneMat);
    pillar1.position.y = 1.3;
    fountainGroup.add(pillar1);

    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.2, 0.5, 20), stoneMat);
    tier2.position.y = 2.1;
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.08, 8, 24), goldMat);
    rim2.rotation.x = Math.PI / 2;
    rim2.position.y = 2.35;
    fountainGroup.add(tier2, rim2);

    // Tercer tazón y cúspide
    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.2, 12), stoneMat);
    pillar2.position.y = 2.8;
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.6, 0.4, 16), stoneMat);
    tier3.position.y = 3.4;
    const topFinial = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), goldMat);
    topFinial.position.y = 3.9;
    fountainGroup.add(pillar2, tier3, topFinial);

    this.fountainWaterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.35, 1.8, 12),
      waterMat
    );
    this.fountainWaterMesh.position.y = 4.2;
    fountainGroup.add(this.fountainWaterMesh);

    // Partículas de rocío
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 1.8;
      pPositions[i * 3 + 1] = 2.5 + Math.random() * 2.2;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    this.fountainParticles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.12,
        transparent: true,
        opacity: 0.85,
      })
    );
    fountainGroup.add(this.fountainParticles);

    this.scene.add(fountainGroup);
  }

  // ============================================================================
  // SISTEMA DE HOJAS CAYENDO Y ESPORAS DE LUZ (AMBIENTE VIVO)
  // ============================================================================
  private buildFallingLeavesSystem() {
    const leafCount = 95;
    // Forma de hoja alargada ligera
    const leafGeo = new THREE.PlaneGeometry(0.22, 0.14);
    const leafMat = new THREE.MeshBasicMaterial({
      color: 0x82cc33,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    this.fallingLeavesMesh = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let i = 0; i < leafCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        2.5 + Math.random() * 9.0,
        34 - Math.random() * 55
      );
      const rot = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.leafData.push({
        pos,
        rot,
        speed: 0.85 + Math.random() * 0.95,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 3.0,
          (Math.random() - 0.5) * 2.0
        ),
      });

      dummy.position.copy(pos);
      dummy.rotation.set(rot.x, rot.y, rot.z);
      dummy.updateMatrix();
      this.fallingLeavesMesh.setMatrixAt(i, dummy.matrix);

      // Tonos de hoja: verde fresco, verde lima y dorado suave
      col.setHex(Math.random() > 0.4 ? 0x7ac928 : 0xd4b42c);
      this.fallingLeavesMesh.setColorAt(i, col);
    }

    this.fallingLeavesMesh.instanceMatrix.needsUpdate = true;
    if (this.fallingLeavesMesh.instanceColor) this.fallingLeavesMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.fallingLeavesMesh);
  }

  private buildSunlightDustSpores() {
    const count = 160;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = 0.8 + Math.random() * 6.5;
      pos[i * 3 + 2] = 34 - Math.random() * 55;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.sunSporeParticles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xfff3a8,
        size: 0.09,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scene.add(this.sunSporeParticles);
  }

  // ============================================================================
  // GEMAS DORADAS COLECCIONABLES A LO LARGO DEL SENDERO
  // ============================================================================
  private buildGemsAlongPath() {
    const gemCoords = [
      { id: 'gem-1', z: 27 },
      { id: 'gem-2', z: 22 },
      { id: 'gem-3', z: 17 },
      { id: 'gem-4', z: 9 },
      { id: 'gem-5', z: 2 },
      { id: 'gem-6', z: -8 },
      { id: 'gem-7', z: -19 },
      { id: 'gem-8', z: -30 },
    ];

    const gemMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.42,
    });

    gemCoords.forEach((gc) => {
      const center = this.getPathPositionAtZ(gc.z);
      const gy = this.getTerrainHeight(center.x, gc.z) + 0.95;

      const group = new THREE.Group();
      group.position.set(center.x, gy, gc.z);

      const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), gemMat);
      diamond.scale.set(0.85, 1.35, 0.85);

      const aura = new THREE.Mesh(new THREE.OctahedronGeometry(0.44, 0), auraMat);
      aura.scale.set(0.85, 1.35, 0.85);

      group.add(diamond, aura);
      this.scene.add(group);

      this.gems.push({
        id: gc.id,
        group,
        collected: false,
        position: new THREE.Vector3(center.x, gy, gc.z),
      });
    });
  }

  // ============================================================================
  // PUENTE DE MADERA SOBRE EL CAUCE (CHECKPOINT DE NIVEL 3)
  // ============================================================================
  private buildWoodenBridgeCheckpoint() {
    this.bridgeGroup = new THREE.Group();
    const bx = 1.2;
    const bz = -15;
    const by = this.getTerrainHeight(bx, bz);
    this.bridgeGroup.position.set(bx, by, bz);

    const woodMat = toonMat({ color: 0x8a5427 });

    [-1.6, 1.6].forEach((xOffset) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 8.5), woodMat);
      rail.position.set(xOffset, 0.85, 0);
      this.bridgeGroup?.add(rail);

      for (let pz = -3.8; pz <= 3.8; pz += 1.8) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.95, 8), woodMat);
        post.position.set(xOffset, 0.45, pz);
        this.bridgeGroup?.add(post);
      }
    });

    for (let pz = -4.0; pz <= 4.0; pz += 0.55) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 0.48), woodMat);
      plank.position.set(0, 0.08, pz);
      this.bridgeGroup.add(plank);
    }

    this.scene.add(this.bridgeGroup);
  }

  // ============================================================================
  // SANTUARIO DE LA CUMBRE (META DE NIVEL 4)
  // ============================================================================
  private buildSanctuaryFinish() {
    const sx = 0;
    const sz = -38;
    const sy = this.getTerrainHeight(sx, sz);

    const sanctuary = new THREE.Group();
    sanctuary.position.set(sx, sy, sz);

    const stone = toonMat({ color: 0xede4d4 });
    const roof = toonMat({ color: 0xd97706 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.6, 6.5), stone);
    base.position.y = 0.3;
    sanctuary.add(base);

    [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 3.2, 12), stone);
      col.position.set(cx, 1.9, cz);
      sanctuary.add(col);
    });

    const pagoda = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.8, 4), roof);
    pagoda.rotation.y = Math.PI / 4;
    pagoda.position.y = 4.1;
    sanctuary.add(pagoda);

    this.scene.add(sanctuary);
  }

  // ============================================================================
  // GUÍA DIDÁCTICA TDAH DE CHISPA LA ARDILLA
  // ============================================================================
  public updateSquirrelGuide() {
    if (!this.onSquirrelPrompt) return;

    if (!this.tutorialState.movedWASD) {
      this.onSquirrelPrompt({
        title: '¡Hola! Soy Chispa la Ardilla',
        text: 'Camina conmigo por el sendero con WASD o el Ratón. ¡Recoge las gemas brillantes!',
        stepNumber: 1,
        totalSteps: 3,
        completed: false,
      });
    } else if (this.tutorialState.gemsFound < 3) {
      this.onSquirrelPrompt({
        title: '¡Buen ritmo!',
        text: `Sigue el sendero recogiendo las gemas doradas (${this.tutorialState.gemsFound} de 3)`,
        stepNumber: 2,
        totalSteps: 3,
        completed: false,
      });
    } else if (!this.tutorialState.reachedFountain) {
      this.onSquirrelPrompt({
        title: '¡Llegamos a la Fuente!',
        text: '¡Mira la gran fuente de agua! Pulsa [E] o acércate a Kael para regular el manantial.',
        stepNumber: 3,
        totalSteps: 3,
        completed: true,
      });
    }
  }

  // ============================================================================
  // EVENTOS DE ENTRADA (MOVIMIENTO PC FLUIDO)
  // ============================================================================
  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.cameraYaw -= dx * 0.0055;
      this.cameraPitch = THREE.MathUtils.clamp(
        this.cameraPitch + dy * 0.0035,
        0.02,
        0.45
      );
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    this.renderer.domElement.addEventListener('wheel', (e) => {
      this.camDistance = THREE.MathUtils.clamp(
        this.camDistance + e.deltaY * 0.005,
        3.5,
        7.5
      );
    });
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    const k = e.key.toLowerCase();
    this.keys[k] = true;

    if (k === ' ' && this.cameraMode === 'explore') {
      this.explorer.triggerJump();
      this.squirrel.triggerCheer();
      this.tutorialState.jumped = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  // ============================================================================
  // BUCLE DE ANIMACIÓN
  // ============================================================================
  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    if (this.paused) {
      this.clock.getDelta();
      return;
    }

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Chorro de la fuente y partículas de agua
    if (this.fountainWaterMesh) {
      this.fountainWaterMesh.scale.y = 1.0 + Math.sin(elapsed * 6.5) * 0.12;
    }
    if (this.fountainParticles) {
      const pos = this.fountainParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i) - dt * 2.8;
        if (py < 0.8) py = 4.2 + Math.random() * 0.5;
        pos.setY(i, py);
      }
      pos.needsUpdate = true;
    }

    // 2. Animación de hojas cayendo suavemente por el bosque
    if (this.fallingLeavesMesh) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.leafData.length; i++) {
        const l = this.leafData[i];
        l.pos.y -= l.speed * dt;
        l.pos.x += Math.sin(elapsed * 2.5 + i) * 0.45 * dt;
        l.pos.z += Math.cos(elapsed * 2.0 + i) * 0.35 * dt;

        l.rot.x += l.rotSpeed.x * dt;
        l.rot.y += l.rotSpeed.y * dt;
        l.rot.z += l.rotSpeed.z * dt;

        // Si toca el suelo, reaparecer en las copas de los árboles
        const groundY = this.getTerrainHeight(l.pos.x, l.pos.z);
        if (l.pos.y < groundY + 0.1) {
          l.pos.y = groundY + 7.5 + Math.random() * 5.0;
        }

        dummy.position.copy(l.pos);
        dummy.rotation.set(l.rot.x, l.rot.y, l.rot.z);
        dummy.updateMatrix();
        this.fallingLeavesMesh.setMatrixAt(i, dummy.matrix);
      }
      this.fallingLeavesMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Esporas de sol flotando en el aire
    if (this.sunSporeParticles) {
      const pos = this.sunSporeParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + Math.sin(elapsed * 1.5 + i) * 0.006;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // 4. Giro de las gemas coleccionables
    this.gems.forEach((gem) => {
      if (!gem.collected) {
        gem.group.rotation.y += dt * 2.5;
        gem.group.position.y = gem.position.y + Math.sin(elapsed * 3.2 + gem.position.z) * 0.08;

        const dist = this.explorer.group.position.distanceTo(gem.group.position);
        if (dist < 1.45) {
          gem.collected = true;
          gem.group.visible = false;
          this.collectedGemsCount++;
          this.tutorialState.gemsFound++;
          this.squirrel.triggerCheer();
          if (this.onGemCollected) this.onGemCollected(this.collectedGemsCount);
          this.updateSquirrelGuide();
        }
      }
    });

    // 5. Movimiento del jugador
    let isMoving = false;
    if (this.cameraMode === 'explore') {
      let forward = 0;
      let right = 0;
      if (this.keys['w'] || this.keys['arrowup']) forward += 1;
      if (this.keys['s'] || this.keys['arrowdown']) forward -= 1;
      if (this.keys['a'] || this.keys['arrowleft']) right -= 1;
      if (this.keys['d'] || this.keys['arrowright']) right += 1;

      if (forward !== 0 || right !== 0) {
        this.tutorialState.movedWASD = true;
        this.updateSquirrelGuide();

        const fVec = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
        const rVec = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
        const moveDir = new THREE.Vector3()
          .addScaledVector(fVec, forward)
          .addScaledVector(rVec, right)
          .normalize();

        const speed = 6.2;
        let nextX = THREE.MathUtils.clamp(
          this.explorer.group.position.x + moveDir.x * speed * dt,
          -16,
          16
        );
        let nextZ = THREE.MathUtils.clamp(
          this.explorer.group.position.z + moveDir.z * speed * dt,
          -40,
          36
        );

        // 1. COLISIÓN CON LA FUENTE: fx = -5.8, fz = 14.5, radio = 4.45 (impide meterse en la cuenca de agua o hundirse)
        const fx = -5.8;
        const fz = 14.5;
        const distFountain = Math.hypot(nextX - fx, nextZ - fz);
        if (distFountain < 4.45) {
          const angle = Math.atan2(nextZ - fz, nextX - fx);
          nextX = fx + Math.cos(angle) * 4.45;
          nextZ = fz + Math.sin(angle) * 4.45;
        }

        // 2. COLISIÓN CON KAEL: kx = -1.8, kz = 15.2, radio = 0.85 (evita solaparse físicamente con el NPC)
        const kx = -1.8;
        const kz = 15.2;
        const distKael = Math.hypot(nextX - kx, nextZ - kz);
        if (distKael < 0.85) {
          const angle = Math.atan2(nextZ - kz, nextX - kx);
          nextX = kx + Math.cos(angle) * 0.85;
          nextZ = kz + Math.sin(angle) * 0.85;
        }

        this.explorer.group.position.x = nextX;
        this.explorer.group.position.z = nextZ;

        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetAngle - this.explorer.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.explorer.group.rotation.y += diff * Math.min(1, dt * 11);

        isMoving = true;
      }

      const px = this.explorer.group.position.x;
      const pz = this.explorer.group.position.z;
      this.explorer.group.position.y = this.getTerrainHeight(px, pz);

      const deltaM = this.explorer.group.position.distanceTo(this.lastPos);
      this.distanceWalkedMeters += deltaM;
      this.lastPos.copy(this.explorer.group.position);

      if (pz < 16.5 && !this.tutorialState.reachedFountain) {
        this.tutorialState.reachedFountain = true;
        this.squirrel.triggerCheer();
        this.updateSquirrelGuide();
        if (this.onNearStationCallback) this.onNearStationCallback('mision-1-agua');
      }
    }

    this.explorer.update(dt, isMoving, this.camera.position);
    this.squirrel.update(
      dt,
      this.explorer.group.position,
      this.explorer.group.rotation.y,
      isMoving
    );

    // Animación de Kael el guardián (respiración y mirada atenta al jugador si está cerca)
    if (this.kael) {
      this.kael.group.position.y = this.getTerrainHeight(-1.8, 15.2) + Math.sin(elapsed * 2.2) * 0.012;
      const distToPlayer = this.explorer.group.position.distanceTo(this.kael.group.position);
      if (distToPlayer < 7.5) {
        const dx = this.explorer.group.position.x - this.kael.group.position.x;
        const dz = this.explorer.group.position.z - this.kael.group.position.z;
        const targetHeadAngle = Math.atan2(dx, dz) - this.kael.group.rotation.y;
        this.kael.head.rotation.y = THREE.MathUtils.clamp(targetHeadAngle, -0.9, 0.9);
      } else {
        this.kael.head.rotation.y = Math.sin(elapsed * 1.4) * 0.12;
      }
    }

    // Proyección en pantalla de Chispa la Ardilla (para diálogo 3D posicionado directamente sobre su cabeza)
    if (this.onSquirrelScreenUpdate) {
      const squirrelWorldPos = new THREE.Vector3();
      this.squirrel.group.getWorldPosition(squirrelWorldPos);
      squirrelWorldPos.y += 0.85;

      const proj = squirrelWorldPos.clone().project(this.camera);
      const isVisible =
        proj.z < 1.0 &&
        proj.x >= -1.1 &&
        proj.x <= 1.1 &&
        proj.y >= -1.1 &&
        proj.y <= 1.1;

      const screenX = (proj.x * 0.5 + 0.5) * this.container.clientWidth;
      const screenY = (-(proj.y * 0.5) + 0.5) * this.container.clientHeight;

      this.onSquirrelScreenUpdate({
        x: screenX,
        y: screenY,
        visible: isVisible,
      });
    }

    // 6. Cámara en tercera persona suave
    if (this.cameraMode === 'explore') {
      const p = this.explorer.group.position;
      const camY = p.y + 1.65 + this.cameraPitch * 3.8;
      const camX = p.x + Math.sin(this.cameraYaw) * this.camDistance;
      const camZ = p.z + Math.cos(this.cameraYaw) * this.camDistance;

      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(1, dt * 7.5));
      this.targetLookAt.lerp(
        new THREE.Vector3(p.x, p.y + 1.35, p.z),
        Math.min(1, dt * 8.5)
      );
      this.camera.lookAt(this.targetLookAt);
    } else if (this.cameraMode === 'wardrobe') {
      const p = this.explorer.group.position;
      this.camera.position.lerp(
        new THREE.Vector3(p.x, p.y + 1.25, p.z + 3.2),
        Math.min(1, dt * 6)
      );
      this.camera.lookAt(new THREE.Vector3(p.x, p.y + 1.05, p.z));
    }

    this.renderer.render(this.scene, this.camera);
  };

  public setPaused(value: boolean) {
    this.paused = value;
    if (!value) this.onResize();
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public rotateWardrobeCharacter(deltaAngle: number) {
    this.wardrobeAngle += deltaAngle;
    this.explorer.group.rotation.y = this.wardrobeAngle;
  }

  public updateWaterPlantState(filters: number, _valveSum: number) {
    if (this.fountainWaterMesh) {
      this.fountainWaterMesh.scale.y = 1.0 + filters * 0.2;
    }
  }

  public updateBridgeState(_beams: number, _pillars: number, _planks: number) {
    if (this.bridgeGroup) {
      this.bridgeGroup.visible = true;
      this.bridgeBuilt = true;
    }
  }

  public getWalkedDistanceKm(): string {
    return (this.distanceWalkedMeters / 1000).toFixed(1);
  }

  public dispose() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
