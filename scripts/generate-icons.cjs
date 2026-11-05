const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 32x32 valid PNG base64
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAM0lEQVR42u3PMQEAAAgEIPu/tC18hAEk4CfdV3AQEBAQEBAQEBAQEBAQEBAQEBAQEBA4dAD1+xT3K8R/OQAAAABJRU5ErkJggg==';
const pngBuf = Buffer.from(pngBase64, 'base64');

fs.writeFileSync(path.join(iconsDir, '32x32.png'), pngBuf);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), pngBuf);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), pngBuf);

// Minimal valid ICO header containing the PNG
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // Count = 1 image

icoHeader.writeUInt8(32, 6); // Width
icoHeader.writeUInt8(32, 7); // Height
icoHeader.writeUInt8(0, 8); // Color count
icoHeader.writeUInt8(0, 9); // Reserved
icoHeader.writeUInt16LE(1, 10); // Color planes
icoHeader.writeUInt16LE(32, 12); // Bits per pixel
icoHeader.writeUInt32LE(pngBuf.length, 14); // Image size
icoHeader.writeUInt32LE(22, 18); // Image offset

const icoBuf = Buffer.concat([icoHeader, pngBuf]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuf);

console.log('Iconos de Tauri generados exitosamente.');

