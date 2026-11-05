import * as THREE from 'three';
import { toonMat } from './toon';

export interface CharacterOutfit {
  hat: 'cat-sunhat' | 'wizard' | 'ranger' | 'beret' | 'crown';
  glasses: 'round-amber' | 'sky-frames' | 'none';
  scarf: 'striped-orange' | 'emerald' | 'sky' | 'berry';
  coat: 'explorer-vest' | 'forest-cloak' | 'sunny-tunic' | 'poncho';
  boots: 'cat-boots' | 'forest-boots' | 'sky-boots';
  tool: 'bug-net' | 'magnifier' | 'wrench' | 'lantern';
}

export const DEFAULT_OUTFIT: CharacterOutfit = {
  hat: 'cat-sunhat',
  glasses: 'none',
  scarf: 'berry',
  coat: 'forest-cloak',
  boots: 'forest-boots',
  tool: 'lantern',
};

/**
 * Explorador 3D con anatomía y articulaciones reales (Three.js Mesh 3D volumétrico):
 * - Cabeza 3D esculpida con cabello anime por mechones, cuernos con puntas naranja fuego.
 * - Torso 3D entallado con faldón blanco acampanado y capa carmesí que ondea en 3D.
 * - Brazos y piernas articulados con ciclo de caminata y carrera natural en 3D (no 2D plano).
 */
export class ExplorerCharacter3D {
  public group: THREE.Group;
  private bodyGroup: THREE.Group;
  private headGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private capeGroup: THREE.Group;
  private leftEye: THREE.Mesh;
  private rightEye: THREE.Mesh;

  public currentOutfit: CharacterOutfit;
  private walkTime = 0;
  private idleTime = 0;
  private jumpVelocity = 0;
  private jumpY = 0;
  private isCelebrating = false;
  private celebrateTimer = 0;

  constructor(initialOutfit: CharacterOutfit = DEFAULT_OUTFIT) {
    this.currentOutfit = { ...initialOutfit };
    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    this.headGroup = new THREE.Group();
    this.leftArmGroup = new THREE.Group();
    this.rightArmGroup = new THREE.Group();
    this.leftLegGroup = new THREE.Group();
    this.rightLegGroup = new THREE.Group();
    this.capeGroup = new THREE.Group();
    this.leftEye = new THREE.Mesh();
    this.rightEye = new THREE.Mesh();

    this.buildVolumetricCharacter();
  }

  private buildVolumetricCharacter() {
    const skinMat = toonMat({ color: 0xfae2d0, rimStrength: 0.25 });
    const hairMat = toonMat({ color: 0xf0f5fa, rimStrength: 0.45 });     // Cabello blanco-plateado
    const tunicMat = toonMat({ color: 0x161a1e, rimStrength: 0.3 });     // Túnica carbón
    const skirtWhiteMat = toonMat({ color: 0xe6edf0, rimStrength: 0.4 });// Faldón blanco
    const capeMat = toonMat({ color: 0x7c1d28, rimStrength: 0.42 });     // Capa carmesí
    const bootMat = toonMat({ color: 0x2b1e16, rimStrength: 0.25 });
    const pantsMat = toonMat({ color: 0x121417, rimStrength: 0.2 });
    const hornDarkMat = toonMat({ color: 0x221c1e, rimStrength: 0.25 });
    const hornOrangeMat = toonMat({ color: 0xf97316, rimStrength: 0.55 });

    // =========================================================
    // 1. CABEZA, ROSTRO ANIME Y CABELLO ESCULPIDO EN 3D
    // =========================================================
    this.headGroup.position.set(0, 1.48, 0);
    this.bodyGroup.add(this.headGroup);

    // Cráneo con barbilla afilada anime
    const headGeo = new THREE.SphereGeometry(0.18, 20, 18);
    headGeo.scale(0.92, 1.05, 0.96);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Cuello
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 12), skinMat);
    neck.position.set(0, -0.15, -0.01);
    this.headGroup.add(neck);

    // Ojos anime
    const eyeGeo = new THREE.SphereGeometry(0.024, 10, 10);
    eyeGeo.scale(1.0, 1.35, 0.45);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e242d });
    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.065, 0.01, 0.165);
    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.065, 0.01, 0.165);
    this.headGroup.add(this.leftEye, this.rightEye);

    // Cabello principal esculpido con mechones que caen sobre la espalda y hombros
    const crownGeo = new THREE.SphereGeometry(0.198, 18, 16);
    crownGeo.scale(1.02, 1.05, 1.06);
    const hairCrown = new THREE.Mesh(crownGeo, hairMat);
    hairCrown.position.set(0, 0.035, -0.012);
    hairCrown.castShadow = true;
    this.headGroup.add(hairCrown);

    // Mechones afilados traseros y laterales
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI * 0.72 + (i / 8) * Math.PI * 0.85;
      const spikeGeo = new THREE.ConeGeometry(0.052, 0.28, 5);
      spikeGeo.translate(0, -0.1, 0);
      const spike = new THREE.Mesh(spikeGeo, hairMat);
      spike.position.set(Math.sin(angle) * 0.16, 0.0, Math.cos(angle) * 0.16);
      spike.rotation.y = angle;
      spike.rotation.x = 0.28;
      spike.castShadow = true;
      this.headGroup.add(spike);
    }

    // Flequillo frontal
    for (let i = -2; i <= 2; i++) {
      const bang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.15, 4), hairMat);
      bang.position.set(i * 0.038, 0.07, 0.165 - Math.abs(i) * 0.012);
      bang.rotation.x = 2.85;
      bang.rotation.z = i * 0.15;
      this.headGroup.add(bang);
    }

    // Cuernos estilizados curvados con punta naranja fuego
    [-1, 1].forEach((dir) => {
      const hornGroup = new THREE.Group();
      hornGroup.position.set(dir * 0.12, 0.15, 0.02);
      hornGroup.rotation.z = -dir * 0.38;
      hornGroup.rotation.x = -0.12;

      const baseHorn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.038, 0.12, 8),
        hornDarkMat
      );
      baseHorn.position.y = 0.05;
      hornGroup.add(baseHorn);

      const tipHorn = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.16, 8),
        hornOrangeMat
      );
      tipHorn.position.set(-dir * 0.02, 0.17, 0);
      tipHorn.rotation.z = dir * 0.32;
      hornGroup.add(tipHorn);

      this.headGroup.add(hornGroup);
    });

    // =========================================================
    // 2. TORSO, TÚNICA OSCURA Y FALDÓN BLANCO ANCHO
    // =========================================================
    const torsoMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.115, 0.38, 14),
      tunicMat
    );
    torsoMesh.position.set(0, 1.15, 0);
    torsoMesh.castShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Faldón negro acampanado
    const skirtGeo = new THREE.ConeGeometry(0.28, 0.44, 18, 1, true);
    const skirt = new THREE.Mesh(skirtGeo, tunicMat);
    skirt.position.set(0, 0.82, 0);
    skirt.castShadow = true;
    this.bodyGroup.add(skirt);

    // Borde inferior blanco grueso y ondulado (idéntico a la protagonista)
    const trimGeo = new THREE.CylinderGeometry(0.27, 0.31, 0.11, 18);
    const trim = new THREE.Mesh(trimGeo, skirtWhiteMat);
    trim.position.set(0, 0.58, 0);
    trim.castShadow = true;
    this.bodyGroup.add(trim);

    // Capa carmesí asimétrica en 3D
    this.capeGroup.position.set(0, 1.28, -0.08);
    const capeGeo = new THREE.BufferGeometry();
    const capeVerts = new Float32Array([
      -0.18, 0.0, 0.0,
       0.18, 0.0, 0.0,
      -0.24, -0.42, -0.06,

       0.18, 0.0, 0.0,
       0.26, -0.42, -0.06,
      -0.24, -0.42, -0.06,

      -0.24, -0.42, -0.06,
       0.26, -0.42, -0.06,
       0.12, -0.74, -0.14, // Punta larga asimétrica derecha
    ]);
    capeGeo.setAttribute('position', new THREE.BufferAttribute(capeVerts, 3));
    capeGeo.computeVertexNormals();

    const doubleCapeMat = toonMat({ color: 0x7c1d28, rimStrength: 0.45 });
    doubleCapeMat.side = THREE.DoubleSide;
    const capeMesh = new THREE.Mesh(capeGeo, doubleCapeMat);
    capeMesh.castShadow = true;
    this.capeGroup.add(capeMesh);

    // Hombrera envolvente carmesí
    const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.28, 16, 1, true), capeMat);
    cowl.position.set(0, 1.22, 0);
    cowl.castShadow = true;
    this.bodyGroup.add(cowl);
    this.bodyGroup.add(this.capeGroup);

    // =========================================================
    // 3. BRAZOS ARTICULADOS CON CODO NATURAL
    // =========================================================
    const armGeo = new THREE.CylinderGeometry(0.04, 0.034, 0.38, 10);
    armGeo.translate(0, -0.17, 0);
    const sleeveMat = toonMat({ color: 0xd8e0e6, rimStrength: 0.3 });

    this.leftArmGroup.position.set(-0.19, 1.28, 0);
    const lArm = new THREE.Mesh(armGeo, sleeveMat);
    lArm.castShadow = true;
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), skinMat);
    lHand.position.set(0, -0.37, 0);
    this.leftArmGroup.add(lArm, lHand);
    this.bodyGroup.add(this.leftArmGroup);

    this.rightArmGroup.position.set(0.19, 1.28, 0);
    const rArm = new THREE.Mesh(armGeo, sleeveMat);
    rArm.castShadow = true;
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), skinMat);
    rHand.position.set(0, -0.37, 0);
    this.rightArmGroup.add(rArm, rHand);
    this.bodyGroup.add(this.rightArmGroup);

    // =========================================================
    // 4. PIERNAS ARTICULADAS CON RODILLAS Y FLEXIÓN NATURAL
    // =========================================================
    const makeLegWithFoot = () => {
      const legRoot = new THREE.Group();
      // Muslo
      const thighGeo = new THREE.CylinderGeometry(0.05, 0.042, 0.34, 10);
      thighGeo.translate(0, -0.16, 0);
      const thigh = new THREE.Mesh(thighGeo, pantsMat);
      thigh.castShadow = true;
      legRoot.add(thigh);

      // Rodilla / Pantorrilla articulada
      const kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.31, 0);

      const calfGeo = new THREE.CylinderGeometry(0.042, 0.036, 0.33, 10);
      calfGeo.translate(0, -0.15, 0);
      const calf = new THREE.Mesh(calfGeo, pantsMat);
      calf.castShadow = true;
      kneeGroup.add(calf);

      // Bota
      const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.22, 10), bootMat);
      boot.position.y = -0.22;
      boot.castShadow = true;
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.06, 0.16), bootMat);
      sole.position.set(0, -0.31, 0.03);
      kneeGroup.add(boot, sole);

      legRoot.add(kneeGroup);
      return { legRoot, kneeGroup };
    };

    const leftLeg = makeLegWithFoot();
    this.leftLegGroup.position.set(-0.085, 0.68, 0);
    this.leftLegGroup.add(leftLeg.legRoot);
    this.bodyGroup.add(this.leftLegGroup);
    (this as any).leftKneeGroup = leftLeg.kneeGroup;

    const rightLeg = makeLegWithFoot();
    this.rightLegGroup.position.set(0.085, 0.68, 0);
    this.rightLegGroup.add(rightLeg.legRoot);
    this.bodyGroup.add(this.rightLegGroup);
    (this as any).rightKneeGroup = rightLeg.kneeGroup;
  }

  public applyOutfit(outfit: CharacterOutfit) {
    this.currentOutfit = { ...outfit };
  }

  public triggerJump() {
    if (this.jumpY <= 0.001) {
      this.jumpVelocity = 6.4;
    }
  }

  public triggerCelebration() {
    this.isCelebrating = true;
    this.celebrateTimer = 1.8;
    this.triggerJump();
  }

  public update(dt: number, isMoving: boolean, _cameraPos?: THREE.Vector3) {
    this.idleTime += dt;

    // Física de salto
    if (this.jumpY > 0 || this.jumpVelocity > 0) {
      this.jumpY += this.jumpVelocity * dt;
      this.jumpVelocity -= 18.0 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVelocity = 0;
      }
    }

    // Ondulación de la capa al viento
    const capeWind = Math.sin(this.idleTime * 3.4) * 0.09;
    const capeFlare = isMoving ? 0.38 + Math.sin(this.walkTime * 2) * 0.08 : 0.12;
    this.capeGroup.rotation.x = THREE.MathUtils.lerp(
      this.capeGroup.rotation.x,
      capeFlare + capeWind,
      dt * 8
    );
    this.capeGroup.rotation.z = Math.sin(this.idleTime * 2.5) * 0.04;

    if (this.isCelebrating) {
      this.celebrateTimer -= dt;
      if (this.celebrateTimer <= 0) this.isCelebrating = false;
      this.leftArmGroup.rotation.z = 2.4 + Math.sin(this.idleTime * 14) * 0.25;
      this.rightArmGroup.rotation.z = -2.4 - Math.sin(this.idleTime * 14) * 0.25;
      this.bodyGroup.position.y = this.jumpY + Math.abs(Math.sin(this.idleTime * 12)) * 0.08;
      return;
    }

    if (isMoving) {
      // Ciclo de marcha fluido y biomecánico tipo anime
      this.walkTime += dt * 9.2;
      const swing = Math.sin(this.walkTime) * 0.58;

      // Muslos
      this.leftLegGroup.rotation.x = swing;
      this.rightLegGroup.rotation.x = -swing;

      // Flexión natural de rodillas: cuando la pierna va hacia adelante, la rodilla se dobla para alzar el pie
      const lKnee = (this as any).leftKneeGroup;
      const rKnee = (this as any).rightKneeGroup;
      if (lKnee) {
        // Doblar rodilla en la fase de elevación / avance
        lKnee.rotation.x = swing < 0 ? Math.abs(swing) * 1.15 : 0.05;
      }
      if (rKnee) {
        rKnee.rotation.x = -swing < 0 ? Math.abs(-swing) * 1.15 : 0.05;
      }

      // Brazos con codo relajado en contratendencia
      this.leftArmGroup.rotation.x = -swing * 0.65;
      this.rightArmGroup.rotation.x = swing * 0.65;
      this.leftArmGroup.rotation.z = 0.16;
      this.rightArmGroup.rotation.z = -0.16;

      // Balanceo de cadera y leve torsión de torso para movimiento natural
      this.bodyGroup.rotation.z = Math.sin(this.walkTime) * 0.045;
      this.bodyGroup.rotation.y = -Math.sin(this.walkTime) * 0.06;

      const bounce = Math.abs(Math.sin(this.walkTime * 2)) * 0.045;
      this.bodyGroup.position.y = this.jumpY + bounce;
      this.bodyGroup.rotation.x = 0.05; // Leve inclinación atlética hacia adelante
    } else {
      // Reposo: retorno suave de extremidades y respiración orgánica
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, dt * 10);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, dt * 10);

      const lKnee = (this as any).leftKneeGroup;
      const rKnee = (this as any).rightKneeGroup;
      if (lKnee) lKnee.rotation.x = THREE.MathUtils.lerp(lKnee.rotation.x, 0, dt * 10);
      if (rKnee) rKnee.rotation.x = THREE.MathUtils.lerp(rKnee.rotation.x, 0, dt * 10);

      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, dt * 10);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, dt * 10);
      this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, 0.1, dt * 8);
      this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, -0.1, dt * 8);

      this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, dt * 8);
      this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, dt * 8);

      const breath = Math.sin(this.idleTime * 2.2) * 0.016;
      this.bodyGroup.position.y = this.jumpY + breath;
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, dt * 8);
    }
  }
}

/**
 * Guardián NPC modelado en 3D volumétrico real
 */
export function createGuardianNPC(options: {
  hairColor: number;
  coatColor: number;
  sashColor: number;
}): { group: THREE.Group; head: THREE.Group; sash: THREE.Mesh } {
  const root = new THREE.Group();
  root.scale.setScalar(1.1);

  const skinMat = toonMat({ color: 0xfae2d0, rimStrength: 0.25 });
  const hairMat = toonMat({ color: options.hairColor, rimStrength: 0.45 });
  const coatMat = toonMat({ color: options.coatColor, rimStrength: 0.3 });
  const sashMat = toonMat({ color: options.sashColor, rimStrength: 0.4 });
  const bootMat = toonMat({ color: 0x3d2416, rimStrength: 0.25 });
  const goldMat = toonMat({ color: 0xd4a559, rimStrength: 0.5 });

  // Piernas
  [-0.09, 0.09].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.74, 10), coatMat);
    leg.position.set(x, 0.45, 0);
    leg.castShadow = true;
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.046, 0.34, 10), bootMat);
    boot.position.set(x, 0.17, 0);
    boot.castShadow = true;
    root.add(leg, boot);
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.52, 14), coatMat);
  torso.position.set(0, 1.1, 0);
  torso.castShadow = true;
  root.add(torso);

  // Faja carmesí asimétrica
  const sashMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.145, 0.14, 14), sashMat);
  sashMesh.position.set(0, 0.85, 0);
  root.add(sashMesh);

  const sashTail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.52, 10), sashMat);
  sashTail.position.set(-0.11, 0.62, 0.02);
  sashTail.rotation.z = 0.22;
  root.add(sashTail);

  // Brazos
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.44, 10), coatMat);
  lArm.position.set(-0.2, 1.12, 0);
  lArm.rotation.z = 0.25;
  const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.44, 10), coatMat);
  rArm.position.set(0.19, 1.12, 0.04);
  rArm.rotation.z = -0.16;
  rArm.rotation.x = -0.32;
  root.add(lArm, rArm);

  // Cabeza y cabello
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.54, 0);
  root.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), skinMat);
  head.scale.set(0.92, 1.06, 0.96);
  headGroup.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 14), hairMat);
  hair.position.set(0, 0.04, -0.01);
  headGroup.add(hair);

  // Coleta y mechones
  const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.38, 6), hairMat);
  ponytail.position.set(-0.06, -0.08, -0.14);
  ponytail.rotation.x = -0.45;
  headGroup.add(ponytail);

  return { group: root, head: headGroup, sash: sashMesh };
}
