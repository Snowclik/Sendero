import type { FunctionalComponent, ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  ArrowRight, Award, Backpack, BookOpen, Bird, CalendarDays, CalendarX, Check, CloudRain, CookingPot, Droplet, Droplets,
  Footprints, Gauge, Hammer, HeartPulse, Home, Languages, Leaf, ListOrdered, Megaphone, MessageCircle, Minus, Mountain,
  Plus, ScrollText, Search, ShieldCheck, Sprout, Sun, User, UserCheck, Users, UserX, Volume2, Wind, X,
} from 'lucide-preact';
import type { IconKey, MicroStep, Mission } from '../data/missionsData';
import type { IsoWorld } from '../game/IsoWorld';
import { GlassButton } from './ui/GlassButton';
import { BreathingModal } from './ui/BreathingModal';
import { BeamArt, FilterArt, GaugeArt, RulerArt, SquirrelArt, TankArt, ValveArt, type SquirrelMood } from './ui/Art';
import { playClickSound, playHintSound, playStepCompleteSound, playSuccessSound, speakLocalText, stopSpeaking } from '../services/soundService';

const ICONS: Record<IconKey, any> = { Bird, CloudRain, Leaf, Backpack, Users, Footprints, Droplet, Sprout, Mountain, Home };
export const STATION_ICONS: Record<string, any> = {
  'mision-1-agua': Droplets,
  'mision-2-rumor': ScrollText,
  'mision-3-puente': Hammer,
  'mision-4-bosque': Sprout,
};
const STEP_ICON = (s: MicroStep) =>
  s.type === 'counter' ? (s.data.world === 'filters' ? Droplets : Hammer)
  : s.type === 'share' ? Droplet
  : s.type === 'balance' ? Gauge
  : s.type === 'sift' ? Search
  : s.type === 'order' ? ListOrdered
  : s.type === 'vocab' ? Languages
  : BookOpen;

const CHEERS = ['¡Lo lograste!', '¡Bien pensado!', '¡Eso es! Así se hace.', '¡Genial, explorador!'];
const ETHICS = 'Motor Local Offline Activo (Sin Internet) · Confianza: Reglas Verificadas por tu Maestro · Recuerda: Soy un guía digital y no reemplazo a tu maestro';

export interface MissionResult {
  mistakes: number;
  struggledSteps: number;
  duo: boolean;
}

interface Props {
  mission: Mission;
  world: IsoWorld | null;
  calm: boolean;
  sunsLeftAfter: number;
  onExit: () => void;
  onComplete: (r: MissionResult) => string[];
  onHintUsed: () => void;
}

// ----------------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------------
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function Highlight({ text, words, tone }: { text: string; words?: string[]; tone: string }) {
  if (!words?.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.map(esc).join('|')})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        words.some((w) => w.toLowerCase() === p.toLowerCase()) ? <mark key={i} className={`px-1 rounded-md font-extrabold ${tone}`}>{p}</mark> : <span key={i}>{p}</span>
      )}
    </>
  );
}

const sentences = (t: string) => t.split(/(?<=[.?!])\s+/).filter(Boolean);

function useKeys(map: Record<string, () => void>, deps: any[]) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, deps);
}

const Key = ({ children }: { children: ComponentChildren }) => (
  <kbd className="hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-lg bg-white/30 text-[11px] font-black">{children}</kbd>
);
const NumCap = ({ n }: { n: number }) => (
  <span className="w-9 h-9 shrink-0 rounded-xl bg-[#f6ecd6] shadow-[inset_0_-3px_0_#e6d3ab] flex items-center justify-center text-sm font-black text-slate-600">{n}</span>
);
const RoundBtn = ({ onClick, label, children, tone = 'bg-white text-slate-700 shadow-[0_4px_0_#e6d3ab]' }: { onClick: () => void; label: string; children: ComponentChildren; tone?: string }) => (
  <button onClick={() => { playClickSound(); onClick(); }} aria-label={label} className={`w-11 h-11 rounded-2xl flex items-center justify-center active:translate-y-[3px] active:shadow-none transition-all ${tone}`}>
    {children}
  </button>
);

interface StepProps<T extends MicroStep['type']> {
  step: Extract<MicroStep, { type: T }>;
  world: IsoWorld | null;
  calm: boolean;
  onCorrect: (extra?: string) => void;
  onWrong: (text: string) => void;
  locked: boolean;
}

// ----------------------------------------------------------------------------
// Micro-pasos ilustrados
// ----------------------------------------------------------------------------
const CounterStep: FunctionalComponent<StepProps<'counter'>> = ({ step, world, onCorrect, onWrong, locked }) => {
  const d = step.data;
  const [n, setN] = useState(d.start);
  const total = n * d.perUnit;
  const isWater = d.world === 'filters';
  useEffect(() => {
    if (isWater) world?.setFilters(n, d.perUnit);
    else world?.setBridge({ beams: n });
  }, [n]);
  const check = () => {
    if (locked) return;
    if (total === d.target) onCorrect();
    else onWrong(`Con ${n} ${n === 1 ? d.item[0] : d.item[1]} tenemos ${total} ${d.unit}. ${total < d.target ? '¡Todavía no llega!' : '¡Se pasa de la marca!'}`);
  };
  const set = (v: number) => !locked && setN(Math.max(d.min, Math.min(d.max, v)));
  useKeys({ '-': () => set(n - 1), ArrowDown: () => set(n - 1), '+': () => set(n + 1), ArrowUp: () => set(n + 1), Enter: check }, [n, locked]);
  const Art = isWater ? FilterArt : BeamArt;

  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex gap-3 items-center">
        {/* Casillas tipo inventario: toca hasta dónde encender */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          {Array.from({ length: d.max }).map((_, i) => {
            const on = i < n;
            return (
              <button
                key={i}
                onClick={() => { playClickSound(); set(on && i === n - 1 ? i : i + 1); }}
                aria-label={`${d.item[0]} ${i + 1} ${on ? 'encendido' : 'apagado'}`}
                aria-pressed={on}
                className={`cozy-tile aspect-[5/4] flex flex-col items-center justify-center ${on ? 'is-on' : ''}`}
              >
                <Art on={on} size={34} />
                <span className={`text-[11px] font-black ${on ? 'text-sky-700' : 'text-slate-400'}`}>{d.perUnit} {d.unit}</span>
              </button>
            );
          })}
        </div>
        {isWater && <TankArt value={total} max={d.target * 1.3} mark={d.target} width={76} height={124} label={`${total} litros de ${d.target}`} />}
      </div>
      {!isWater && <RulerArt value={total} target={d.target} step={d.perUnit} />}
      <div className="flex items-center justify-center gap-2 text-lg font-black text-slate-700">
        <span className="px-3 py-1 rounded-xl bg-white shadow-[0_3px_0_#e6d3ab]">{n} × {d.perUnit} {d.unit}</span>
        <span>=</span>
        <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-700 shadow-[0_3px_0_#7dd3fc]">{total} {d.unit}</span>
      </div>
      <GlassButton variant="emerald" size="lg" onClick={check} disabled={locked}>
        <Check className="w-5 h-5" /> Comprobar <Key>Enter</Key>
      </GlassButton>
    </div>
  );
};

const SECTOR_ICONS = [HeartPulse, Home, CookingPot];

const ShareStep: FunctionalComponent<StepProps<'share'>> = ({ step, onCorrect, onWrong, locked }) => {
  const d = step.data;
  const [v, setV] = useState<number | null>(null);
  const rest = d.total - (v ?? 0) * d.sectors.length;
  const check = () => {
    if (locked || v === null) return;
    if (rest === 0) onCorrect();
    else onWrong(rest > 0 ? `Si cada uno recibe ${v} ${d.unit}, sobran ${rest} ${d.unit} en el tanque grande.` : `Si cada uno recibe ${v} ${d.unit}, ¡faltan ${-rest} ${d.unit}!`);
  };
  const keys: Record<string, () => void> = { Enter: check };
  d.options.forEach((o, i) => (keys[String(i + 1)] = () => !locked && setV(o)));
  useKeys(keys, [v, locked]);

  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex items-end justify-between gap-2">
        <div className="flex flex-col items-center">
          <TankArt value={Math.max(0, rest)} max={d.total} width={76} height={120} label={`Quedan ${rest} litros`} />
          <span className={`text-sm font-black ${rest < 0 ? 'text-rose-500' : 'text-slate-600'}`}>{rest} {d.unit}</span>
        </div>
        <ArrowRight className="w-6 h-6 text-[#c8b48a] mb-12" />
        {d.sectors.map((s, i) => {
          const Icon = SECTOR_ICONS[i] ?? Home;
          return (
            <div key={s} className="flex flex-col items-center gap-1" title={s}>
              <span className="w-9 h-9 rounded-xl bg-white shadow-[0_3px_0_#e6d3ab] flex items-center justify-center text-emerald-600">
                <Icon className="w-5 h-5" />
              </span>
              <TankArt value={v ?? 0} max={12} width={56} height={84} label={`${s}: ${v ?? 0} litros`} />
              <span className="text-[11px] font-bold text-slate-500 text-center leading-tight max-w-[64px]">{s}</span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {d.options.map((o, i) => (
          <button key={o} onClick={() => { playClickSound(); !locked && setV(o); }} className={`cozy-tile py-2.5 flex flex-col items-center ${v === o ? 'is-on' : ''}`}>
            <span className="flex items-center gap-1 text-xl font-black text-slate-800"><Droplet className="w-4 h-4 text-sky-500" />{o}</span>
          </button>
        ))}
      </div>
      <GlassButton variant="emerald" size="lg" onClick={check} disabled={locked || v === null}>
        <Droplets className="w-5 h-5" /> Repartir <Key>Enter</Key>
      </GlassButton>
    </div>
  );
};

const BalanceStep: FunctionalComponent<StepProps<'balance'>> = ({ step, world, onCorrect, onWrong, locked }) => {
  const d = step.data;
  const [vals, setVals] = useState(d.valves.map((v) => v.initial));
  const sum = vals.reduce((a, b) => a + b, 0);
  useEffect(() => world?.setGauge(sum, d.target), [sum]);
  const set = (i: number, delta: number) =>
    !locked && setVals((p) => p.map((v, k) => (k === i ? Math.min(d.valves[k].max, Math.max(d.valves[k].min, v + delta)) : v)));
  const check = () => {
    if (locked) return;
    if (sum === d.target) onCorrect();
    else onWrong(`La aguja marca ${sum}. ${sum < d.target ? 'Le falta presión.' : '¡Demasiada presión!'}`);
  };
  useKeys({ Enter: check }, [sum, locked]);

  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex flex-col items-center">
        <GaugeArt value={sum} max={15} target={d.target} width={210} />
        <span className={`-mt-1 px-3 py-1 rounded-xl text-lg font-black ${sum === d.target ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-700'}`}>
          {vals.join(' + ')} = {sum}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {d.valves.map((v, i) => (
          <div key={v.name} className="cozy-tile p-2 flex flex-col items-center gap-1">
            <ValveArt value={vals[i]} size={58} />
            <span className="text-2xl font-black text-amber-600 leading-none">{vals[i]}</span>
            <div className="flex gap-1.5">
              <RoundBtn label={`Bajar válvula ${v.name}`} onClick={() => set(i, -1)}><Minus className="w-5 h-5" /></RoundBtn>
              <RoundBtn label={`Subir válvula ${v.name}`} onClick={() => set(i, 1)} tone="bg-amber-400 text-amber-950 shadow-[0_4px_0_#b45309]"><Plus className="w-5 h-5" /></RoundBtn>
            </div>
          </div>
        ))}
      </div>
      <GlassButton variant="emerald" size="lg" onClick={check} disabled={locked}>
        <Check className="w-5 h-5" /> Abrir el agua <Key>Enter</Key>
      </GlassButton>
    </div>
  );
};

const PaperNote: FunctionalComponent<{ children: ComponentChildren; tilt?: number; className?: string }> = ({ children, tilt = 0, className = '' }) => (
  <div className={`paper relative px-4 pt-5 pb-3 ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-5 rounded-sm bg-amber-200/80 rotate-[-3deg]" />
    {children}
  </div>
);

const TextBlocks: FunctionalComponent<{ step: Extract<MicroStep, { type: 'choice' }>; calm: boolean; onAllRead: () => void }> = ({ step, calm, onAllRead }) => {
  const blocks = step.data.textBlocks ?? [];
  const [shown, setShown] = useState(calm ? 1 : blocks.length);
  useEffect(() => {
    if (shown >= blocks.length) onAllRead();
  }, [shown]);
  if (!blocks.length) return null;
  return (
    <PaperNote tilt={-0.6}>
      {step.data.source && (
        <span className="absolute top-2 right-3 rotate-[4deg] inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 border-2 border-emerald-600/60 rounded-lg px-1.5 py-0.5">
          <ShieldCheck className="w-3 h-3" /> {step.data.badge}
        </span>
      )}
      <div className="flex flex-col gap-2 mt-2">
        {blocks.slice(0, shown).map((b, i) => {
          const Icon = b.icon ? ICONS[b.icon] : null;
          return (
            <div key={i} className="flex items-center gap-3 animate-fadeIn">
              {Icon && (
                <span className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </span>
              )}
              <p className="text-[17px] leading-snug font-semibold text-slate-800">
                <Highlight text={b.text} words={step.highlightWords} tone="bg-emerald-200/80 text-emerald-900" />
              </p>
            </div>
          );
        })}
      </div>
      {shown < blocks.length && (
        <GlassButton size="sm" variant="emerald" className="mt-3 w-full" onClick={() => setShown(shown + 1)}>
          Seguir <ArrowRight className="w-4 h-4" />
        </GlassButton>
      )}
      {step.data.source && <p className="mt-2 text-right text-xs font-bold italic text-slate-500">— {step.data.source}</p>}
    </PaperNote>
  );
};

const ChoiceStep: FunctionalComponent<StepProps<'choice'>> = ({ step, world, calm, onCorrect, onWrong, locked }) => {
  const d = step.data;
  const [read, setRead] = useState(!d.textBlocks?.length);
  const [wrong, setWrong] = useState<number[]>([]);
  const answer = (i: number) => {
    if (locked || !read) return;
    playClickSound();
    if (d.world === 'pillars') world?.setBridge({ pillars: i + 1 });
    if (i === d.correctIndex) {
      if (d.world === 'rails') world?.setBridge({ rails: true });
      onCorrect();
    } else {
      setWrong((w) => [...w, i]);
      onWrong(step.retryHint);
    }
  };
  const keys: Record<string, () => void> = {};
  d.options.forEach((_, i) => (keys[String(i + 1)] = () => answer(i)));
  useKeys(keys, [locked, read, step]);

  return (
    <div className="flex flex-col gap-3">
      <TextBlocks step={step} calm={calm} onAllRead={() => setRead(true)} />
      {d.rect && (
        <div className="cozy-inset p-3 flex flex-col items-center">
          <svg viewBox="0 0 260 100" className="w-full max-w-[260px]" aria-label={`Rectángulo de ${d.rect.w} por ${d.rect.h} ${d.rect.unit}`}>
            <rect x="50" y="20" width="160" height="70" rx="8" fill="#c28a52" stroke="#7a4a1f" strokeWidth="5" strokeDasharray="12 7" />
            <path d="M70 40h120M70 55h120M70 70h120" stroke="#9a6a3c" strokeWidth="3" />
            <text x="130" y="14" textAnchor="middle" style={{ font: '800 15px system-ui', fill: '#334155' }}>{d.rect.w} {d.rect.unit}</text>
            <text x="40" y="60" textAnchor="end" style={{ font: '800 15px system-ui', fill: '#334155' }}>{d.rect.h} {d.rect.unit}</text>
          </svg>
          <p className="text-xs font-bold text-slate-500">Lados de enfrente: iguales</p>
        </div>
      )}
      {read && (
        <>
          <p className="text-lg font-extrabold text-slate-800">{d.question}</p>
          <div className="flex flex-col gap-2">
            {d.options.map((o, i) => {
              const ok = locked && i === d.correctIndex;
              const bad = wrong.includes(i);
              return (
                <button key={o} onClick={() => answer(i)} className={`cozy-tile flex items-center gap-3 text-left px-3 py-2.5 text-[16px] font-bold text-slate-800 ${ok ? 'is-ok' : bad ? 'is-soft opacity-70' : ''}`}>
                  <NumCap n={i + 1} />
                  <span className="flex-1">{o}</span>
                  {ok && <Check className="w-6 h-6 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const SiftStep: FunctionalComponent<StepProps<'sift'>> = ({ step, onCorrect, onWrong, locked }) => {
  const [inspected, setInspected] = useState<string[]>([]);
  const all = inspected.length === step.data.messages.length;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {step.data.messages.map((m, k) => {
          const seen = inspected.includes(m.id);
          return (
            <PaperNote key={m.id} tilt={k ? 1 : -1} className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">{m.label}</span>
              <p className="text-[15px] font-semibold text-slate-800 leading-snug">"{m.content}"</p>
              {seen ? (
                <div className="flex flex-col gap-1 text-xs font-bold animate-fadeIn">
                  <span className={`flex items-center gap-1.5 ${m.reliable ? 'text-emerald-700' : 'text-rose-600'}`}>{m.reliable ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />} {m.author}</span>
                  <span className={`flex items-center gap-1.5 ${m.reliable ? 'text-emerald-700' : 'text-rose-600'}`}>{m.reliable ? <CalendarDays className="w-4 h-4" /> : <CalendarX className="w-4 h-4" />} {m.date}</span>
                  <span className={`flex items-center gap-1.5 ${m.reliable ? 'text-emerald-700' : 'text-rose-600'}`}>{m.reliable ? <MessageCircle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />} {m.tone}</span>
                </div>
              ) : (
                <button onClick={() => { playClickSound(); setInspected((p) => [...p, m.id]); }} className="self-center w-14 h-14 rounded-full bg-amber-400 text-amber-950 shadow-[0_4px_0_#b45309] active:translate-y-[3px] active:shadow-none flex items-center justify-center" aria-label={`Usar la lupa en ${m.label}`}>
                  <Search className="w-7 h-7" />
                </button>
              )}
              <GlassButton size="sm" variant="emerald" disabled={!all || locked} onClick={() => (m.reliable ? onCorrect(m.feedback) : onWrong(m.feedback))}>
                <ShieldCheck className="w-4 h-4" /> Es confiable
              </GlassButton>
            </PaperNote>
          );
        })}
      </div>
    </div>
  );
};

const OrderStep: FunctionalComponent<StepProps<'order'>> = ({ step, onCorrect, onWrong, locked }) => {
  const [slots, setSlots] = useState<string[]>([]);
  const items = step.data.items;
  const check = () => {
    if (locked || slots.length < items.length) return;
    if (slots.every((id, i) => id === step.data.correctOrder[i])) onCorrect();
    else {
      setSlots([]);
      onWrong(step.retryHint);
    }
  };
  useKeys({ Enter: check }, [slots, locked]);
  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex items-center justify-between gap-1">
        {[0, 1, 2].map((i) => {
          const it = items.find((x) => x.id === slots[i]);
          const Icon = it ? ICONS[it.icon] : null;
          return (
            <div key={i} className="contents">
              <button
                onClick={() => !locked && it && setSlots((s) => s.filter((x) => x !== it.id))}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-4 border-dashed ${it ? 'bg-emerald-100 border-emerald-400' : 'bg-white/60 border-[#d9c79f]'}`}
                aria-label={it ? `Quitar ${it.text}` : `Lugar ${i + 1}`}
              >
                <span className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-sky-500 text-white text-sm font-black flex items-center justify-center shadow-[0_3px_0_#0369a1]">{i + 1}</span>
                {Icon && <Icon className="w-9 h-9 text-emerald-600" />}
              </button>
              {i < 2 && <ArrowRight className="w-5 h-5 text-[#c8b48a] shrink-0" />}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {items.filter((it) => !slots.includes(it.id)).map((it) => {
          const Icon = ICONS[it.icon];
          return (
            <button key={it.id} onClick={() => { playClickSound(); !locked && setSlots((s) => [...s, it.id]); }} className="cozy-tile flex items-center gap-3 px-3 py-2.5 text-left font-bold text-slate-800">
              <span className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0"><Icon className="w-6 h-6" /></span>
              {it.text}
            </button>
          );
        })}
      </div>
      <GlassButton variant="emerald" size="lg" onClick={check} disabled={locked || slots.length < items.length}>
        <Check className="w-5 h-5" /> Listo <Key>Enter</Key>
      </GlassButton>
    </div>
  );
};

const LANG_TONE: Record<string, string> = { Ngäbere: 'bg-amber-400', Emberá: 'bg-teal-500', Inglés: 'bg-sky-500' };

const VocabStep: FunctionalComponent<StepProps<'vocab'>> = ({ step, onCorrect, onWrong, locked }) => {
  const [heard, setHeard] = useState<string[]>([]);
  const all = heard.length === step.data.words.length;
  const c = step.data.check;
  const answer = (i: number) => {
    if (locked || !all) return;
    if (i === c.correctIndex) onCorrect();
    else onWrong(step.retryHint);
  };
  const keys: Record<string, () => void> = {};
  c.options.forEach((_, i) => (keys[String(i + 1)] = () => answer(i)));
  useKeys(keys, [all, locked]);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        {step.data.words.map((w) => {
          const ok = heard.includes(w.word);
          return (
            <button
              key={w.word}
              aria-label={w.word}
              onClick={() => { speakLocalText(w.say, undefined, w.lang); if (!ok) setHeard((h) => [...h, w.word]); }}
              className={`cozy-tile overflow-hidden text-left ${ok ? 'is-ok' : ''}`}
            >
              <span className={`flex items-center justify-between px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white ${LANG_TONE[w.language] ?? 'bg-slate-400'}`}>
                {w.language} {ok ? <Check className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </span>
              <span className="block px-3 pt-2 text-2xl font-black text-slate-800">{w.word}</span>
              <span className="block px-3 pb-2 text-sm font-bold text-emerald-700">{ok ? w.meaning : '?'}</span>
            </button>
          );
        })}
      </div>
      {all ? (
        <div className="flex flex-col gap-2 animate-fadeIn">
          <p className="text-lg font-extrabold text-slate-800">{c.question}</p>
          <div className="grid grid-cols-3 gap-2">
            {c.options.map((o, i) => (
              <button key={o} onClick={() => answer(i)} className="cozy-tile py-2.5 flex flex-col items-center font-black text-slate-800">
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-1.5" aria-label={`Escuchadas ${heard.length} de ${step.data.words.length}`}>
          {step.data.words.map((w) => <span key={w.word} className={`w-3 h-3 rounded-full ${heard.includes(w.word) ? 'bg-emerald-500' : 'bg-[#e6d3ab]'}`} />)}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// Panel principal + Chispa (tutor socrático: pregunta -> pista visual -> ejemplo)
// ----------------------------------------------------------------------------
const ROLE_TONE = { A: 'bg-sky-500', B: 'bg-amber-400 !text-amber-950', AB: 'bg-emerald-500' };
const HINT_KEYS = ['level1_question', 'level2_visual', 'level3_analogy'] as const;

export const MissionPanel: FunctionalComponent<Props> = ({ mission, world, calm, sunsLeftAfter, onExit, onComplete, onHintUsed }) => {
  const [phase, setPhase] = useState<'intro' | 'step' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [duo, setDuo] = useState(false);
  const [stepMistakes, setStepMistakes] = useState(0);
  const [totals, setTotals] = useState({ mistakes: 0, struggled: 0 });
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(0); // 0 = sin pista, 1..3 nivel mostrado
  const [say, setSay] = useState<{ text: string; mood: SquirrelMood; n: number }>({ text: mission.shortStory.join(' '), mood: 'idle', n: 0 });
  const [breathing, setBreathing] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [sunsLeft] = useState(sunsLeftAfter);

  const step = mission.steps[idx];
  const isMath = mission.subject === 'Matemáticas';
  const tone = isMath ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900';
  const StationIcon = STATION_ICONS[mission.id] ?? Sun;
  const StepIcon = STEP_ICON(step);

  useEffect(() => () => stopSpeaking(), []);

  const talk = (text: string, mood: SquirrelMood = 'idle') => setSay((s) => ({ text, mood, n: s.n + 1 }));
  const roleText = (r?: 'A' | 'B' | 'AB') => (!duo || !r || !mission.duoRoles ? null : r === 'AB' ? 'Los dos juntos' : mission.duoRoles[r]);

  const showHint = (level: number) => {
    const l = Math.min(3, Math.max(1, level));
    playHintSound();
    setHint(l);
    talk(step.socraticHints[HINT_KEYS[l - 1]], 'thinking');
    onHintUsed();
  };

  const onCorrect = (extra?: string) => {
    playStepCompleteSound();
    setSolved(true);
    setHint(0);
    world?.cheer();
    talk(extra ?? CHEERS[(idx + totals.mistakes) % CHEERS.length], 'happy');
  };

  const onWrong = (text: string) => {
    const m = stepMistakes + 1;
    setStepMistakes(m);
    setTotals((t) => ({ ...t, mistakes: t.mistakes + 1 }));
    if (m === 2 && hint === 0) {
      // Al segundo intento Chispa se ofrece sola con la pregunta guía
      setHint(1);
      playHintSound();
      onHintUsed();
      talk(`¡Casi! ${step.socraticHints.level1_question}`, 'thinking');
    } else talk(text, 'thinking');
  };

  const startStep = (i: number, isDuo = duo) => {
    const s = mission.steps[i];
    const r = isDuo && s.duoRole && mission.duoRoles ? (s.duoRole === 'AB' ? '¡Turno de los dos!' : `Turno: ${mission.duoRoles[s.duoRole]}`) : '';
    talk(r || (i === 0 ? '¿Pista? ¡Tócame!' : '¡Otro más!'));
  };

  const next = () => {
    const struggled = totals.struggled + (stepMistakes >= 3 ? 1 : 0);
    setSolved(false);
    setHint(0);
    setStepMistakes(0);
    stopSpeaking();
    if (idx < 2) {
      setTotals((t) => ({ ...t, struggled }));
      setIdx(idx + 1);
      startStep(idx + 1);
      return;
    }
    playSuccessSound();
    world?.cheer();
    setNewBadges(onComplete({ mistakes: totals.mistakes, struggledSteps: struggled, duo }));
    setPhase('done');
    talk(mission.offScreenChallenge.companionPrompt, 'happy');
  };

  const begin = (isDuo: boolean) => {
    setDuo(isDuo);
    setPhase('step');
    startStep(0, isDuo);
  };

  useKeys({ Enter: () => solved && next() }, [solved, idx, stepMistakes, totals]);

  const tapSquirrel = () => {
    if (phase === 'step' && !solved) showHint(hint + 1 > 3 ? 3 : hint + 1);
    else speakLocalText(say.text);
  };

  const read = () => {
    const blocks = step.type === 'choice' ? (step.data.textBlocks ?? []).map((b) => b.text).join(' ') : '';
    speakLocalText(`${step.instruction} ${blocks}`);
  };

  const instructionLines = useMemo(() => (calm ? sentences(step.instruction) : [step.instruction]).filter(Boolean), [step, calm]);
  const role = phase === 'step' ? roleText(step.duoRole) : null;
  const stepProps = { world, calm, onCorrect, onWrong, locked: solved } as const;

  return (
    <>
      <section
        className="cozy-panel fixed z-30 left-2 right-2 bottom-2 max-h-[70vh] lg:max-h-none lg:left-auto lg:right-4 lg:top-24 lg:bottom-4 lg:w-[470px] flex flex-col animate-fadeIn"
        aria-label={mission.title}
      >
        {/* Cabecera: cinta con el nombre + pestañas de pasos */}
        <header className="relative px-4 pt-3 pb-2 flex flex-col items-center gap-2">
          <button onClick={() => { stopSpeaking(); onExit(); }} className="absolute right-3 top-3 w-10 h-10 rounded-2xl bg-white shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-500 active:translate-y-[3px] active:shadow-none" aria-label="Volver al valle">
            <X className="w-5 h-5" />
          </button>
          <span className="cozy-ribbon text-[15px] max-w-[80%] truncate">{mission.stationName}</span>
          {phase === 'step' && (
            <div className="flex items-center gap-2" aria-label={`Paso ${idx + 1} de 3`}>
              {mission.steps.map((s, i) => {
                const Icon = STEP_ICON(s);
                const state = i < idx ? 'done' : i === idx ? 'now' : 'next';
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${state === 'done' ? 'bg-emerald-500 text-white shadow-[0_4px_0_#047857]' : state === 'now' ? 'bg-sky-500 text-white shadow-[0_4px_0_#0369a1]' : 'bg-[#f6ecd6] text-[#c8b48a]'}`}>
                      {state === 'done' ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                    </span>
                    {i < 2 && <span className={`w-5 h-1.5 rounded-full ${i < idx ? 'bg-emerald-400' : 'bg-[#eadcbc]'}`} />}
                  </div>
                );
              })}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-3">
          {phase === 'intro' && (
            <div className="flex flex-col items-center gap-4 py-2 animate-fadeIn">
              <div className={`w-28 h-28 rounded-[32px] flex items-center justify-center ${isMath ? 'bg-amber-100 text-amber-500 shadow-[0_6px_0_#fcd34d]' : 'bg-emerald-100 text-emerald-600 shadow-[0_6px_0_#6ee7b7]'}`}>
                <StationIcon className="w-14 h-14" />
              </div>
              <h2 className="text-xl font-black text-slate-800 text-center">{mission.title}</h2>
              {mission.duoRoles ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={() => { playClickSound(); begin(false); }} className="cozy-tile py-4 flex flex-col items-center gap-2 font-black text-slate-800">
                    <User className="w-10 h-10 text-sky-600" /> Solo
                  </button>
                  <button onClick={() => { playClickSound(); begin(true); }} className="cozy-tile py-4 flex flex-col items-center gap-2 font-black text-slate-800">
                    <Users className="w-10 h-10 text-amber-500" /> Dos
                  </button>
                </div>
              ) : (
                <GlassButton size="xl" variant="primary" className="w-full" onClick={() => begin(false)}>
                  ¡Vamos! <ArrowRight className="w-5 h-5" />
                </GlassButton>
              )}
            </div>
          )}

          {phase === 'step' && (
            <>
              {role && (
                <div className={`self-center inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black text-white ${ROLE_TONE[step.duoRole!]}`}>
                  <Users className="w-4 h-4" /> {role}
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${isMath ? 'bg-amber-100 text-amber-500' : 'bg-emerald-100 text-emerald-600'}`}>
                  <StepIcon className="w-8 h-8" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{step.title}</h3>
                  {instructionLines.map((l) => (
                    <p key={l} className="text-[15px] leading-snug text-slate-700 font-medium">
                      <Highlight text={l} words={step.highlightWords} tone={tone} />
                    </p>
                  ))}
                </div>
                <RoundBtn label="Escuchar" onClick={read} tone="bg-sky-100 text-sky-700 shadow-[0_4px_0_#7dd3fc]"><Volume2 className="w-5 h-5" /></RoundBtn>
              </div>

              <div key={idx}>
                {step.type === 'counter' && <CounterStep step={step} {...stepProps} />}
                {step.type === 'share' && <ShareStep step={step} {...stepProps} />}
                {step.type === 'balance' && <BalanceStep step={step} {...stepProps} />}
                {step.type === 'choice' && <ChoiceStep step={step} {...stepProps} />}
                {step.type === 'sift' && <SiftStep step={step} {...stepProps} />}
                {step.type === 'order' && <OrderStep step={step} {...stepProps} />}
                {step.type === 'vocab' && <VocabStep step={step} {...stepProps} />}
              </div>

              {solved && (
                <GlassButton variant="primary" size="xl" onClick={next} className="animate-fadeIn">
                  {idx < 2 ? '¡Siguiente!' : '¡Terminar!'} <ArrowRight className="w-5 h-5" /> <Key>Enter</Key>
                </GlassButton>
              )}
            </>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-3 animate-fadeIn">
              <div className="relative w-28 h-28 rounded-full bg-amber-300 shadow-[0_6px_0_#d97706] flex items-center justify-center">
                <div className="absolute inset-2 rounded-full border-4 border-dashed border-amber-100" />
                <Award className="w-14 h-14 text-white" />
              </div>
              <span className="cozy-ribbon !bg-amber-500 text-lg">¡Estación restaurada!</span>
              {newBadges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {newBadges.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-black text-sm shadow-[0_3px_0_#fcd34d]">
                      <Award className="w-4 h-4" /> {b}
                    </span>
                  ))}
                </div>
              )}
              <div className="cozy-tile w-full p-3 flex items-center gap-3">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center"><Footprints className="w-8 h-8" /></span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">Fuera de la pantalla</p>
                  <p className="font-bold text-slate-800 leading-snug">{mission.offScreenChallenge.actionPrompt}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5" aria-label={`Soles restantes: ${sunsLeft}`}>
                {[0, 1, 2].map((i) => <Sun key={i} className={`w-7 h-7 ${i < sunsLeft ? 'text-amber-500 fill-amber-300' : 'text-[#e6d3ab]'}`} />)}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <GlassButton size="lg" onClick={() => setBreathing(true)}><Wind className="w-5 h-5" /> Respirar</GlassButton>
                <GlassButton size="lg" variant="primary" onClick={onExit}><Check className="w-5 h-5" /> Ya lo hice</GlassButton>
              </div>
            </div>
          )}
        </div>

        {/* Chispa: la guía vive aquí. Tocarla = siguiente pista (nunca la respuesta). */}
        <div className="flex items-end gap-2 px-3 pb-2 border-t-[3px] border-[#f6ecd6] pt-2">
          <button
            key={say.n}
            onClick={tapSquirrel}
            className={`shrink-0 -mb-1 ${say.mood === 'happy' ? 'anim-hop' : say.mood === 'thinking' ? 'anim-wiggle' : 'anim-bob'}`}
            aria-label={phase === 'step' && !solved ? 'Chispa: pedir una pista' : 'Chispa: escuchar'}
            title="Toca a Chispa"
          >
            <SquirrelArt mood={say.mood} size={64} />
          </button>
          <div className="relative flex-1 mb-2 rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[0_4px_0_#e6d3ab] px-3 py-2">
            <span className="absolute -left-2 bottom-4 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-[#f1e4c6] rotate-45" />
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {hint > 0 && (
                  <span className="inline-flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black">
                    Pista {hint} de 3
                  </span>
                )}
                <p className="text-[14px] font-bold text-slate-700 leading-snug">{say.text}</p>
              </div>
              <button onClick={() => speakLocalText(say.text)} className="p-1 rounded-lg text-sky-600 hover:bg-sky-50" aria-label="Escuchar a Chispa">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {hint > 0 && (
              <p className="mt-1 flex items-start gap-1 text-[9px] leading-tight text-indigo-700/70">
                <ShieldCheck className="w-3 h-3 shrink-0 mt-px" /> {ETHICS}
              </p>
            )}
          </div>
        </div>
      </section>

      <BreathingModal isOpen={breathing} onClose={() => setBreathing(false)} durationSeconds={mission.offScreenChallenge.breathingSeconds} />
    </>
  );
};
