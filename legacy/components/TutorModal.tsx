import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';
import {
  Compass,
  Lightbulb,
  ShieldCheck,
  Volume2,
  X,
  ChevronRight,
  HelpCircle,
} from 'lucide-preact';
import { speakLocalText, playHintSound } from '../services/soundService';

interface SocraticHints {
  level1_question: string;
  level2_visual: string;
  level3_analogy: string;
}

interface TutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  hints: SocraticHints;
  stepTitle: string;
}

export const TutorModal: FunctionalComponent<TutorModalProps> = ({
  isOpen,
  onClose,
  hints,
  stepTitle,
}) => {
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const handleNextLevel = () => {
    playHintSound();
    setCurrentLevel((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 3));
  };

  const handleReadText = (text: string) => {
    speakLocalText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-fadeIn">
      <GlassCard className="max-w-lg w-full p-6 relative border-2 border-white shadow-2xl flex flex-col gap-4">
        {/* Encabezado del Tutor */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Tutor Socrático Local
                <GlassBadge variant="indigo" size="sm">
                  Paso a Paso
                </GlassBadge>
              </h3>
              <p className="text-xs text-slate-500">{stepTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Cerrar panel de tutor socrático"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ETIQUETA ÉTICA VISIBLE OBLIGATORIA (Retos 04 y 07) */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900">
          <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="leading-snug">
            <span className="font-semibold block">Transparencia y Ética Digital:</span>
            Motor Local Offline Activo (Sin Internet) · Confianza: Reglas Verificadas por tu Maestro · Recuerda: Soy un guía digital y no reemplazo a tu maestro humano.
          </div>
        </div>

        {/* Niveles de Pistas Progresivas */}
        <div className="flex flex-col gap-3 my-1">
          {/* Nivel 1: Pregunta Guía Socrática */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentLevel >= 1
                ? 'bg-amber-50/80 border-amber-200 shadow-sm'
                : 'bg-slate-50/50 border-slate-200 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Pista 1: Pregunta Guía para Pensar
              </span>
              <button
                onClick={() => handleReadText(hints.level1_question)}
                className="p-1 rounded-lg hover:bg-amber-200/50 text-amber-700"
                title="Escuchar pista"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {hints.level1_question}
            </p>
          </div>

          {/* Nivel 2: Pista Visual de Bloques */}
          {currentLevel >= 2 && (
            <div className="p-4 rounded-2xl border bg-sky-50/80 border-sky-200 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-sky-600" />
                  Pista 2: Pista Visual y de Grupos
                </span>
                <button
                  onClick={() => handleReadText(hints.level2_visual)}
                  className="p-1 rounded-lg hover:bg-sky-200/50 text-sky-700"
                  title="Escuchar pista"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {hints.level2_visual}
              </p>
            </div>
          )}

          {/* Nivel 3: Ejemplo Análogo Concreto */}
          {currentLevel >= 3 && (
            <div className="p-4 rounded-2xl border bg-emerald-50/80 border-emerald-200 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  Pista 3: Ejemplo de la Vida Cotidiana
                </span>
                <button
                  onClick={() => handleReadText(hints.level3_analogy)}
                  className="p-1 rounded-lg hover:bg-emerald-200/50 text-emerald-700"
                  title="Escuchar pista"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {hints.level3_analogy}
              </p>
            </div>
          )}
        </div>

        {/* Acciones del Modal */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {currentLevel < 3 ? (
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={handleNextLevel}
              className="text-xs gap-1.5"
            >
              <span>Necesito otra pista</span>
              <ChevronRight className="w-4 h-4" />
            </GlassButton>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              ¡Tienes todas las pistas del Guía!
            </span>
          )}

          <GlassButton variant="primary" size="sm" onClick={onClose}>
            ¡Entendido, volver a intentar!
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

