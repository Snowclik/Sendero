import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Award, BookOpen, Brain, Calculator, Check, Compass, Copy, Download, HeartHandshake, Lock, Star, Users, X } from 'lucide-preact';
import { GlassButton } from './ui/GlassButton';
import { QrGeneratorSvg } from './ui/QrGeneratorSvg';
import { encodePassport, exportPassportFile, isTauriEnvironment, type StudentProfile } from '../services/storageService';
import { getBadges } from '../data/missionsData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
}

const Stars = ({ score }: { score: number }) => {
  const n = Math.round(score / 20); // 0..5
  return (
    <span className="flex gap-0.5" aria-label={`${n} de 5 estrellas`}>
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`w-3.5 h-3.5 ${i < n ? 'text-amber-400 fill-amber-300' : 'text-[#e6d3ab]'}`} />)}
    </span>
  );
};

export const PassportModal: FunctionalComponent<Props> = ({ isOpen, onClose, student }) => {
  const [status, setStatus] = useState<string | null>(null);
  if (!isOpen) return null;

  const { code, seal } = encodePassport(student);
  const t = student.talentScores;
  const talents = [
    { name: 'Perseverancia', score: t.perseverance, Icon: Compass, tone: 'bg-amber-400' },
    { name: 'Pensamiento Crítico', score: t.criticalThinking, Icon: Brain, tone: 'bg-indigo-400' },
    { name: 'Colaboración en Dúo', score: t.collaboration, Icon: Users, tone: 'bg-sky-400' },
    { name: 'Calma en Emergencias', score: t.emergencyCalm, Icon: HeartHandshake, tone: 'bg-teal-500' },
    { name: 'Ingenio con Números', score: t.mathProblemSolving, Icon: Calculator, tone: 'bg-orange-400' },
    { name: 'Gran Lector', score: t.readingComprehension, Icon: BookOpen, tone: 'bg-emerald-500' },
  ];
  const badges = getBadges(student);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('¡Código copiado!');
    } catch {
      setStatus('No se pudo copiar.');
    }
  };
  const save = async () => {
    try {
      const path = await exportPassportFile(student);
      setStatus(path ? `Guardado en ${path}` : null);
    } catch (e) {
      setStatus(`No se pudo guardar: ${e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-100/50 backdrop-blur-sm overflow-y-auto">
      <div className="cozy-panel relative w-full max-w-3xl my-6 p-5 sm:p-6 animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-500" aria-label="Cerrar pasaporte">
          <X className="w-5 h-5" />
        </button>
        <div className="flex justify-center mb-5"><span className="cozy-ribbon text-lg">Mi Pasaporte Escolar</span></div>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5">
          {/* Boleto con QR */}
          <div className="cozy-tile p-3 flex flex-col items-center gap-2 self-start">
            <p className="font-black text-slate-800">{student.name}</p>
            <QrGeneratorSvg value={code} size={190} title={`Pasaporte de ${student.name}`} />
            <span className="w-full border-t-[3px] border-dashed border-[#f1e4c6]" />
            <span className="text-[11px] font-mono font-bold text-slate-400">SELLO {seal}</span>
            <span className="flex gap-1">
              {[0, 1, 2, 3].map((i) => <span key={i} className={`w-3 h-3 rounded-full ${i < student.completedMissions.length ? 'bg-emerald-500' : 'bg-[#eadcbc]'}`} />)}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2.5">
              {talents.map(({ name, score, Icon, tone }) => (
                <div key={name} className="cozy-tile p-2 flex flex-col items-center gap-1 text-center">
                  <span className={`w-12 h-12 rounded-full border-[3px] border-white shadow-[0_4px_0_rgba(0,0,0,.12)] flex items-center justify-center text-white ${tone}`}>
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-[11px] font-black text-slate-700 leading-tight">{name}</span>
                  <Stars score={score} />
                </div>
              ))}
            </div>
            <div className="cozy-inset p-3 flex flex-wrap gap-3 justify-center">
              {badges.map((b) => (
                <div key={b.id} className="flex flex-col items-center gap-1 w-[76px] text-center" title={b.why}>
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center ${b.earned ? 'bg-amber-300 text-white shadow-[0_4px_0_#d97706]' : 'bg-[#eadcbc] text-white'}`}>
                    {b.earned ? <Award className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
                  </span>
                  <span className={`text-[10px] font-black leading-tight ${b.earned ? 'text-amber-800' : 'text-[#b49a66]'}`}>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          <GlassButton size="sm" onClick={copy}><Copy className="w-4 h-4" /> Copiar código</GlassButton>
          {isTauriEnvironment() && <GlassButton size="sm" onClick={save}><Download className="w-4 h-4" /> Guardar en Documentos</GlassButton>}
          {status && <span className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4" /> {status}</span>}
          <GlassButton size="md" variant="primary" onClick={onClose} className="ml-auto">Volver al valle</GlassButton>
        </div>
      </div>
    </div>
  );
};
