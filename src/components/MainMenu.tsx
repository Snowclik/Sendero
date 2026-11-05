import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Sprout } from 'lucide-preact';
import { SquirrelArt } from './ui/Art';
import { LINES } from '../data/lines';
import { playClickSound, sayText } from '../services/soundService';

export interface MenuItem {
  id: string;
  label: string;
  action: () => void;
}

/** Pantalla de inicio: logo sobre el valle + tarjeta de menú (flechas y Enter). */
export const MainMenu: FunctionalComponent<{ items: MenuItem[]; player?: string }> = ({ items, player }) => {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    sayText(LINES.menuHello);
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); playClickSound(); setSel((i) => (i + 1) % items.length); }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); playClickSound(); setSel((i) => (i - 1 + items.length) % items.length); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playClickSound(); items[sel]?.action(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [items, sel]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-r from-emerald-900/25 via-transparent to-transparent">
      <div className="absolute left-[6%] top-[9%] flex flex-col items-start gap-6 animate-fadeIn">
        {/* Logo */}
        <div className="relative select-none">
          <Sprout className="absolute -top-10 left-2 w-16 h-16 text-emerald-200 rotate-[-12deg] drop-shadow" />
          <h1
            className="text-[64px] sm:text-[96px] leading-none font-black text-white tracking-tight"
            style={{ WebkitTextStroke: '12px #2f5d3a', paintOrder: 'stroke fill', fontFamily: "'Arial Rounded MT Bold','Segoe UI Black','Segoe UI',system-ui,sans-serif", textShadow: '0 8px 0 rgba(30,60,35,.35)' }}
          >
            Sendero
          </h1>
          <p className="mt-2 ml-2 text-lg font-black text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,.45)' }}>
            Aprende qué hacer en cada emergencia
          </p>
        </div>

        {/* Tarjeta de menú */}
        <div className="flex items-end gap-2">
          <nav className="rounded-[26px] bg-[#fdf3dd] p-2.5 shadow-[0_8px_0_rgba(146,112,52,.25),0_18px_40px_rgba(30,40,20,.3)] -rotate-1" aria-label="Menú principal">
            <ul className="rounded-[20px] border-[3px] border-dashed border-[#e3c9a0] px-3 py-3 flex flex-col items-stretch gap-1 min-w-[250px]">
              {items.map((it, i) => (
                <li key={it.id}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    onClick={() => { playClickSound(); it.action(); }}
                    className={`w-full px-6 py-2 rounded-full text-2xl font-black transition-all ${sel === i ? 'bg-[#9cc39a] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.12)]' : 'text-[#2f4f6b] hover:bg-white/60'}`}
                  >
                    {it.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <SquirrelArt mood="happy" size={96} />
        </div>
        {player && <p className="ml-2 font-black text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,.45)' }}>Jugando como {player}</p>}
      </div>

      <div className="absolute right-5 bottom-5 inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-[#2f6b6b]/85 text-white font-black text-sm">
        <span className="w-7 h-7 rounded-full bg-white/90 text-[#2f6b6b] flex items-center justify-center text-[11px]">Enter</span> Elegir
      </div>
    </div>
  );
};
