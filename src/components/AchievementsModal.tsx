import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import {
  Award, BookOpen, Brain, Calculator, Droplets, Ear, Footprints, Hammer, HeartHandshake, Lock, Repeat, ScrollText, Sprout, Squirrel,
  Star, Target, Trophy, Users, Wind, X, Zap,
} from 'lucide-preact';
import { ACHIEVEMENTS } from '../data/achievements';
import { SKILLS } from '../data/missionsData';
import type { StudentProfile } from '../services/storageService';
import { playClickSound } from '../services/soundService';

const ICONS = { Droplets, ScrollText, Hammer, Sprout, Users, HeartHandshake, Zap, Target, Squirrel, Wind, Footprints, Repeat, Brain, Ear };
const LEVEL = ['Nuevo', 'Aprendiendo', 'Casi', '¡Lo domino!'];

const Stars = ({ n }: { n: number }) => (
  <span className="flex gap-0.5" aria-label={`${n} de 3 estrellas`}>
    {[0, 1, 2].map((i) => <Star key={i} className={`w-5 h-5 ${i < n ? 'text-amber-400 fill-amber-300' : 'text-[#e6d3ab]'}`} />)}
  </span>
);

export const AchievementsModal: FunctionalComponent<{ isOpen: boolean; onClose: () => void; student: StudentProfile }> = ({ isOpen, onClose, student }) => {
  const [tab, setTab] = useState<'logros' | 'aprendo'>('logros');
  if (!isOpen) return null;

  const earned = ACHIEVEMENTS.filter((a) => a.earned(student)).length;
  const subject = (s: 'matematica' | 'espanol') => {
    const list = SKILLS.filter((k) => k.subject === s);
    const stars = list.reduce((a, k) => a + (student.skills[k.id]?.mastery ?? 0), 0);
    return { list, pct: Math.round((stars / (list.length * 3)) * 100) };
  };
  const Tab = ({ id, label, Icon }: { id: typeof tab; label: string; Icon: any }) => (
    <button
      onClick={() => { playClickSound(); setTab(id); }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all ${tab === id ? 'bg-sky-500 text-white shadow-[0_4px_0_#0369a1]' : 'bg-white text-slate-600 shadow-[0_4px_0_#e6d3ab]'}`}
    >
      <Icon className="w-5 h-5" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-100/50 backdrop-blur-sm overflow-y-auto">
      <div className="cozy-panel relative w-full max-w-3xl my-6 p-5 sm:p-6 animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-500" aria-label="Cerrar logros">
          <X className="w-5 h-5" />
        </button>
        <div className="flex justify-center mb-4"><span className="cozy-ribbon text-lg">Mis logros</span></div>
        <div className="flex justify-center gap-2 mb-5">
          <Tab id="logros" label={`Logros ${earned}/${ACHIEVEMENTS.length}`} Icon={Trophy} />
          <Tab id="aprendo" label="Lo que aprendo" Icon={Brain} />
        </div>

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

        {tab === 'aprendo' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['matematica', 'espanol'] as const).map((s) => {
              const { list, pct } = subject(s);
              const math = s === 'matematica';
              return (
                <div key={s} className="cozy-inset p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${math ? 'bg-amber-400 shadow-[0_4px_0_#b45309]' : 'bg-emerald-500 shadow-[0_4px_0_#047857]'}`}>
                      {math ? <Calculator className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                    </span>
                    <div className="flex-1">
                      <p className="font-black text-slate-800">{math ? 'Matemática' : 'Español'}</p>
                      <div className="h-3 rounded-full bg-white overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${math ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="font-black text-slate-600">{pct}%</span>
                  </div>
                  {list.map((k) => {
                    const p = student.skills[k.id];
                    const m = p?.mastery ?? 0;
                    return (
                      <div key={k.id} className="cozy-tile px-3 py-2 flex items-center gap-2">
                        <span className="flex-1 font-black text-slate-700 text-sm">{k.name}</span>
                        <span className={`text-[11px] font-black ${m >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>{p ? LEVEL[m] : 'Por descubrir'}</span>
                        <Stars n={m} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <p className="md:col-span-2 text-xs text-slate-500 text-center">Las estrellas suben cuando aciertas a la primera, con números nuevos cada vez.</p>
          </div>
        )}
      </div>
    </div>
  );
};
