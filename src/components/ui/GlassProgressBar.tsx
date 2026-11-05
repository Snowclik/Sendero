import type { FunctionalComponent } from 'preact';

interface GlassProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  accentColor?: string;
}

export const GlassProgressBar: FunctionalComponent<GlassProgressBarProps> = ({
  currentStep,
  totalSteps,
  className = '',
  accentColor = 'sky',
}) => {
  const percentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  const barColor = {
    sky: 'bg-gradient-to-r from-sky-400 to-sky-500',
    amber: 'bg-gradient-to-r from-amber-400 to-amber-500',
    emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    indigo: 'bg-gradient-to-r from-indigo-400 to-indigo-500',
  }[accentColor] || 'bg-gradient-to-r from-sky-400 to-sky-500';

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
        <span>Progreso de la Misión</span>
        <span>
          Paso {currentStep} de {totalSteps} ({percentage}%)
        </span>
      </div>
      <div className="h-3.5 w-full bg-slate-200/70 rounded-full p-0.5 border border-white/80 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out shadow-sm ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

