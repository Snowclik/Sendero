/**
 * character.ts — explorador de bloques con ropa intercambiable.
 * Lo usan el mapa (IsoWorld) y la pantalla de vestuario (vista previa 3D).
 */
import * as THREE from 'three';
import { itemOf, type Outfit } from '../data/wardrobe';

export interface Character {
  group: THREE.Group;
  limbs: { legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D };
  apply: (o: Outfit) => void;
}

export function buildCharacter(outfit: Outfit): Character {
  const group = new THREE.Group();
  const mat = (color = 0xffffff) => new THREE.MeshLambertMaterial({ color });
  const box = (sx: number, sy: number, sz: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group, pivotTop = false) => {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    if (pivotTop) g.translate(0, -sy / 2, 0);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const skin = mat();
  const hair = mat();
  const shirt = mat();
  const pants = mat();
  const shoes = mat();
  const bagM = mat();

  // Piernas (con zapatos pegados para que se muevan al caminar)
  const legL = box(0.2, 0.45, 0.22, pants, -0.12, 0.45, 0, group, true);
  const legR = box(0.2, 0.45, 0.22, pants, 0.12, 0.45, 0, group, true);
  const shoeL = box(0.22, 0.1, 0.28, shoes, 0, -0.4, 0.03, legL);
  const shoeR = box(0.22, 0.1, 0.28, shoes, 0, -0.4, 0.03, legR);
  // Torso y brazos
  box(0.5, 0.5, 0.3, shirt, 0, 0.7, 0);
  const armL = box(0.15, 0.45, 0.18, shirt, -0.33, 0.92, 0, group, true);
  const armR = box(0.15, 0.45, 0.18, shirt, 0.33, 0.92, 0, group, true);
  box(0.13, 0.1, 0.16, skin, 0, -0.42, 0, armL);
  box(0.13, 0.1, 0.16, skin, 0, -0.42, 0, armR);
  // Chaleco reflectivo (franjas)
  const vest = new THREE.Group();
  box(0.52, 0.06, 0.32, mat(0xfef08a), 0, 0.62, 0, vest);
  box(0.52, 0.06, 0.32, mat(0xfef08a), 0, 0.78, 0, vest);
  group.add(vest);
  // Cabeza
  box(0.42, 0.42, 0.42, skin, 0, 1.17, 0);
  const hairTop = box(0.46, 0.14, 0.46, hair, 0, 1.4, 0);
  box(0.46, 0.2, 0.08, hair, 0, 1.28, -0.2);
  box(0.08, 0.08, 0.02, mat(0x1e293b), -0.09, 1.2, 0.215);
  box(0.08, 0.08, 0.02, mat(0x1e293b), 0.09, 1.2, 0.215);
  box(0.12, 0.04, 0.02, mat(0xb45309), 0, 1.08, 0.215);

  // Sombreros
  const hats: Record<string, THREE.Group> = {};
  const hat = (id: string, build: (g: THREE.Group) => void) => {
    const g = new THREE.Group();
    build(g);
    g.visible = false;
    group.add(g);
    hats[id] = g;
  };
  hat('gorra', (g) => {
    box(0.48, 0.16, 0.48, mat(0x0ea5e9), 0, 1.45, 0, g);
    box(0.4, 0.04, 0.22, mat(0x0284c7), 0, 1.38, 0.32, g);
  });
  hat('gorro', (g) => {
    box(0.48, 0.22, 0.48, mat(0xf43f5e), 0, 1.47, 0, g);
    box(0.12, 0.12, 0.12, mat(0xffffff), 0, 1.64, 0, g);
  });
  hat('casco', (g) => {
    box(0.5, 0.2, 0.5, mat(0xfacc15), 0, 1.48, 0, g);
    box(0.6, 0.04, 0.6, mat(0xeab308), 0, 1.38, 0.03, g);
    box(0.08, 0.06, 0.52, mat(0xfde047), 0, 1.6, 0, g);
  });
  hat('pintao', (g) => {
    box(0.82, 0.04, 0.82, mat(0xf5f0e1), 0, 1.4, 0, g);
    box(0.44, 0.22, 0.44, mat(0xf5f0e1), 0, 1.53, 0, g);
    box(0.46, 0.05, 0.46, mat(0x1f2937), 0, 1.46, 0, g);
  });

  // Mochilas
  const bag = box(0.36, 0.38, 0.14, bagM, 0, 0.72, -0.21);
  const cross = new THREE.Group();
  box(0.05, 0.18, 0.02, mat(0xffffff), 0, 0.74, -0.29, cross);
  box(0.18, 0.05, 0.02, mat(0xffffff), 0, 0.74, -0.29, cross);
  group.add(cross);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 })
  );
  shadow.position.y = 0.02;
  group.add(shadow);

  const apply = (o: Outfit) => {
    skin.color.setHex(itemOf('skin', o.skin).color);
    hair.color.setHex(itemOf('hair', o.hair).color);
    shirt.color.setHex(itemOf('shirt', o.shirt).color);
    pants.color.setHex(itemOf('pants', o.pants).color);
    shoes.color.setHex(itemOf('shoes', o.shoes).color);
    const boots = o.shoes === 'botas';
    shoeL.scale.y = shoeR.scale.y = boots ? 2.2 : 1;
    shoeL.position.y = shoeR.position.y = boots ? -0.34 : -0.4;
    vest.visible = o.shirt === 'chaleco';
    Object.entries(hats).forEach(([id, g]) => (g.visible = id === o.hat));
    hairTop.visible = o.hat === 'ninguno';
    bag.visible = o.bag !== 'ninguna';
    bagM.color.setHex(itemOf('bag', o.bag).color);
    cross.visible = o.bag === 'kit';
  };
  apply(outfit);
  return { group, limbs: { legL, legR, armL, armR }, apply };
}
