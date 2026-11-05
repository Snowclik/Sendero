import * as THREE from 'three';
import { toonMat } from './toon';

/**
 * Chispa, la ardilla guía 3D compañera del explorador para estudiantes con TDAH:
 * - Acompaña al jugador corriendo y saltando a su lado por el sendero.
 * - Cola peluda curvada y animada que se menea al avanzar.
 * - Ofrece retroalimentación visual amigable, sin texto excesivo, con saltitos de alegría al cumplir objetivos.
 */
export class CompanionSquirrel3D {
  public group: THREE.Group;
  private bodyGroup: THREE.Group;
  private headGroup: THREE.Group;
  private tailGroup: THREE.Group;
  private leftEar: THREE.Mesh;
  private rightEar: THREE.Mesh;
  private leftPaw: THREE.Mesh;
  private rightPaw: THREE.Mesh;
  private leftFoot: THREE.Mesh;
  private rightFoot: THREE.Mesh;

  private animTime = 0;
  private jumpVelocity = 0;
  private jumpY = 0;
  private isCelebrating = false;
  private celebrateTimer = 0;

  constructor() {
    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    const furMat = toonMat({ color: 0xcc6622, rimStrength: 0.35 });      // Naranja castaño cálido
    const bellyMat = toonMat({ color: 0xffeedd, rimStrength: 0.25 });    // Pancita crema
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a110b });
    const noseMat = new THREE.MeshBasicMaterial({ color: 0x3d1a0a });
    const earTipMat = toonMat({ color: 0x994411, rimStrength: 0.2 });

    // 1. Cuerpo redondeado y rechoncho
    const bodyGeo = new THREE.SphereGeometry(0.24, 18, 16);
    bodyGeo.scale(0.85, 1.15, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    bodyMesh.position.y = 0.28;
    this.bodyGroup.add(bodyMesh);

    // Panza crema clara
    const bellyGeo = new THREE.SphereGeometry(0.18, 16, 14);
    bellyGeo.scale(0.72, 1.0, 0.5);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0, 0.26, 0.14);
    this.bodyGroup.add(bellyMesh);

    // 2. Cabeza expresiva
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.52, 0.05);
    this.bodyGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.2, 18, 16);
    headGeo.scale(1.05, 0.95, 1.0);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    this.headGroup.add(headMesh);

    // Mofletes crema
    const snoutGeo = new THREE.SphereGeometry(0.1, 14, 12);
    snoutGeo.scale(1.1, 0.8, 1.1);
    const snoutMesh = new THREE.Mesh(snoutGeo, bellyMat);
    snoutMesh.position.set(0, -0.04, 0.14);
    this.headGroup.add(snoutMesh);

    // Naricita negra
    const noseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), noseMat);
    noseMesh.position.set(0, -0.01, 0.23);
    this.headGroup.add(noseMesh);

    // Ojos anime negros grandes con brillo
    [-1, 1].forEach((dir) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), eyeMat);
      eye.position.set(dir * 0.1, 0.04, 0.16);
      eye.scale.set(1, 1.25, 0.5);

      const shine = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      shine.position.set(dir * 0.01, 0.012, 0.032);
      eye.add(shine);
      this.headGroup.add(eye);
    });

    // Orejas de ardilla con mechoncitos en las puntas
    const earGeo = new THREE.ConeGeometry(0.055, 0.14, 8);
    this.leftEar = new THREE.Mesh(earGeo, earTipMat);
    this.leftEar.position.set(-0.1, 0.18, -0.02);
    this.leftEar.rotation.z = 0.22;
    this.leftEar.rotation.x = -0.15;

    this.rightEar = new THREE.Mesh(earGeo, earTipMat);
    this.rightEar.position.set(0.1, 0.18, -0.02);
    this.rightEar.rotation.z = -0.22;
    this.rightEar.rotation.x = -0.15;
    this.headGroup.add(this.leftEar, this.rightEar);

    // 3. Patas delanteras (pequeñas, sostienen o bracean)
    const pawGeo = new THREE.SphereGeometry(0.05, 10, 10);
    pawGeo.scale(0.8, 1.2, 1.4);
    this.leftPaw = new THREE.Mesh(pawGeo, furMat);
    this.leftPaw.position.set(-0.11, 0.3, 0.14);
    this.rightPaw = new THREE.Mesh(pawGeo, furMat);
    this.rightPaw.position.set(0.11, 0.3, 0.14);
    this.bodyGroup.add(this.leftPaw, this.rightPaw);

    // 4. Patas traseras (para impulsarse y saltar)
    const footGeo = new THREE.SphereGeometry(0.07, 10, 10);
    footGeo.scale(0.9, 0.7, 1.4);
    this.leftFoot = new THREE.Mesh(footGeo, furMat);
    this.leftFoot.position.set(-0.14, 0.05, 0.04);
    this.rightFoot = new THREE.Mesh(footGeo, furMat);
    this.rightFoot.position.set(0.14, 0.05, 0.04);
    this.bodyGroup.add(this.leftFoot, this.rightFoot);

    // 5. Cola esponjosa y curvada de ardilla (construida en esferas decrecientes unidas)
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.14, -0.18);
    this.bodyGroup.add(this.tailGroup);

    const tailSegments = [
      { r: 0.11, y: 0.08, z: -0.08 },
      { r: 0.16, y: 0.22, z: -0.16 },
      { r: 0.22, y: 0.42, z: -0.18 },
      { r: 0.24, y: 0.62, z: -0.12 },
      { r: 0.21, y: 0.78, z: -0.02 },
      { r: 0.14, y: 0.86, z: 0.08 },
    ];

    tailSegments.forEach((seg, idx) => {
      const segMesh = new THREE.Mesh(
        new THREE.SphereGeometry(seg.r, 14, 12),
        idx >= 4 ? bellyMat : furMat
      );
      segMesh.position.set(0, seg.y, seg.z);
      segMesh.scale.set(1.15, 0.9, 1.25);
      this.tailGroup.add(segMesh);
    });

    // Pequeña bellota que puede sostener en la mano
    const acornGroup = new THREE.Group();
    acornGroup.position.set(0, 0.3, 0.24);
    acornGroup.scale.setScalar(0.7);
    const acornCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 8),
      toonMat({ color: 0x5a361a })
    );
    acornCap.scale.set(1, 0.6, 1);
    acornCap.position.y = 0.04;
    const acornNut = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.1, 8),
      toonMat({ color: 0x965725 })
    );
    acornNut.rotation.x = Math.PI;
    acornGroup.add(acornCap, acornNut);
    this.bodyGroup.add(acornGroup);
  }

  public triggerCheer() {
    this.isCelebrating = true;
    this.celebrateTimer = 2.2;
    this.jumpVelocity = 4.8;
  }

  public update(
    dt: number,
    targetPos: THREE.Vector3,
    targetRotY: number,
    isTargetMoving: boolean
  ) {
    this.animTime += dt;

    // Posición deseada: a la derecha del jugador y ligeramente adelante
    const offset = new THREE.Vector3(1.25, 0, 0.45);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotY);
    const desiredPos = targetPos.clone().add(offset);

    // Moverse suavemente hacia el objetivo
    const dist = this.group.position.distanceTo(desiredPos);
    const isMoving = dist > 0.18;

    if (dist > 0.04) {
      this.group.position.lerp(desiredPos, Math.min(1, dt * 7.0));
      // Orientarse hacia la dirección a la que avanza
      const angle = Math.atan2(
        desiredPos.x - this.group.position.x,
        desiredPos.z - this.group.position.z
      );
      if (isMoving) {
        let diff = angle - this.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.group.rotation.y += diff * Math.min(1, dt * 10);
      } else {
        // Mirar hacia donde mira el jugador
        let diff = targetRotY - this.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.group.rotation.y += diff * Math.min(1, dt * 6);
      }
    }

    // Animación de salto / rebote
    if (this.jumpY > 0 || this.jumpVelocity > 0) {
      this.jumpY += this.jumpVelocity * dt;
      this.jumpVelocity -= 16.0 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVelocity = 0;
      }
    }

    if (this.isCelebrating) {
      this.celebrateTimer -= dt;
      if (this.celebrateTimer <= 0) this.isCelebrating = false;
      this.tailGroup.rotation.z = Math.sin(this.animTime * 18) * 0.35;
      this.headGroup.rotation.y = Math.sin(this.animTime * 14) * 0.25;
      this.bodyGroup.position.y = this.jumpY + Math.abs(Math.sin(this.animTime * 12)) * 0.12;
      return;
    }

    if (isMoving || isTargetMoving) {
      // Saltitos rápidos de ardilla al desplazarse
      const hopCycle = this.animTime * 12.0;
      const hop = Math.abs(Math.sin(hopCycle)) * 0.09;
      this.bodyGroup.position.y = this.jumpY + hop;

      // Movimiento fluido de la cola
      this.tailGroup.rotation.x = -0.15 + Math.sin(hopCycle) * 0.22;
      this.tailGroup.rotation.z = Math.cos(hopCycle) * 0.18;

      // Patitas moviéndose
      this.leftFoot.position.z = 0.04 + Math.sin(hopCycle) * 0.06;
      this.rightFoot.position.z = 0.04 - Math.sin(hopCycle) * 0.06;
      this.leftPaw.rotation.x = Math.sin(hopCycle) * 0.4;
      this.rightPaw.rotation.x = -Math.sin(hopCycle) * 0.4;
    } else {
      // Reposo: respiración suave y meneo curioso de cola y orejitas
      this.bodyGroup.position.y = this.jumpY + Math.sin(this.animTime * 3.0) * 0.015;
      this.tailGroup.rotation.x = Math.sin(this.animTime * 2.2) * 0.08;
      this.tailGroup.rotation.z = Math.cos(this.animTime * 1.8) * 0.06;

      this.leftEar.rotation.z = 0.22 + Math.sin(this.animTime * 4.0) * 0.05;
      this.rightEar.rotation.z = -0.22 - Math.cos(this.animTime * 4.0) * 0.05;
    }
  }
}

