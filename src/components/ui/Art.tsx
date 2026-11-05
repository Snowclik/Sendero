/**
 * Art.tsx — ilustraciones vectoriales inline (cero archivos, cero red).
 * Chispa la ardilla es la voz del juego: guía, pistas y celebraciones.
 */
import type { FunctionalComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** Anima un número hacia su nuevo valor (las transiciones CSS no animan atributos SVG como height). */
export function useTween(target: number, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const cur = a + (target - a) * e;
      from.current = cur;
      setV(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export type SquirrelMood = 'idle' | 'happy' | 'thinking';

export const SquirrelArt: FunctionalComponent<{ mood?: SquirrelMood; size?: number }> = ({ mood = 'idle', size = 72 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
    {/* Cola */}
    <path d="M86 104c22-6 30-30 20-52-8-17-30-20-34-6 12-2 20 8 16 20-3 9-10 14-10 26z" fill="#e8833a" />
    <path d="M92 96c12-6 16-20 10-34-4-9-14-12-18-6 8 0 12 8 9 16-2 7-6 12-1 24z" fill="#f6b26b" />
    {/* Orejas */}
    <path d="M34 40 30 14l20 18z" fill="#e8833a" />
    <path d="M36 34 34 20l10 10z" fill="#f9a8b4" />
    <path d="M78 32 90 12l-4 28z" fill="#e8833a" />
    <path d="M82 30l6-12-2 16z" fill="#f9a8b4" />
    {/* Cabeza */}
    <circle cx="58" cy="62" r="34" fill="#f08c3c" />
    <ellipse cx="58" cy="78" rx="21" ry="15" fill="#fde7c8" />
    {/* Ojos */}
    {mood === 'happy' ? (
      <>
        <path d="M40 58q6-7 12 0" stroke="#3b2a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M64 58q6-7 12 0" stroke="#3b2a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <ellipse cx="46" cy="58" rx="6" ry="7.5" fill="#3b2a1a" />
        <ellipse cx="70" cy="58" rx="6" ry="7.5" fill="#3b2a1a" />
        <circle cx="48" cy="55" r="2.2" fill="#fff" />
        <circle cx="72" cy="55" r="2.2" fill="#fff" />
      </>
    )}
    {mood === 'thinking' && <path d="M62 44q8-5 15 0" stroke="#7a4a1f" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
    {/* Mejillas, nariz, dientes */}
    <circle cx="36" cy="72" r="5" fill="#f9a8b4" opacity=".8" />
    <circle cx="80" cy="72" r="5" fill="#f9a8b4" opacity=".8" />
    <ellipse cx="58" cy="70" rx="5" ry="3.5" fill="#7a4a1f" />
    {mood === 'happy' ? (
      <path d="M50 78q8 9 16 0z" fill="#7a2e1f" />
    ) : (
      <rect x="54" y="76" width="8" height="7" rx="2" fill="#fff" />
    )}
    {mood === 'thinking' && (
      <g>
        <ellipse cx="100" cy="30" rx="9" ry="11" fill="#b7793f" />
        <path d="M90 24q10-10 20 0z" fill="#7a4a1f" />
      </g>
    )}
  </svg>
);

/** Filtro de agua: apagado gris, encendido azul con gota. */
export const FilterArt: FunctionalComponent<{ on: boolean; size?: number }> = ({ on, size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="10" y="10" width="28" height="32" rx="6" fill={on ? '#38bdf8' : '#cbd5e1'} />
    <ellipse cx="24" cy="10" rx="14" ry="5" fill={on ? '#7dd3fc' : '#e2e8f0'} />
    <path d="M24 18c-5 7-7 10-7 13a7 7 0 0 0 14 0c0-3-2-6-7-13z" fill={on ? '#fff' : '#94a3b8'} />
    {on && <circle cx="21" cy="30" r="2" fill="#38bdf8" />}
  </svg>
);

/** Viga de madera. */
export const BeamArt: FunctionalComponent<{ on: boolean; size?: number }> = ({ on, size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="4" y="16" width="40" height="16" rx="4" fill={on ? '#c28a52' : '#d6d3d1'} />
    <path d="M10 21h14M18 27h18" stroke={on ? '#9a6a3c' : '#a8a29e'} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="24" r="2" fill={on ? '#7a4a1f' : '#a8a29e'} />
    <circle cx="39" cy="24" r="2" fill={on ? '#7a4a1f' : '#a8a29e'} />
  </svg>
);

/** Tanque con nivel de agua y marca objetivo. */
export const TankArt: FunctionalComponent<{ value: number; max: number; mark?: number; width?: number; height?: number; label?: string }> = ({
  value: target, max, mark, width = 90, height = 130, label,
}) => {
  const value = useTween(target); // el agua sube de verdad, no aparece de golpe
  const inner = height - 24;
  const lvl = Math.min(1.08, value / max);
  const waterH = inner * lvl;
  const markY = mark !== undefined ? 12 + inner - (inner * mark) / max : null;
  const over = mark !== undefined && value > mark;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={label} role="img">
      <rect x="6" y="6" width={width - 12} height={height - 12} rx="14" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="4" />
      <clipPath id={`tank-${width}-${height}`}>
        <rect x="10" y="10" width={width - 20} height={height - 20} rx="10" />
      </clipPath>
      <g clipPath={`url(#tank-${width}-${height})`}>
        <rect x="0" y={12 + inner - waterH} width={width} height={waterH + 12} fill={over ? '#fda4af' : '#38bdf8'} />
        <path d={`M0 ${12 + inner - waterH} q ${width / 4} -6 ${width / 2} 0 t ${width / 2} 0 v 6 h -${width} z`} fill="#7dd3fc" />
      </g>
      {markY !== null && (
        <>
          <line x1="4" x2={width - 4} y1={markY} y2={markY} stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 4" />
          <circle cx={width - 8} cy={markY} r="6" fill="#f59e0b" />
        </>
      )}
    </svg>
  );
};

/** Rueda de válvula que gira según su valor. */
export const ValveArt: FunctionalComponent<{ value: number; size?: number }> = ({ value, size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <g style={{ transform: `rotate(${value * 60}deg)`, transformOrigin: '32px 32px', transition: 'transform .3s ease' }}>
      <circle cx="32" cy="32" r="24" fill="none" stroke="#f59e0b" strokeWidth="7" />
      <path d="M32 8v48M8 32h48" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="8" r="5" fill="#b45309" />
    </g>
    <circle cx="32" cy="32" r="7" fill="#b45309" />
  </svg>
);

/** Manómetro de semicírculo: aguja según la suma, zona verde en la meta. */
export const GaugeArt: FunctionalComponent<{ value: number; max: number; target: number; width?: number }> = ({ value, max, target, width = 200 }) => {
  const ang = (v: number) => Math.PI * (1 - Math.min(v, max) / max);
  const pt = (v: number, r: number) => [100 + r * Math.cos(ang(v)), 100 - r * Math.sin(ang(v))];
  const [nx, ny] = pt(value, 70);
  const [g1x, g1y] = pt(target - 0.5, 80);
  const [g2x, g2y] = pt(target + 0.5, 80);
  const ok = value === target;
  return (
    <svg width={width} viewBox="0 0 200 118" role="img" aria-label={`Presión ${value} de ${target}`}>
      <path d="M20 100a80 80 0 0 1 160 0" fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
      <path d={`M${g1x} ${g1y}A80 80 0 0 1 ${g2x} ${g2y}`} fill="none" stroke="#22c55e" strokeWidth="18" />
      <line x1="100" y1="100" x2={nx} y2={ny} stroke={ok ? '#16a34a' : value > target ? '#f43f5e' : '#f59e0b'} strokeWidth="7" strokeLinecap="round" style={{ transition: 'all .35s ease' }} />
      <circle cx="100" cy="100" r="11" fill="#334155" />
    </svg>
  );
};

/** Regla horizontal para longitudes (vigas sobre el río). */
export const RulerArt: FunctionalComponent<{ value: number; target: number; step: number }> = ({ value, target, step }) => {
  const max = Math.max(target * 1.5, value);
  const W = 300;
  const px = (v: number) => 10 + (v / max) * (W - 20);
  return (
    <svg viewBox={`0 0 ${W} 70`} className="w-full" role="img" aria-label={`${value} de ${target}`}>
      <rect x={px(0)} y="34" width={px(target) - px(0)} height="26" rx="6" fill="#7dd3fc" />
      {Array.from({ length: Math.round(value / step) }).map((_, i) => (
        <rect key={i} x={px(i * step) + 1} y="24" width={px(step) - px(0) - 2} height="14" rx="3" fill={(i + 1) * step > target ? '#fda4af' : '#c28a52'} stroke="#9a6a3c" strokeWidth="1.5" />
      ))}
      <rect x="0" y="20" width="10" height="44" rx="3" fill="#86efac" />
      <rect x={px(target)} y="20" width="10" height="44" rx="3" fill="#86efac" />
    </svg>
  );
};

/** Botella de agua para la mochila de emergencia. */
export const BottleArt: FunctionalComponent<{ on: boolean; size?: number }> = ({ on, size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="19" y="4" width="10" height="6" rx="2" fill={on ? '#0369a1' : '#94a3b8'} />
    <path d="M17 12h14l2 6v22a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V18z" fill={on ? '#7dd3fc' : '#e2e8f0'} stroke={on ? '#0ea5e9' : '#cbd5e1'} strokeWidth="2" />
    {on && <rect x="17" y="24" width="14" height="18" rx="2" fill="#38bdf8" />}
  </svg>
);

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Miniatura de una prenda del vestuario (dibujo simple con el color de la prenda). */
export const ItemThumb: FunctionalComponent<{ cat: string; id: string; color: number; size?: number }> = ({ cat, id, color, size = 56 }) => {
  const c = hex(color);
  const dark = 'rgba(0,0,0,.18)';
  let art;
  if (cat === 'hat') {
    art =
      id === 'ninguno' ? <path d="M14 34l20-20M14 14l20 20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      : id === 'gorra' ? <><path d="M10 30a14 14 0 0 1 28 0z" fill={c} /><rect x="24" y="28" width="18" height="5" rx="2.5" fill={dark} /></>
      : id === 'gorro' ? <><path d="M10 32a14 14 0 0 1 28 0z" fill={c} /><rect x="9" y="30" width="30" height="6" rx="3" fill="#fff" /><circle cx="24" cy="15" r="4" fill="#fff" /></>
      : id === 'casco' ? <><path d="M10 31a14 14 0 0 1 28 0z" fill={c} /><rect x="6" y="30" width="36" height="5" rx="2.5" fill="#eab308" /><rect x="22" y="17" width="4" height="13" fill="#fde047" /></>
      : <><ellipse cx="24" cy="32" rx="20" ry="6" fill={c} /><rect x="14" y="16" width="20" height="16" rx="4" fill={c} /><rect x="14" y="25" width="20" height="4" fill="#1f2937" /></>;
  } else if (cat === 'shirt') {
    art = (
      <>
        <path d="M16 10l-9 6 4 8 5-3v19h16V21l5 3 4-8-9-6c-1 3-4 5-8 5s-7-2-8-5z" fill={c} />
        {id === 'chaleco' && <><rect x="16" y="25" width="16" height="3" fill="#fef08a" /><rect x="16" y="32" width="16" height="3" fill="#fef08a" /></>}
      </>
    );
  } else if (cat === 'pants') {
    art = <path d="M14 8h20l2 32h-8l-4-20-4 20h-8z" fill={c} />;
  } else if (cat === 'shoes') {
    art = id === 'botas'
      ? <path d="M14 8h10v22h12a4 4 0 0 1 4 4v6H10V12z" fill={c} />
      : <path d="M8 24h14l4 6h12a4 4 0 0 1 4 4v4H8z" fill={c} />;
  } else if (cat === 'bag') {
    art = id === 'ninguna'
      ? <path d="M14 34l20-20M14 14l20 20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      : <><rect x="12" y="12" width="24" height="28" rx="6" fill={c} /><path d="M18 12a6 6 0 0 1 12 0" stroke={c} strokeWidth="3" fill="none" /><rect x="16" y="26" width="16" height="8" rx="2" fill={dark} />{id === 'kit' && <path d="M24 17v8M20 21h8" stroke="#fff" strokeWidth="3" />}</>;
  } else if (cat === 'skin') {
    art = <><circle cx="24" cy="24" r="15" fill={c} /><circle cx="19" cy="22" r="2" fill="#1e293b" /><circle cx="29" cy="22" r="2" fill="#1e293b" /><path d="M19 29q5 4 10 0" stroke="#7a4a1f" strokeWidth="2" fill="none" /></>;
  } else {
    art = <><circle cx="24" cy="26" r="13" fill="#e0ac7e" /><path d="M10 24a14 14 0 0 1 28 0v-2a14 12 0 0 0-28 0z" fill={c} /><rect x="10" y="12" width="28" height="10" rx="5" fill={c} /></>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {art}
    </svg>
  );
};
