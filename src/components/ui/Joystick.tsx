import type { FunctionalComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';

/** Joystick táctil para celular: arrastra el botón y Chispa y tú caminan hacia allá. */
export const Joystick: FunctionalComponent<{ onMove: (x: number, y: number) => void }> = ({ onMove }) => {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 46; // recorrido máximo del botón en px

  const move = (e: PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y);
    if (d > R) { x = (x / d) * R; y = (y / d) * R; }
    setKnob({ x, y });
    onMove(x / R, y / R);
  };
  const end = () => { setKnob({ x: 0, y: 0 }); onMove(0, 0); };

  return (
    <div
      ref={base}
      className="fixed z-20 right-5 bottom-5 short:right-3 short:bottom-3 w-[136px] h-[136px] short:w-[112px] short:h-[112px] rounded-full bg-white/45 border-[4px] border-white/80 shadow-[0_6px_0_rgba(146,112,52,.22)] touch-none select-none"
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Joystick para caminar"
    >
      <span
        className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full bg-[#fffaf0] border-[4px] border-white shadow-[0_5px_0_rgba(146,112,52,.3)]"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
};
