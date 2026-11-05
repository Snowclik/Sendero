import type { FunctionalComponent } from 'preact';
import qrcode from 'qrcode-generator';

interface QrGeneratorProps {
  value: string;
  size?: number;
  title?: string;
}

/**
 * QR real y escaneable (ISO/IEC 18004) dibujado en SVG.
 * qrcode-generator va empaquetado en el binario: cero red, funciona en cualquier lector de QR.
 */
export const QrGeneratorSvg: FunctionalComponent<QrGeneratorProps> = ({ value, size = 200, title = 'Código QR del pasaporte' }) => {
  const qr = qrcode(0, 'M'); // versión automática, corrección media
  qr.addData(value, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 4;
  const total = n + quiet * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} role="img" aria-label={title} shapeRendering="crispEdges" className="rounded-xl">
      <rect width={total} height={total} fill="#ffffff" />
      <path d={d} fill="#0f172a" />
    </svg>
  );
};
