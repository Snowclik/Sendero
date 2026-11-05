import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { GlassBadge } from './ui/GlassBadge';
import { QrGeneratorSvg } from './ui/QrGeneratorSvg';
import type { StudentProfile } from '../services/storageService';
import { generateSignedPassport } from '../services/storageService';
import {
  X,
  Award,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Users,
  Compass,
  HeartHandshake,
  Brain,
  Calculator,
  BookOpen,
} from 'lucide-preact';
import { playClickSound } from '../services/soundService';

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
}

export const PassportModal: FunctionalComponent<PassportModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const signedPassport = generateSignedPassport(student);
  const jsonExportString = JSON.stringify(signedPassport);

  const handleCopyCode = () => {
    playClickSound();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonExportString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const talentList = [
    {
      name: 'Perseverancia y Enfoque',
      score: student.talentScores.perseverance,
      icon: Compass,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      name: 'Pensamiento Crítico y Verdad',
      score: student.talentScores.criticalThinking,
      icon: Brain,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
    },
    {
      name: 'Colaboración en Dúo',
      score: student.duoModeCompleted ? 95 : student.talentScores.collaboration,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      name: 'Calma en Emergencias',
      score: student.talentScores.emergencyCalm,
      icon: HeartHandshake,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      name: 'Ingenio Matemático',
      score: student.talentScores.mathProblemSolving,
      icon: Calculator,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      name: 'Lectura Comprensiva',
      score: student.talentScores.readingComprehension,
      icon: BookOpen,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <GlassCard className="max-w-2xl w-full p-6 sm:p-8 relative border-2 border-white shadow-2xl my-6">
        {/* Botón de Cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Cerrar Pasaporte Escolar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Pasaporte */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-100/90 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-md">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  Pasaporte Escolar Portátil
                </h2>
                <GlassBadge variant="emerald" size="sm">
                  100% Offline
                </GlassBadge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Valle Resiliente · Expediente de Continuidad Educativa en Emergencias
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Estudiante Registrado
            </span>
            <span className="text-sm font-bold text-slate-800">{student.name}</span>
            <span className="text-xs text-slate-500 block">3.º / 4.º Primaria Rural</span>
          </div>
        </div>

        {/* Contenido en Dos Columnas: QR Offline + Mapa de Talentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 items-center">
          {/* Columna Izquierda: QR SVG Nativo Offline */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-3xl border border-slate-200">
            <QrGeneratorSvg
              value={jsonExportString}
              size={180}
              title={`Pasaporte de ${student.name}`}
            />
            <div className="mt-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Firma Criptográfica Local</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Hash: {signedPassport.signatureHash}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-tight">
                El maestro puede escanear este código con su celular sin internet para sincronizar la ficha.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Mapa de Talentos Más Allá de las Notas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Mapa de Talentos del Estudiante
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {student.completedMissions.length} de 4 Misiones
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {talentList.map((talent) => {
                const IconComponent = talent.icon;
                return (
                  <div
                    key={talent.name}
                    className="p-2.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border ${talent.color}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {talent.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${talent.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-8 text-right">
                        {talent.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Acciones y Exportación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleCopyCode}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Código de Expediente Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copiar Código Digital para el Maestro</span>
              </>
            )}
          </GlassButton>

          <GlassButton variant="primary" size="md" onClick={onClose} className="w-full sm:w-auto">
            Continuar Explorando
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

