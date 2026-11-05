import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Compass, HelpCircle, Lightbulb, ShieldCheck, Sprout, Volume2, X } from 'lucide-preact';
import { GlassButton } from './ui/GlassButton';
import type { SocraticHints } from '../data/missionsData';
import { playHintSound, speakLocalText } from '../services/soundService';

interface Props {
  open: boolean;
  hints: SocraticHints;
  stepTitle: string;
  autoOpened: boolean; // true si se abrió solo tras dos intentos fallidos
  onClose: () => void;
  onLevel: (level: number) => void;
}

const LEVELS = [
  { key: 'level1_question', label: 'Pregunta guía', Icon: HelpCircle, tone: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { key: 'level2_visual', label: 'Pista visual', Icon: Lightbulb, tone: 'bg-sky-50 border-sky-200 text-sky-900' },
  { key: 'level3_analogy', label: 'Ejemplo más fácil', Icon: Sprout, tone: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
] as const;

/**
 * Tutor Socrático offline. Regla: jamás da la respuesta.
 * Nivel 1 pregunta, nivel 2 pista visual, nivel 3 ejemplo análogo. Las reglas las define el maestro en missionsData.
 */
export const TutorPanel: FunctionalComponent<Props> = ({ open, hints, stepTitle, autoOpened, onClose, onLevel }) => {
  const [level, setLevel] = useState(1);
  useEffect(() => setLevel(1), [stepTitle]);
  useEffect(() => {
    if (open) onLevel(level);
  }, [open, level]);

  if (!open) return null;

  return (
    <aside
      className="fixed z-40 left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:top-24 sm:bottom-4 sm:w-[360px] flex flex-col gap-3 p-4 overflow-y-auto bg-white/85 backdrop-blur-2xl border-2 border-white/90 shadow-[0_12px_40px_rgba(79,70,229,0.15),inset_0_2px_2px_rgba(255,255,255,1)] rounded-3xl animate-fadeIn"
      aria-label="Guía socrático"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Guía del Valle</h3>
            <p className="text-xs text-slate-500">{stepTitle}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Cerrar guía">
          <X className="w-5 h-5" />
        </button>
      </div>

      {autoOpened && (
        <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-2xl px-3 py-2">
          Equivocarse es parte de aprender. Pensemos juntos.
        </p>
      )}

      {LEVELS.slice(0, level).map(({ key, label, Icon, tone }, i) => (
        <div key={key} className={`p-3.5 rounded-2xl border animate-fadeIn ${tone}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Icon className="w-4 h-4" /> Pista {i + 1}: {label}
            </span>
            <button onClick={() => speakLocalText(hints[key])} className="p-1.5 rounded-lg hover:bg-white/70" aria-label="Escuchar pista">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[15px] font-medium text-slate-800 leading-snug">{hints[key]}</p>
        </div>
      ))}

      <div className="flex gap-2">
        {level < 3 && (
          <GlassButton
            size="sm"
            className="flex-1"
            onClick={() => {
              playHintSound();
              setLevel(level + 1);
            }}
          >
            Otra pista
          </GlassButton>
        )}
        <GlassButton size="sm" variant="primary" className="flex-1" onClick={onClose}>
          Lo intento
        </GlassButton>
      </div>

      {/* Etiqueta de transparencia ética obligatoria (Retos 04 y 07) */}
      <div className="mt-auto p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-2 text-[11px] leading-snug text-indigo-900">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <span>
          Motor Local Offline Activo (Sin Internet) · Confianza: Reglas Verificadas por tu Maestro · Recuerda: Soy un guía digital y no reemplazo a tu maestro
        </span>
      </div>
    </aside>
  );
};
