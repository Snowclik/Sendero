import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
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
      <div className="absolute left-[6%] top-[9%] bottom-2 flex flex-col items-start gap-6 overflow-y-auto short:top-3 short:gap-3 shortwide:flex-row shortwide:items-center shortwide:gap-10 animate-fadeIn">
        {/* Logo */}
        <div className="relative select-none">
          <img
            src="/logo.png"
            alt="Sendero - Si pasa algo, yo sé qué hacer"
            className="w-[280px] sm:w-[380px] short:!w-[230px] h-auto object-contain pointer-events-none drop-shadow-lg"
          />
        </div>

        {/* Tarjeta de menú */}
        <div className="flex items-end gap-2">
          <nav className="rounded-[26px] bg-[#fdf3dd] p-2.5 shadow-[0_8px_0_rgba(146,112,52,.25),0_18px_40px_rgba(30,40,20,.3)] -rotate-1" aria-label="Menú principal">
            <ul className="rounded-[20px] border-[3px] border-dashed border-[#e3c9a0] px-3 py-3 flex flex-col items-stretch gap-1 min-w-[250px] short:min-w-[210px] short:py-1.5">
              {items.map((it, i) => (
                <li key={it.id}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    onClick={() => { playClickSound(); it.action(); }}
                    className={`w-full px-6 py-2 short:py-1 rounded-full text-2xl short:text-lg font-black transition-all ${sel === i ? 'bg-[#9cc39a] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.12)]' : 'text-[#2f4f6b] hover:bg-white/60'}`}
                  >
                    {it.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <span className="short:hidden"><SquirrelArt mood="happy" size={96} /></span>
        </div>
        {player && <p className="ml-2 font-black text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,.45)' }}>Jugando como {player}</p>}
      </div>

      <div className="[@media(pointer:coarse)]:hidden absolute right-5 bottom-5 inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-[#2f6b6b]/85 text-white font-black text-sm">
        <span className="w-7 h-7 rounded-full bg-white/90 text-[#2f6b6b] flex items-center justify-center text-[11px]">Enter</span> Elegir
      </div>
    </div>
  );
};
