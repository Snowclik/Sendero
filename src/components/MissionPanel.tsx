import type { FunctionalComponent, ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  Activity, ArrowDownToLine, ArrowRight, Award, Backpack, BedDouble, BookOpen, CalendarDays, CalendarX, Check, Clock, CloudLightning, CloudRain,
  Delete, DoorClosed, DoorOpen, Droplet, Ear, Flame, Footprints, Hand, Home, ListOrdered, Megaphone, MessageCircle, Mountain, Phone,
  RotateCcw, School, Search, Shield, ShieldCheck, Shirt, Sun, TreePine, Unplug, User, UserCheck, Users, UserX, Volume2, Waves, Wind, X, Zap,
} from 'lucide-preact';
import type { IconKey, MicroStep, Mission, SkillId } from '../data/missionsData';
import { LINES } from '../data/lines';
import { fill, makeProblem, speechParts, type Params, type Problem } from '../game/problems';
import type { IsoWorld } from '../game/IsoWorld';
import { GlassButton } from './ui/GlassButton';
import { BreathingModal } from './ui/BreathingModal';
import { BottleArt, SquirrelArt, TankArt, type SquirrelMood } from './ui/Art';
import { playClickSound, playHintSound, playStepCompleteSound, playSuccessSound, say, sayText, stopSpeaking } from '../services/soundService';

const ICONS: Record<IconKey, any> = {
  Shield, Hand, ArrowDownToLine, BedDouble, School, Activity, Zap, Footprints, Mountain, Waves, Unplug, Backpack, CloudRain, Droplet,
  Home, Sun, CloudLightning, TreePine, Clock, Wind, DoorClosed, DoorOpen, Flame, Shirt, Megaphone, Phone,
};
export const STATION_ICONS: Record<string, any> = {
  'nivel-sismo': Activity,
  'nivel-inundacion': Waves,
  'nivel-tormenta': CloudLightning,
  'nivel-incendio': Flame,
};
const STEP_ICON = (s: MicroStep) =>
  s.type === 'counter' ? Backpack
  : s.type === 'share' ? DoorOpen
  : s.type === 'number' ? (s.data.gen === 'rising' ? Waves : CloudLightning)
  : s.type === 'sift' ? Search
  : s.type === 'order' ? ListOrdered
  : BookOpen;

const ETHICS = 'Motor Local Offline Activo (Sin Internet) · Confianza: Reglas Verificadas por tu Maestro · Recuerda: Soy un guía digital y no reemplazo a tu maestro';

export interface MissionResult {
  mistakes: number;
  struggledSteps: number;
  duo: boolean;
  hints: number;
}

interface Props {
  mission: Mission;
  world: IsoWorld | null;
  calm: boolean;
  sunsLeftAfter: number;
  onExit: () => void;
  onComplete: (r: MissionResult) => string[];
  onHintUsed: () => void;
  onSkill: (skills: SkillId[], ok: boolean, firstTry: boolean) => void;
  onChispaTap: () => void;
  onBreath: () => void;
}

/** Resultado de un intento: ok + frase de Chispa (plantilla y parámetros). */
type Result = { ok: boolean; tpl?: string; params?: Params };
type Submit = (r: Result) => void;

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
const RoundBtn = ({ onClick, label, children, tone = 'bg-white text-slate-700 shadow-[0_4px_0_#e6d3ab]', disabled = false }: { onClick: () => void; label: string; children: ComponentChildren; tone?: string; disabled?: boolean }) => (
  <button disabled={disabled} onClick={() => { playClickSound(); onClick(); }} aria-label={label} className={`w-11 h-11 rounded-2xl flex items-center justify-center active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-40 ${tone}`}>
    {children}
  </button>
);
const TryBtn = ({ onClick, disabled, children = '¡Probar!' }: { onClick: () => void; disabled?: boolean; children?: ComponentChildren }) => (
  <GlassButton variant="emerald" size="lg" onClick={onClick} disabled={disabled}>
    <Check className="w-5 h-5" /> {children} <Key>Enter</Key>
  </GlassButton>
);
const Mystery = () => (
  <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-sky-300" aria-hidden="true">?</span>
);

/** Candado numérico: el niño escribe el número (no hay opciones que adivinar). */
const Keypad: FunctionalComponent<{ value: string; setValue: (v: string) => void; onSubmit: () => void; locked: boolean; unit: string }> = ({ value, setValue, onSubmit, locked, unit }) => {
  const press = (d: string) => !locked && value.length < 3 && setValue(value + d);
  const del = () => !locked && setValue(value.slice(0, -1));
  const keys: Record<string, () => void> = { Backspace: del, Enter: () => value && onSubmit() };
  '0123456789'.split('').forEach((d) => (keys[d] = () => press(d)));
  useKeys(keys, [value, locked]);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="min-w-[110px] h-14 px-4 rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[inset_0_3px_0_rgba(146,112,52,.08)] flex items-center justify-center text-3xl font-black text-slate-800" aria-live="polite">
          {value || <span className="text-[#e6d3ab]">?</span>}
        </span>
        <span className="text-lg font-black text-slate-500">{unit}</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {'1234567890'.split('').map((d) => (
          <button key={d} disabled={locked} onClick={() => { playClickSound(); press(d); }} className="cozy-tile w-11 h-11 text-xl font-black text-slate-700 disabled:opacity-50">
            {d}
          </button>
        ))}
        <button disabled={locked} onClick={() => { playClickSound(); del(); }} aria-label="Borrar" className="cozy-tile w-11 h-11 flex items-center justify-center text-slate-500 disabled:opacity-50">
          <Delete className="w-5 h-5" />
        </button>
      </div>
      <div className="w-full"><TryBtn onClick={onSubmit} disabled={locked || !value} /></div>
    </div>
  );
};

interface StepProps<T extends MicroStep['type']> {
  step: Extract<MicroStep, { type: T }>;
  problem: Problem;
  world: IsoWorld | null;
  onSubmit: Submit;
}

// ----------------------------------------------------------------------------
// Micro-pasos: primero decides, luego el mundo muestra el resultado
// ----------------------------------------------------------------------------
const CounterStep: FunctionalComponent<StepProps<'counter'>> = ({ step, problem, onSubmit }) => {
  const per = Number(problem.params.per);
  const target = Number(problem.params.target);
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  const total = n * per;
  const test = () => {
    if (done || n === 0) return;
    setDone(true);
    const diff = Math.abs(target - total);
    onSubmit(total === target ? { ok: true } : { ok: false, tpl: total < target ? LINES.counterLow : LINES.counterHigh, params: { n, per, total, diff } });
  };
  const set = (v: number) => !done && setN(Math.max(0, Math.min(problem.max ?? 6, v)));
  useKeys({ '-': () => set(n - 1), '+': () => set(n + 1), Enter: test }, [n, done]);
  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex gap-3 items-center">
        <div className="grid grid-cols-3 gap-2 flex-1">
          {Array.from({ length: problem.max ?? 6 }).map((_, i) => {
            const on = i < n;
            return (
              <button
                key={i}
                onClick={() => { playClickSound(); set(on && i === n - 1 ? i : i + 1); }}
                aria-label={`${step.data.item[0]} ${i + 1} ${on ? 'en la mochila' : 'fuera'}`}
                aria-pressed={on}
                className={`cozy-tile aspect-[5/4] flex flex-col items-center justify-center ${on ? 'is-on' : ''}`}
              >
                <BottleArt on={on} size={34} />
                <span className={`text-[11px] font-black ${on ? 'text-sky-700' : 'text-slate-400'}`}>{per} L</span>
              </button>
            );
          })}
        </div>
        <div className="relative flex flex-col items-center">
          <Backpack className="w-7 h-7 text-amber-500 mb-1" />
          <TankArt value={done ? total : 0} max={target * 1.3} mark={target} width={70} height={110} label={`Meta: ${target} litros`} />
          {!done && <Mystery />}
        </div>
      </div>
      <p className="text-center text-sm font-black text-slate-500">
        {done ? `${n} × ${per} = ${total}` : `Elegiste ${n} ${n === 1 ? step.data.item[0] : step.data.item[1]}`}
      </p>
      <TryBtn onClick={test} disabled={done || n === 0} />
    </div>
  );
};

const ShareStep: FunctionalComponent<StepProps<'share'>> = ({ step, problem, onSubmit }) => {
  const total = Number(problem.params.total);
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const each = Number(value) || 0;
  const rest = total - each * 3;
  const test = () => {
    if (done || !value) return;
    setDone(true);
    onSubmit(rest === 0 ? { ok: true } : { ok: false, tpl: rest > 0 ? LINES.shareLow : LINES.shareHigh, params: { each, diff: Math.abs(rest) } });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex items-center justify-between gap-2">
        <div className="flex flex-col items-center">
          <span className="w-16 h-16 rounded-2xl bg-white shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-600"><Users className="w-9 h-9" /></span>
          <span className="mt-1 font-black text-slate-700">{total}</span>
        </div>
        <ArrowRight className="w-6 h-6 text-[#c8b48a]" />
        {step.data.sectors.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <span className={`w-14 h-16 rounded-t-2xl rounded-b-md flex items-center justify-center ${done ? (rest === 0 ? 'bg-emerald-400 text-white' : 'bg-rose-200 text-rose-700') : 'bg-[#c28a52] text-amber-100'}`}>
              <DoorOpen className="w-7 h-7" />
            </span>
            <span className="text-sm font-black text-slate-700">{done ? each : '?'}</span>
            <span className="text-[11px] font-bold text-slate-500">{s}</span>
          </div>
        ))}
      </div>
      <Keypad value={value} setValue={setValue} onSubmit={test} locked={done} unit="por puerta" />
    </div>
  );
};

const NumberStep: FunctionalComponent<StepProps<'number'>> = ({ step, problem, world, onSubmit }) => {
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);
  const v = Number(value) || 0;
  const answer = Number(problem.answer);
  const rising = step.data.gen === 'rising';
  const per = Number(problem.params.per);
  const target = Number(problem.params.target);
  const s = Number(problem.params.s);
  const test = () => {
    if (done || !value) return;
    setDone(true);
    if (rising) {
      world?.setFilters(Math.min(6, v), per, target); // el medidor del río sube en el mapa
      onSubmit(v === answer ? { ok: true } : { ok: false, tpl: v * per < target ? LINES.risingLow : LINES.risingHigh, params: { n: v, total: v * per } });
    } else {
      onSubmit(v === answer ? { ok: true } : { ok: false, tpl: LINES.thunderWrong, params: { n: v, total: v * 3 } });
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex items-center justify-center gap-3 min-h-[110px]">
        {rising ? (
          <>
            <span className="flex flex-col-reverse gap-1" aria-label={`${per} centímetros por hora`}>
              {Array.from({ length: Math.min(8, done ? v : 1) }).map((_, i) => (
                <span key={i} className={`w-16 h-3 rounded ${done && i >= answer ? 'bg-rose-300' : 'bg-sky-400'}`} />
              ))}
            </span>
            <span className="text-xs font-black text-slate-500 w-16">{done ? `${v * per} cm` : `+${per} cm cada hora`}</span>
            <span className="flex flex-col items-center">
              <span className="w-1.5 h-16 bg-amber-400 rounded" />
              <span className="text-xs font-black text-amber-700">{target} cm</span>
            </span>
          </>
        ) : (
          <>
            <CloudLightning className="w-10 h-10 text-amber-500" />
            <span className="flex flex-wrap gap-1 max-w-[180px]" aria-label={`${s} segundos`}>
              {Array.from({ length: s }).map((_, i) => (
                <span key={i} className={`w-3.5 h-3.5 rounded-full ${done && v === answer && i % 3 === 2 ? 'bg-emerald-500' : 'bg-sky-300'}`} />
              ))}
            </span>
            <Ear className="w-9 h-9 text-slate-500" />
          </>
        )}
      </div>
      <Keypad value={value} setValue={setValue} onSubmit={test} locked={done} unit={step.data.unit} />
    </div>
  );
};

const PaperNote: FunctionalComponent<{ children: ComponentChildren; tilt?: number; className?: string }> = ({ children, tilt = 0, className = '' }) => (
  <div className={`paper relative px-4 pt-5 pb-3 ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-5 rounded-sm bg-amber-200/80 rotate-[-3deg]" />
    {children}
  </div>
);

/** Las opciones aparecen después de unos segundos: primero se lee (o se escucha). */
function useReadGate(ms: number) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), ms);
    return () => clearTimeout(t);
  }, []);
  return open;
}

const ReadStep: FunctionalComponent<StepProps<'read'>> = ({ step, problem, onSubmit }) => {
  const v = step.data.variants[problem.variant ?? 0];
  const open = useReadGate(2800);
  const [picked, setPicked] = useState<string | null>(null);
  const options = (problem.order ?? step.data.options.map((o) => o.id)).map((id) => step.data.options.find((o) => o.id === id)!);
  const answer = (id: string) => {
    if (picked || !open) return;
    playClickSound();
    setPicked(id);
    onSubmit(id === problem.answer ? { ok: true, tpl: v.explain } : { ok: false, tpl: step.data.why?.[id] ?? LINES.readWrong });
  };
  const keys: Record<string, () => void> = {};
  options.forEach((o, i) => (keys[String(i + 1)] = () => answer(o.id)));
  useKeys(keys, [picked, open]);
  return (
    <div className="flex flex-col gap-3">
      <PaperNote tilt={-0.6}>
        <span className="absolute top-2 right-3 rotate-[4deg] inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 border-2 border-emerald-600/60 rounded-lg px-1.5 py-0.5">
          <ShieldCheck className="w-3 h-3" /> {step.data.badge}
        </span>
        <div className="flex flex-col gap-2 mt-2">
          {v.blocks.map((b, i) => {
            const Icon = b.icon ? ICONS[b.icon] : null;
            return (
              <div key={i} className="flex items-center gap-3">
                {Icon && <span className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Icon className="w-6 h-6" /></span>}
                <p className="text-[17px] leading-snug font-semibold text-slate-800">{b.text}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-right text-xs font-bold italic text-slate-500">— {step.data.source}</p>
      </PaperNote>
      <p className="text-lg font-extrabold text-slate-800">{v.question}</p>
      <div className={`grid grid-cols-2 gap-2 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {options.map((o) => {
          const Icon = ICONS[o.icon];
          const state = picked === o.id ? (o.id === problem.answer ? 'is-ok' : 'is-soft') : '';
          return (
            <button key={o.id} onClick={() => answer(o.id)} className={`cozy-tile p-2.5 flex flex-col items-center gap-1.5 text-center ${state}`}>
              <span className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center"><Icon className="w-7 h-7" /></span>
              <span className="text-sm font-black text-slate-800 leading-tight">{o.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SiftStep: FunctionalComponent<StepProps<'sift'>> = ({ step, problem, onSubmit }) => {
  const pair = step.data.pairs[problem.variant ?? 0];
  const cards = (problem.order ?? ['reliable', 'rumor']).map((k, i) => ({ label: i === 0 ? 'A' : 'B', reliable: k === 'reliable', msg: pair[k as 'reliable' | 'rumor'] }));
  const [inspected, setInspected] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const all = inspected.length === 2;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
      {cards.map((c, k) => {
        const seen = inspected.includes(c.label);
        const tone = c.reliable ? 'text-emerald-700' : 'text-rose-600';
        return (
          <PaperNote key={c.label} tilt={k ? 1 : -1} className={`flex flex-col gap-2 ${picked === c.label ? (c.reliable ? 'ring-4 ring-emerald-300' : 'ring-4 ring-rose-200') : ''}`}>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Mensaje {c.label}</span>
            <p className="text-[15px] font-semibold text-slate-800 leading-snug">"{c.msg.content}"</p>
            {seen ? (
              <div className="flex flex-col gap-1 text-xs font-bold animate-fadeIn">
                <span className={`flex items-center gap-1.5 ${tone}`}>{c.reliable ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />} {c.msg.author}</span>
                <span className={`flex items-center gap-1.5 ${tone}`}>{c.reliable ? <CalendarDays className="w-4 h-4" /> : <CalendarX className="w-4 h-4" />} {c.msg.date}</span>
                <span className={`flex items-center gap-1.5 ${tone}`}>{c.reliable ? <MessageCircle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />} {c.msg.tone}</span>
              </div>
            ) : (
              <button onClick={() => { playClickSound(); setInspected((p) => [...p, c.label]); }} className="self-center w-14 h-14 rounded-full bg-amber-400 text-amber-950 shadow-[0_4px_0_#b45309] active:translate-y-[3px] active:shadow-none flex items-center justify-center" aria-label={`Usar la lupa en Mensaje ${c.label}`}>
                <Search className="w-7 h-7" />
              </button>
            )}
            <GlassButton
              size="sm"
              variant="emerald"
              disabled={!all || !!picked}
              onClick={() => {
                setPicked(c.label);
                onSubmit(c.reliable ? { ok: true, tpl: LINES.siftRight } : { ok: false, tpl: LINES.siftWrong });
              }}
            >
              <ShieldCheck className="w-4 h-4" /> Es confiable
            </GlassButton>
          </PaperNote>
        );
      })}
    </div>
  );
};

const OrderStep: FunctionalComponent<StepProps<'order'>> = ({ step, problem, onSubmit }) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const items = (problem.order ?? step.data.items.map((i) => i.id)).map((id) => step.data.items.find((i) => i.id === id)!);
  const check = () => {
    if (done || slots.length < items.length) return;
    setDone(true);
    onSubmit(slots.join(',') === problem.answer ? { ok: true } : { ok: false, tpl: LINES.orderWrong });
  };
  useKeys({ Enter: check }, [slots, done]);
  return (
    <div className="flex flex-col gap-3">
      <div className="cozy-inset p-3 flex items-center justify-between gap-1">
        {[0, 1, 2].map((i) => {
          const it = step.data.items.find((x) => x.id === slots[i]);
          const Icon = it ? ICONS[it.icon] : null;
          return (
            <div key={i} className="contents">
              <button
                onClick={() => !done && it && setSlots((s) => s.filter((x) => x !== it.id))}
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
            <button key={it.id} onClick={() => { playClickSound(); !done && setSlots((s) => [...s, it.id]); }} className="cozy-tile flex items-center gap-3 px-3 py-2.5 text-left font-bold text-slate-800">
              <span className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0"><Icon className="w-6 h-6" /></span>
              {it.text}
            </button>
          );
        })}
      </div>
      <TryBtn onClick={check} disabled={done || slots.length < items.length}>Listo</TryBtn>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Panel principal + Chispa (tutor socrático: pregunta -> pista visual -> ejemplo)
// ----------------------------------------------------------------------------
const ROLE_TONE = { A: 'bg-sky-500', B: 'bg-amber-400 !text-amber-950', AB: 'bg-emerald-500' };
const HINT_KEYS = ['level1_question', 'level2_visual', 'level3_analogy'] as const;
const MAX_PRACTICE = 2; // rondas extra como máximo (evita frustración)

/** Lo que Chispa dice al empezar un paso: instrucción + texto de la lectura. */
function stepSpeech(step: MicroStep, problem: Problem): (string | number)[] {
  const parts = speechParts(step.instruction, problem.params);
  if (step.type === 'read') {
    const v = step.data.variants[problem.variant ?? 0];
    v.blocks.forEach((b) => parts.push(b.text));
    parts.push(v.question);
  }
  return parts;
}

export const MissionPanel: FunctionalComponent<Props> = ({ mission, world, calm, sunsLeftAfter, onExit, onComplete, onHintUsed, onSkill, onChispaTap, onBreath }) => {
  const [phase, setPhase] = useState<'intro' | 'step' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [duo, setDuo] = useState(false);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(mission.steps[0]));
  const [pid, setPid] = useState(0); // fuerza remontar el paso con un problema nuevo
  const [tries, setTries] = useState(0); // intentos fallidos en este paso
  const [practice, setPractice] = useState(0);
  const [outcome, setOutcome] = useState<null | 'retry' | 'practice' | 'solved'>(null);
  const [totals, setTotals] = useState({ mistakes: 0, struggled: 0, hints: 0 });
  const [hint, setHint] = useState(0);
  const [chispa, setChispa] = useState<{ text: string; parts: (string | number)[]; mood: SquirrelMood; n: number }>({ text: mission.shortStory.join(' '), parts: [...mission.shortStory], mood: 'idle', n: 0 });
  const [breathing, setBreathing] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [sunsLeft] = useState(sunsLeftAfter);

  const step = mission.steps[idx];
  const isMath = mission.id === 'nivel-sismo' || mission.id === 'nivel-incendio'; // solo define el color de acento
  const tone = isMath ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900';
  const StationIcon = STATION_ICONS[mission.id] ?? Sun;
  const StepIcon = STEP_ICON(step);
  const params = problem.params;

  useEffect(() => {
    say(mission.shortStory);
    return () => stopSpeaking();
  }, []);

  /** Chispa habla: texto en el globo + voz (misma plantilla). */
  const talk = (tpl: string, p: Params = {}, mood: SquirrelMood = 'idle', speak = true, parts = speechParts(tpl, p)) => {
    setChispa((s) => ({ text: fill(tpl, p), parts, mood, n: s.n + 1 }));
    if (speak) say(parts);
  };

  const showHint = (level: number) => {
    const l = Math.min(3, Math.max(1, level));
    playHintSound();
    setHint(l);
    setTotals((t) => ({ ...t, hints: t.hints + 1 }));
    talk(step.socraticHints[HINT_KEYS[l - 1]], params, 'thinking');
    onHintUsed();
  };

  const startProblem = (i: number, prev?: Problem, isDuo = duo) => {
    const s = mission.steps[i];
    const p = makeProblem(s, prev);
    setProblem(p);
    setPid((x) => x + 1);
    setOutcome(null);
    setHint(0);
    say(stepSpeech(s, p)); // narración automática: leer no debe ser una barrera
    const role = isDuo && s.duoRole && mission.duoRoles ? (s.duoRole === 'AB' ? null : mission.duoRoles[s.duoRole]) : undefined;
    const tpl = role === null ? LINES.bothTurn : role ? LINES.turnOf : prev ? (s.type === 'read' ? LINES.newSituation : s.type === 'sift' ? LINES.newText : LINES.newNumbers) : i === 0 ? LINES.tapMe : LINES.nextOne;
    talk(tpl, role ? { role } : {}, 'idle', false); // en silencio: ya está narrando el paso
  };

  const onSubmit: Submit = (r) => {
    const firstTry = tries === 0 && hint === 0;
    onSkill(step.skills, r.ok, firstTry);
    if (r.ok) {
      playStepCompleteSound();
      world?.cheer();
      if (tries > 0 && practice < MAX_PRACTICE) {
        // Necesitó intentos: uno más con números nuevos para asegurar que entendió
        setOutcome('practice');
        talk(LINES.practice, {}, 'happy');
      } else {
        setOutcome('solved');
        const cheer = LINES.cheers[(idx + totals.mistakes) % LINES.cheers.length];
        talk(r.tpl ?? cheer, r.params ?? {}, 'happy');
      }
      return;
    }
    const t = tries + 1;
    setTries(t);
    setTotals((x) => ({ ...x, mistakes: x.mistakes + 1 }));
    setOutcome('retry');
    if (t === 2 && hint === 0) {
      setHint(1);
      setTotals((x) => ({ ...x, hints: x.hints + 1 }));
      onHintUsed();
      playHintSound();
      talk(LINES.almost, { hint: fill(step.socraticHints.level1_question, params) }, 'thinking', true, ['¡Casi!', ...speechParts(step.socraticHints.level1_question, params)]);
    } else talk(r.tpl ?? LINES.readWrong, r.params ?? {}, 'thinking');
  };

  const continueAfter = () => {
    if (outcome === 'retry') return startProblem(idx, problem);
    if (outcome === 'practice') {
      setPractice((x) => x + 1);
      setTries(0);
      return startProblem(idx, problem);
    }
    // solved -> siguiente paso o fin
    const struggled = totals.struggled + (tries >= 2 ? 1 : 0);
    setTries(0);
    setPractice(0);
    stopSpeaking();
    if (idx < 2) {
      setTotals((t) => ({ ...t, struggled }));
      setIdx(idx + 1);
      startProblem(idx + 1);
      return;
    }
    playSuccessSound();
    world?.cheer();
    setNewBadges(onComplete({ mistakes: totals.mistakes, struggledSteps: struggled, duo, hints: totals.hints }));
    setPhase('done');
    talk(mission.offScreenChallenge.companionPrompt, {}, 'happy');
  };

  const begin = (isDuo: boolean) => {
    setDuo(isDuo);
    setPhase('step');
    startProblem(0, undefined, isDuo);
  };

  useKeys({ Enter: () => outcome && continueAfter() }, [outcome, idx, tries, practice, totals, problem]);

  const tapSquirrel = () => {
    onChispaTap();
    if (phase === 'step' && !outcome) showHint(hint + 1 > 3 ? 3 : hint + 1);
    else say(chispa.parts, { user: true });
  };

  const instruction = fill(step.instruction, params);
  const highlights = (step.highlightWords ?? []).map((w) => fill(w, params));
  const instructionLines = useMemo(() => (calm ? instruction.split(/(?<=[.?!])\s+/) : [instruction]).filter(Boolean), [instruction, calm]);
  const roleText = duo && step.duoRole && mission.duoRoles ? (step.duoRole === 'AB' ? 'Los dos juntos' : mission.duoRoles[step.duoRole]) : null;
  const stepProps = { problem, world, onSubmit } as const;
  const nextLabel = outcome === 'retry' ? (step.type === 'read' ? 'Otra situación' : step.type === 'sift' ? 'Otro mensaje' : 'Números nuevos') : outcome === 'practice' ? '¡Uno más!' : idx < 2 ? '¡Siguiente!' : '¡Terminar!';

  return (
    <>
      <section className="cozy-panel fixed z-30 left-2 right-2 bottom-2 max-h-[70vh] lg:max-h-none lg:left-auto lg:right-4 lg:top-24 lg:bottom-4 lg:w-[470px] flex flex-col animate-fadeIn" aria-label={mission.title}>
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
              {roleText && (
                <div className={`self-center inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black text-white ${ROLE_TONE[step.duoRole!]}`}>
                  <Users className="w-4 h-4" /> {roleText}
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${isMath ? 'bg-amber-100 text-amber-500' : 'bg-emerald-100 text-emerald-600'}`}>
                  <StepIcon className="w-8 h-8" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{step.title}</h3>
                  {practice > 0 && <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">Ronda extra</span>}
                  {instructionLines.map((l) => (
                    <p key={l} className="text-[15px] leading-snug text-slate-700 font-medium">
                      <Highlight text={l} words={highlights} tone={tone} />
                    </p>
                  ))}
                </div>
                <RoundBtn label="Escuchar" onClick={() => say(stepSpeech(step, problem), { user: true })} tone="bg-sky-100 text-sky-700 shadow-[0_4px_0_#7dd3fc]"><Volume2 className="w-5 h-5" /></RoundBtn>
              </div>

              <div key={pid}>
                {step.type === 'counter' && <CounterStep step={step} {...stepProps} />}
                {step.type === 'share' && <ShareStep step={step} {...stepProps} />}
                {step.type === 'number' && <NumberStep step={step} {...stepProps} />}
                {step.type === 'read' && <ReadStep step={step} {...stepProps} />}
                {step.type === 'sift' && <SiftStep step={step} {...stepProps} />}
                {step.type === 'order' && <OrderStep step={step} {...stepProps} />}
              </div>

              {outcome && (
                <GlassButton variant={outcome === 'retry' ? 'amber' : 'primary'} size="xl" onClick={continueAfter} className="animate-fadeIn">
                  {outcome === 'retry' ? <RotateCcw className="w-5 h-5" /> : null} {nextLabel} {outcome !== 'retry' && <ArrowRight className="w-5 h-5" />} <Key>Enter</Key>
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
            key={chispa.n}
            onClick={tapSquirrel}
            className={`shrink-0 -mb-1 ${chispa.mood === 'happy' ? 'anim-hop' : chispa.mood === 'thinking' ? 'anim-wiggle' : 'anim-bob'}`}
            aria-label={phase === 'step' && !outcome ? 'Chispa: pedir una pista' : 'Chispa: escuchar'}
            title="Toca a Chispa"
          >
            <SquirrelArt mood={chispa.mood} size={64} />
          </button>
          <div className="relative flex-1 mb-2 rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[0_4px_0_#e6d3ab] px-3 py-2">
            <span className="absolute -left-2 bottom-4 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-[#f1e4c6] rotate-45" />
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {hint > 0 && <span className="inline-flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black">Pista {hint} de 3</span>}
                <p className="text-[14px] font-bold text-slate-700 leading-snug">{chispa.text}</p>
              </div>
              <button onClick={() => say(chispa.parts, { user: true })} className="p-1 rounded-lg text-sky-600 hover:bg-sky-50" aria-label="Escuchar a Chispa">
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

      <BreathingModal isOpen={breathing} onClose={() => { setBreathing(false); onBreath(); }} durationSeconds={mission.offScreenChallenge.breathingSeconds} />
    </>
  );
};
