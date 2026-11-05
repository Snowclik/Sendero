import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import {
  Activity, Award, BookOpen, Brain, Calculator, CloudLightning, Ear, Flame, Footprints, HeartHandshake, LifeBuoy, Lock, Repeat, Shirt, Squirrel,
  Sparkles, Star, Target, Trophy, Users, Waves, Wind, X, Zap,
} from 'lucide-preact';
import { ACHIEVEMENTS } from '../data/achievements';
import { SKILLS, type Subject } from '../data/missionsData';
import type { StudentProfile } from '../services/storageService';
import { playClickSound } from '../services/soundService';
import { TIER_NAME, knowOf, tierFromKnow, weakest } from '../game/brain';

const ICONS = { Activity, Waves, CloudLightning, Flame, Shirt, Users, HeartHandshake, Zap, Target, Squirrel, Wind, Footprints, Repeat, Brain, Ear };
const LEVEL = ['Nuevo', 'Aprendiendo', 'Casi', '¡Lo domino!'];
const SUBJECT_LOOK = {
  prevencion: { name: 'Qué hacer', Icon: LifeBuoy, tile: 'bg-rose-400 shadow-[0_4px_0_#be123c]', bar: 'bg-rose-400' },
  matematica: { name: 'Matemática', Icon: Calculator, tile: 'bg-amber-400 shadow-[0_4px_0_#b45309]', bar: 'bg-amber-400' },
  espanol: { name: 'Español', Icon: BookOpen, tile: 'bg-emerald-500 shadow-[0_4px_0_#047857]', bar: 'bg-emerald-500' },
};

const Stars = ({ n }: { n: number }) => (
  <span className="flex gap-0.5" aria-label={`${n} de 3 estrellas`}>
    {[0, 1, 2].map((i) => <Star key={i} className={`w-4 h-4 shrink-0 ${i < n ? 'text-amber-400 fill-amber-300' : 'text-[#e6d3ab]'}`} />)}
  </span>
);

export const AchievementsModal: FunctionalComponent<{ isOpen: boolean; onClose: () => void; student: StudentProfile }> = ({ isOpen, onClose, student }) => {
  const [tab, setTab] = useState<'logros' | 'aprendo'>('logros');
  if (!isOpen) return null;

  const earned = ACHIEVEMENTS.filter((a) => a.earned(student)).length;
  const subject = (s: Subject) => {
    const list = SKILLS.filter((k) => k.subject === s);
    // Porcentaje = dominio estimado por la IA local (no clics ni tiempo jugado)
    return { list, pct: Math.round((list.reduce((a, k) => a + knowOf(student, k.id), 0) / list.length) * 100) };
  };
  const Tab = ({ id, label, Icon }: { id: typeof tab; label: string; Icon: any }) => (
    <button
      onClick={() => { playClickSound(); setTab(id); }}
      className={`flex items-center gap-2 px-4 py-2.5 short:py-1.5 rounded-2xl font-black text-sm transition-all ${tab === id ? 'bg-sky-500 text-white shadow-[0_4px_0_#0369a1]' : 'bg-white text-slate-600 shadow-[0_4px_0_#e6d3ab]'}`}
    >
      <Icon className="w-5 h-5" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-sky-100/50 backdrop-blur-sm">
      <div className="cozy-panel relative w-full max-w-4xl max-h-full flex flex-col p-4 sm:p-6 short:!p-2 animate-fadeIn">
        <button onClick={onClose} className="absolute top-3 right-3 short:top-2 short:right-2 z-10 w-10 h-10 rounded-2xl bg-white shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-500" aria-label="Cerrar logros">
          <X className="w-5 h-5" />
        </button>
        <div className="flex justify-center mb-4 short:hidden"><span className="cozy-ribbon text-lg">Mis logros</span></div>
        <div className="flex justify-center gap-2 mb-4 short:mb-2 pr-12 pl-1 sm:px-12">
          <Tab id="logros" label={`Logros ${earned}/${ACHIEVEMENTS.length}`} Icon={Trophy} />
          <Tab id="aprendo" label="Lo que aprendo" Icon={Brain} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-1">
        {tab === 'logros' && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const ok = a.earned(student);
              const Icon = ICONS[a.icon] ?? Award;
              const secret = a.hidden && !ok;
              return (
                <div key={a.id} className={`cozy-tile p-2.5 flex flex-col items-center gap-1.5 text-center ${ok ? '' : 'opacity-80'}`} title={ok ? a.how : secret ? a.hint : a.how}>
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center ${ok ? 'bg-amber-300 text-white shadow-[0_4px_0_#d97706]' : secret ? 'bg-slate-700 text-slate-400' : 'bg-[#eadcbc] text-white'}`}>
                    {ok ? <Icon className="w-7 h-7" /> : secret ? <span className="text-2xl font-black">?</span> : <Lock className="w-6 h-6" />}
                  </span>
                  <span className={`text-xs font-black leading-tight ${ok ? 'text-amber-800' : 'text-slate-500'}`}>{secret ? '???' : a.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 leading-tight">{ok ? a.how : secret ? a.hint : a.how}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'aprendo' && (() => {
          const order = weakest(student).filter((k) => student.skills[k.id]);
          return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3 cozy-tile p-3 flex items-center gap-3">
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-[0_4px_0_#6d28d9]"><Sparkles className="w-7 h-7" /></span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800">Chispa aprende de ti</p>
                <p className="text-sm font-bold text-slate-600">
                  {order.length ? <>Tus retos traen más <b className="text-violet-700">{order[0].name}</b>{order.length > 1 && <> · Lo que mejor haces: <b className="text-emerald-700">{order[order.length - 1].name}</b></>}</> : 'Juega una estación y Chispa empezará a conocerte.'}
                </p>
              </div>
            </div>
            {(['prevencion', 'matematica', 'espanol'] as const).map((s) => {
              const { list, pct } = subject(s);
              const look = SUBJECT_LOOK[s];
              return (
                <div key={s} className="cozy-inset p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${look.tile}`}>
                      <look.Icon className="w-7 h-7" />
                    </span>
                    <div className="flex-1">
                      <p className="font-black text-slate-800">{look.name}</p>
                      <div className="h-3 rounded-full bg-white overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${look.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="font-black text-slate-600">{pct}%</span>
                  </div>
                  {list.map((k) => {
                    const p = student.skills[k.id];
                    const m = p?.mastery ?? 0;
                    return (
                      <div key={k.id} className="cozy-tile px-3 py-2 flex items-center gap-2">
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span className="font-black text-slate-700 text-sm leading-tight">{k.name}</span>
                          <span className={`text-[11px] font-black ${m >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>{p ? LEVEL[m] : 'Por descubrir'}</span>
                        </span>
                        {p && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black">{TIER_NAME[tierFromKnow(knowOf(student, k.id))]}</span>}
                        <Stars n={m} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <p className="md:col-span-3 text-xs text-slate-500 text-center">La IA de Chispa vive en tu equipo, sin internet: estima cuánto dominas cada cosa y ajusta los retos.</p>
          </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
};
