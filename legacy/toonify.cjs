const fs = require('fs');
const path = require('path');

const files = ['src/three/WorldScene3D.ts', 'src/three/ExplorerCharacter3D.ts'];
for (const rel of files) {
  const p = path.join(__dirname, '..', rel);
  let c = fs.readFileSync(p, 'utf8');
  const before = (c.match(/new THREE\.MeshStandardMaterial\(/g) || []).length;
  if (rel.endsWith('WorldScene3D.ts')) {
    c = c.replace(/new THREE\.MeshStandardMaterial\(/g, 'toonMat(');
  }
  fs.writeFileSync(p, c, 'utf8');
  console.log(rel, 'reemplazos:', before);
}

