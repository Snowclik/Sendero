import type { FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { SquirrelArt } from './Art';
import { GlassButton } from './GlassButton';
import { Wind, CheckCircle2, X } from 'lucide-preact';
import { playSuccessSound } from '../../services/soundService';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  durationSeconds?: number;
  message?: string;
}

export const BreathingModal: FunctionalComponent<BreathingModalProps> = ({
  isOpen,
  onClose,
  title = 'Respira con Chispa',
  durationSeconds = 15,
  message = 'Sigue el círculo: Inhala despacio cuando crezca... y exhala suave cuando se encoja.',
}) => {
  const [phase, setPhase] = useState<'inhala' | 'exhala'>('inhala');
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(durationSeconds);
      setCompleted(false);
      setPhase('inhala');
      return;
    }

    // Intervalo de cuenta regresiva
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCompleted(true);
          playSuccessSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Ciclo de respiración (4 segundos inhala, 4 segundos exhala)
    const breathCycle = setInterval(() => {
      setPhase((p) => (p === 'inhala' ? 'exhala' : 'inhala'));
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(breathCycle);
    };
  }, [isOpen, durationSeconds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-50/40 backdrop-blur-md animate-fadeIn">
      <div className="cozy-panel max-w-md w-full p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-500"
          aria-label="Cerrar modal de respiración"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="cozy-ribbon inline-flex items-center gap-2"><Wind className="w-5 h-5" /> {title}</span>
        <p className="sr-only">{message}</p>

        {/* Círculo de Respiración Guiada con animación suave diurna */}
        <div className="relative flex items-center justify-center my-4 h-52">
          {/* Anillos exteriores de resonancia */}
          <div
            className={`keep-motion absolute w-44 h-44 rounded-full transition-all duration-[4000ms] ease-in-out ${
              phase === 'inhala'
                ? 'scale-110 bg-emerald-100/60'
                : 'scale-90 bg-sky-100/40'
            }`}
          />
          <div
            className={`keep-motion w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-[4000ms] ease-in-out ${
              phase === 'inhala'
                ? 'scale-105 bg-gradient-to-tr from-emerald-200 to-sky-200 border-4 border-white'
                : 'scale-75 bg-gradient-to-tr from-sky-200 to-emerald-100 border-2 border-white'
            }`}
          >
            <SquirrelArt mood={completed ? 'happy' : 'idle'} size={80} />
            <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
              {completed ? '¡Listo!' : phase === 'inhala' ? 'Inhala' : 'Exhala'}
            </span>
          </div>
        </div>

        {completed ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <GlassButton variant="primary" size="lg" onClick={onClose} className="w-full">
              <CheckCircle2 className="w-5 h-5" /> ¡Me siento mejor!
            </GlassButton>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex gap-1">{Array.from({ length: durationSeconds }).map((_, i) => <span key={i} className={`w-2 h-2 rounded-full ${i < durationSeconds - timeLeft ? 'bg-sky-400' : 'bg-[#eadcbc]'}`} />)}</div>
            <GlassButton variant="ghost" size="sm" onClick={onClose} className="text-slate-500">
              Omitir por ahora
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
};

