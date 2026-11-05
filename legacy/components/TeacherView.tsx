import type { FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { RURAL_CLASSROOM_DATA } from '../data/missionsData';
import type { StudentProfile } from '../services/storageService';
import {
  ArrowLeft,
  Users,
  Printer,
  Upload,
  CheckCircle,
  AlertTriangle,
  LifeBuoy,
  Lightbulb,
  Trash2,
  Calculator,
  BookOpen,
  Clock,
} from 'lucide-preact';
import { playClickSound, playSuccessSound } from '../services/soundService';

interface TeacherViewProps {
  onBackToGame: () => void;
  currentStudent: StudentProfile;
}

type Light = 'verde' | 'ambar' | 'rojo';

interface Row {
  id: string;
  name: string;
  place: string;
  hoursAgo: number;
  missions: number;
  help: string;
  light: Light;
  sos: boolean;
  plan: string;
  live?: boolean;
  imported?: boolean;
}

const STORE_KEY = 'valle_resiliente_classroom_v1';

const LIGHT_STYLE: Record<Light, { dot: string; chip: string; label: string; card: string }> = {
  verde: {
    dot: 'bg-[#7fb83a]',
    chip: 'bg-[#e4f2c8] text-[#33501a] border-[#b9d98a]',
    label: 'Al día',
    card: 'border-[#d8c7a6]',
  },
  ambar: {
    dot: 'bg-[#f5a524]',
    chip: 'bg-[#fdebc4] text-[#7a4a05] border-[#f3cd7e]',
    label: 'Revisar',
    card: 'border-[#f3cd7e]',
  },
  rojo: {
    dot: 'bg-[#e06d53]',
    chip: 'bg-[#fbd9d1] text-[#7c2a1a] border-[#efa393]',
    label: 'Urgente',
    card: 'border-[#efa393]',
  },
};

function planFor(light: Light, help: string): string {
  if (light === 'rojo') return 'Visita o ficha impresa. Ruta de segunda oportunidad.';
  if (light === 'ambar') return `Refuerzo corto en ${help}.`;
  return 'Seguir con el dosificador de 3 soles.';
}

function rowFromProfile(p: StudentProfile, live = false, imported = false): Row {
  const hours = live
    ? 0
    : Math.max(0, Math.round((Date.now() - new Date(p.lastPlayedDate).getTime()) / 36e5));
  let light: Light = 'verde';
  if (p.emotionalStatus === 'ayuda' || hours > 48) light = 'rojo';
  else if (p.emotionalStatus === 'inquieto' || hours > 24) light = 'ambar';

  const done = p.completedMissions.length;
  const help =
    done >= 4
      ? 'Ninguna'
      : p.talentScores.mathProblemSolving <= p.talentScores.readingComprehension
      ? 'Matemáticas'
      : 'Lectura';

  return {
    id: `${live ? 'live' : 'imp'}-${p.id}-${p.name}`,
    name: live ? `${p.name} (en vivo)` : p.name,
    place: live ? 'Este dispositivo' : 'Pasaporte importado',
    hoursAgo: hours,
    missions: done,
    help,
    light,
    sos: p.emotionalStatus === 'ayuda',
    plan: planFor(light, help),
    live,
    imported,
  };
}

export const TeacherView: FunctionalComponent<TeacherViewProps> = ({
  onBackToGame,
  currentStudent,
}) => {
  const [tab, setTab] = useState<'semaforo' | 'mision' | 'pasaportes'>('semaforo');
  const [imported, setImported] = useState<StudentProfile[]>([]);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const [subject, setSubject] = useState<'Matemáticas' | 'Lectura'>('Matemáticas');
  const [title, setTitle] = useState('Reparto de leche en el albergue');
  const [prompt, setPrompt] = useState(
    'Hay 15 cajas de leche y 5 niños pequeños. ¿Cuántas cajas le tocan a cada uno?'
  );

  // Cargar alumnos importados (persisten sin tocar el perfil del jugador)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setImported(JSON.parse(raw));
    } catch {}
  }, []);

  const saveImported = (list: StudentProfile[]) => {
    setImported(list);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
    } catch {}
  };

  const rows: Row[] = [
    rowFromProfile(currentStudent, true),
    ...imported.map((p) => rowFromProfile(p, false, true)),
    ...RURAL_CLASSROOM_DATA.map<Row>((s) => ({
      id: s.id,
      name: s.name,
      place: s.community,
      hoursAgo: s.lastActiveHoursAgo,
      missions: s.completedMissionsCount,
      help: s.subjectNeedingHelp.startsWith('Ninguna')
        ? 'Ninguna'
        : s.subjectNeedingHelp.startsWith('Lectura')
        ? 'Lectura'
        : s.subjectNeedingHelp.startsWith('Mate')
        ? 'Matemáticas'
        : 'Sin señal',
      light: s.alertStatus,
      sos: s.safetyFlag,
      plan: s.recoveryPlan,
    })),
  ];

  const order: Record<Light, number> = { rojo: 0, ambar: 1, verde: 2 };
  const sorted = [...rows].sort((a, b) => order[a.light] - order[b.light]);
  const count = (l: Light) => rows.filter((r) => r.light === l).length;

  const handleImport = () => {
    playClickSound();
    if (!code.trim()) {
      setStatus({ ok: false, text: 'Pega primero el código del pasaporte.' });
      return;
    }
    try {
      const parsed = JSON.parse(code);
      const p: StudentProfile | undefined = parsed.student ?? (parsed.name ? parsed : undefined);
      if (!p || !Array.isArray(p.completedMissions)) {
        setStatus({ ok: false, text: 'El código no parece un pasaporte válido.' });
        return;
      }
      const next = [...imported.filter((i) => i.name !== p.name), p];
      saveImported(next);
      setCode('');
      playSuccessSound();
      setStatus({ ok: true, text: `Pasaporte de ${p.name} sincronizado.` });
    } catch {
      setStatus({ ok: false, text: 'El código está incompleto o dañado.' });
    }
  };

  const tabBtn = (id: typeof tab, label: string, Icon: any) => (
    <button
      type="button"
      onClick={() => {
        playClickSound();
        setTab(id);
      }}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-extrabold text-sm transition-all ${
        tab === id
          ? 'bg-[#a3c95c] text-[#2d3a14] shadow-md scale-105'
          : 'bg-[#fcf7eb] text-[#5c3a21] hover:bg-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{
        background:
          'radial-gradient(circle at 12% 8%, #fff7d6 0, transparent 40%), radial-gradient(circle at 90% 90%, #cfe9c4 0, transparent 45%), #f3ead2',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-8 flex flex-col gap-5 no-print">
        {/* Cabecera */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onBackToGame();
            }}
            className="flex items-center gap-2 bg-[#fcf7eb] hover:bg-white text-[#3d2b1f] px-4 py-2.5 rounded-2xl border-2 border-[#d8c7a6] shadow-lg font-extrabold text-sm transition-transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Valle</span>
          </button>

          <div className="-rotate-1 bg-[#fcf7eb] rounded-[24px] p-2 shadow-lg">
            <div className="border-2 border-dashed border-[#c8b692] rounded-[18px] px-6 py-2 flex items-center gap-3">
              <Users className="w-6 h-6 text-[#6c80b5]" />
              <span className="text-xl sm:text-2xl font-black text-[#3d2b1f]">Aula del Maestro</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#285961]/90 text-white px-4 py-2 rounded-full text-xs font-extrabold shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a3c95c]" />
            <span>Sin internet</span>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-full bg-[#fcf7eb]/60 w-full sm:w-fit">
          {tabBtn('semaforo', 'Semáforo', Clock)}
          {tabBtn('mision', 'Nueva misión', Printer)}
          {tabBtn('pasaportes', 'Pasaportes', Upload)}
        </div>

        {/* ===== SEMÁFORO ===== */}
        {tab === 'semaforo' && (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {(['verde', 'ambar', 'rojo'] as Light[]).map((l) => (
                <div
                  key={l}
                  className={`rounded-[26px] bg-[#fcf7eb] p-2 shadow-lg border-2 ${LIGHT_STYLE[l].card}`}
                >
                  <div className="border-2 border-dashed border-[#e2d5b5] rounded-[20px] py-3 flex flex-col items-center">
                    <span className={`w-5 h-5 rounded-full ${LIGHT_STYLE[l].dot} mb-1`} />
                    <span className="text-4xl font-black text-[#3d2b1f] leading-none">{count(l)}</span>
                    <span className="text-xs font-extrabold text-[#7c6248] mt-1">
                      {LIGHT_STYLE[l].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-[26px] bg-[#fcf7eb] p-2 shadow-lg border-2 ${LIGHT_STYLE[r.light].card}`}
                >
                  <div className="border-2 border-dashed border-[#e2d5b5] rounded-[20px] p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-2xl bg-[#e8dfc6] flex items-center justify-center text-xl font-black text-[#5c3a21]">
                        {r.name.charAt(0)}
                        <span
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#fcf7eb] ${LIGHT_STYLE[r.light].dot}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-[#3d2b1f] text-base truncate">{r.name}</p>
                        <p className="text-xs font-bold text-[#7c6248] truncate">{r.place}</p>
                      </div>
                      {r.sos && (
                        <span className="w-9 h-9 rounded-full bg-[#fbd9d1] flex items-center justify-center text-[#c24a30]">
                          <LifeBuoy className="w-5 h-5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-full border-2 ${
                              i < r.missions
                                ? 'bg-[#a3c95c] border-[#7ca333]'
                                : 'bg-transparent border-[#d8c7a6]'
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-extrabold flex items-center gap-1 ${LIGHT_STYLE[r.light].chip}`}
                      >
                        {r.light === 'verde' ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {LIGHT_STYLE[r.light].label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#5c3a21]">
                      {r.help === 'Matemáticas' ? (
                        <Calculator className="w-4 h-4 text-[#d97706]" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-[#059669]" />
                      )}
                      <span>Apoyo: {r.help}</span>
                      <span className="ml-auto text-[#7c6248]">
                        {r.hoursAgo === 0 ? 'Ahora' : `Hace ${r.hoursAgo} h`}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#7c6248] bg-[#f3ead2] rounded-xl px-3 py-2">
                      {r.plan}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== NUEVA MISIÓN ===== */}
        {tab === 'mision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-[28px] bg-[#fcf7eb] p-2.5 shadow-lg">
              <div className="border-2 border-dashed border-[#c8b692] rounded-[22px] p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {(['Matemáticas', 'Lectura'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSubject(s);
                      }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm border-2 transition-all ${
                        subject === s
                          ? s === 'Matemáticas'
                            ? 'bg-[#fdebc4] border-[#f3cd7e] text-[#7a4a05]'
                            : 'bg-[#e4f2c8] border-[#b9d98a] text-[#33501a]'
                          : 'bg-white border-[#e2d5b5] text-[#7c6248]'
                      }`}
                    >
                      {s === 'Matemáticas' ? (
                        <Calculator className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                      {s}
                    </button>
                  ))}
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black text-[#5c3a21] uppercase">Título</span>
                  <input
                    type="text"
                    value={title}
                    onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
                    className="px-4 py-3 rounded-2xl border-2 border-[#e2d5b5] bg-white font-bold text-[#3d2b1f] focus:outline-none focus:border-[#a3c95c]"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black text-[#5c3a21] uppercase">Pregunta</span>
                  <textarea
                    rows={3}
                    value={prompt}
                    onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
                    className="px-4 py-3 rounded-2xl border-2 border-[#e2d5b5] bg-white font-bold text-[#3d2b1f] focus:outline-none focus:border-[#a3c95c] resize-none"
                  />
                </label>

                <div className="flex items-start gap-3 bg-[#dfe7f5] border-2 border-[#b8c6e6] rounded-2xl p-3">
                  <Lightbulb className="w-5 h-5 text-[#4a5f9a] shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-[#2f3d66]">
                    {subject === 'Matemáticas'
                      ? 'Usa tapas o piedritas para que agrupe con las manos antes de calcular.'
                      : 'Frases de máximo 10 palabras. Subraya la acción principal.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="print-sheet rounded-[20px] bg-white p-6 shadow-lg border border-[#e2d5b5] text-[#1f2937]">
                <div className="flex justify-between border-b-2 border-slate-300 pb-2 mb-4 text-xs font-bold">
                  <span>Valle por Pieza</span>
                  <span>Nombre: ____________________</span>
                </div>
                <h3 className="text-2xl font-black mb-1">{title}</h3>
                <p className="text-xs text-slate-500 mb-4">{subject} · 3.º y 4.º primaria</p>
                <p className="text-lg font-bold leading-relaxed border-2 border-slate-300 rounded-xl p-4 mb-4">
                  {prompt}
                </p>
                <div className="border-2 border-dashed border-slate-300 rounded-xl h-32 flex items-center justify-center text-xs text-slate-400">
                  Dibuja aquí tu respuesta
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  window.print();
                }}
                className="self-end flex items-center gap-2 bg-[#a3c95c] hover:bg-[#92b84b] text-[#2d3a14] px-6 py-3 rounded-2xl font-black text-sm shadow-lg border-2 border-[#c2e285] transition-transform active:scale-95"
              >
                <Printer className="w-5 h-5" />
                Imprimir ficha
              </button>
            </div>
          </div>
        )}

        {/* ===== PASAPORTES ===== */}
        {tab === 'pasaportes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-[28px] bg-[#fcf7eb] p-2.5 shadow-lg">
              <div className="border-2 border-dashed border-[#c8b692] rounded-[22px] p-5 flex flex-col gap-3">
                <p className="font-black text-[#3d2b1f] text-lg">Pegar pasaporte</p>
                <textarea
                  rows={6}
                  value={code}
                  onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
                  placeholder="Código del pasaporte..."
                  className="px-4 py-3 rounded-2xl border-2 border-[#e2d5b5] bg-white font-mono text-xs text-[#3d2b1f] focus:outline-none focus:border-[#a3c95c] resize-none"
                />
                {status && (
                  <p
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold ${
                      status.ok ? 'bg-[#e4f2c8] text-[#33501a]' : 'bg-[#fbd9d1] text-[#7c2a1a]'
                    }`}
                  >
                    {status.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleImport}
                  className="self-end flex items-center gap-2 bg-[#6c80b5] hover:bg-[#5b6fa3] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg border-2 border-[#8fa2d4] transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  Sincronizar
                </button>
              </div>
            </div>

            <div className="rounded-[28px] bg-[#fcf7eb] p-2.5 shadow-lg">
              <div className="border-2 border-dashed border-[#c8b692] rounded-[22px] p-5 flex flex-col gap-3 min-h-[200px]">
                <p className="font-black text-[#3d2b1f] text-lg">Alumnos sincronizados</p>
                {imported.length === 0 && (
                  <p className="text-sm font-bold text-[#7c6248]">Aún no hay pasaportes.</p>
                )}
                {imported.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between bg-white rounded-2xl border-2 border-[#e2d5b5] px-4 py-3"
                  >
                    <div>
                      <p className="font-black text-[#3d2b1f]">{p.name}</p>
                      <p className="text-xs font-bold text-[#7c6248]">
                        {p.completedMissions.length} de 4 estaciones
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        saveImported(imported.filter((i) => i.name !== p.name));
                      }}
                      className="w-9 h-9 rounded-xl bg-[#fbd9d1] text-[#c24a30] flex items-center justify-center"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
