import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  AlertTriangle, ArrowLeft, BookOpen, Calculator, CheckCircle2, Clock, FileUp, Lightbulb, LifeBuoy,
  Printer, RotateCcw, Sparkles, Trash2, Upload, WifiOff,
} from 'lucide-preact';
import { GlassButton } from './ui/GlassButton';
import { RURAL_CLASSROOM_DATA } from '../data/missionsData';
import { decodePassport, type Mood, type StudentProfile } from '../services/storageService';
import { playSuccessSound } from '../services/soundService';

interface Props {
  currentStudent: StudentProfile | null;
  onBackToGame: () => void;
  onResetSuns: () => void;
}

type Light = 'verde' | 'ambar' | 'rojo';
interface Row {
  id: string;
  name: string;
  place: string;
  hours: number;
  missions: number;
  light: Light;
  reasons: string[];
  plan: string;
  sos: boolean;
  tag?: string;
}

const IMPORT_KEY = 'valle_teacher_imported_v2';

/** Reglas transparentes del semáforo (Retos 05, 10, 13) y ruta de segunda oportunidad (Reto 11). */
function classify(name: string, place: string, hours: number, missions: number, mood: Mood, struggles: { math: number; reading: number }, id: string, tag?: string): Row {
  const reasons: string[] = [];
  let light: Light = 'verde';
  if (mood === 'ayuda') { light = 'rojo'; reasons.push('Pidió hablar con su maestro'); }
  if (hours > 48) { light = 'rojo'; reasons.push(`Sin señal hace ${hours} h`); }
  if (light !== 'rojo') {
    if (hours > 24) { light = 'ambar'; reasons.push(`Sin actividad hace ${hours} h`); }
    if (mood === 'inquieto') { light = 'ambar'; reasons.push('Se sintió inquieto'); }
    if (struggles.math >= 2) { light = 'ambar'; reasons.push('Se atascó en Matemáticas'); }
    if (struggles.reading >= 2) { light = 'ambar'; reasons.push('Se atascó en Lectura'); }
  }
  const plan =
    light === 'rojo'
      ? 'Visita o llamada hoy. Entregar ficha impresa. Al volver: reingreso sin evaluación desde su última estación.'
      : struggles.math >= 2
      ? 'Refuerzo de 10 min con objetos reales (tapas, piedritas) antes de la siguiente misión.'
      : struggles.reading >= 2
      ? 'Lectura en voz alta en pareja, con frases cortas y palabras clave subrayadas.'
      : light === 'ambar'
      ? 'Mensaje de ánimo y check-in emocional al retomar.'
      : 'Continuar con el dosificador de 3 soles diarios.';
  return { id, name, place, hours, missions, light, reasons: reasons.length ? reasons : ['Activo y al día'], plan, sos: mood === 'ayuda', tag };
}

const hoursSince = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));

const LIGHT = {
  verde: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Activo' },
  ambar: { dot: 'bg-amber-400', chip: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Revisar' },
  rojo: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Urgente' },
};

// ---------------------------------------------------------------------------
// Copiloto docente: reglas locales de redacción para TDAH ("entrenador invisible")
// ---------------------------------------------------------------------------
type Tip = { ok: boolean; text: string };
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function coach(subject: 'Matemáticas' | 'Lectura', story: string, question: string, options: string[], correct: number): Tip[] {
  const tips: Tip[] = [];
  const longSentence = `${story} ${question}`.split(/(?<=[.?!])\s+/).find((s) => words(s) > 12);
  if (longSentence) tips.push({ ok: false, text: `Frase de ${words(longSentence)} palabras: córtala en dos (máximo 12).` });
  const storySentences = story.split(/(?<=[.?!])\s+/).filter(Boolean).length;
  if (storySentences > 2) tips.push({ ok: false, text: `La historia tiene ${storySentences} frases. Usa 2 como máximo.` });
  if (/\b(no|nunca|ningún|ninguna)\b/i.test(question)) tips.push({ ok: false, text: 'Pregunta en negativo: confunde. Pregúntalo en positivo.' });
  if (subject === 'Matemáticas') {
    const nums = question.match(/\d+/g) ?? [];
    if (!nums.length) tips.push({ ok: false, text: 'Agrega números concretos y objetos del albergue (litros, cajas, tablas).' });
    else if (nums.length > 3) tips.push({ ok: false, text: `Hay ${nums.length} números. Usa hasta 3 para no saturar la memoria de trabajo.` });
    else tips.push({ ok: true, text: 'Cantidades concretas y pocas: bien.' });
  }
  const filled = options.filter((o) => o.trim());
  if (filled.length < 3) tips.push({ ok: false, text: 'Escribe 3 opciones cortas: 1 correcta y 2 creíbles.' });
  else {
    const lens = options.map(words);
    const others = lens.filter((_, i) => i !== correct);
    if (lens[correct] > Math.max(...others) + 4) tips.push({ ok: false, text: 'La opción correcta es mucho más larga: los niños la adivinan por el tamaño.' });
    if (lens.some((l) => l > 10)) tips.push({ ok: false, text: 'Alguna opción pasa de 10 palabras. Acórtala.' });
  }
  if (!tips.some((t) => !t.ok)) tips.push({ ok: true, text: 'Lista para imprimir: corta, concreta y en 3 pasos.' });
  return tips;
}

export const TeacherView: FunctionalComponent<Props> = ({ currentStudent, onBackToGame, onResetSuns }) => {
  const [tab, setTab] = useState<'semaforo' | 'copiloto' | 'pasaportes'>('semaforo');
  const [imported, setImported] = useState<StudentProfile[]>([]);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const [subject, setSubject] = useState<'Matemáticas' | 'Lectura'>('Matemáticas');
  const [title, setTitle] = useState('Leche para los más pequeños');
  const [story, setStory] = useState('Llegaron cajas de leche al albergue. Hay que repartirlas con justicia.');
  const [question, setQuestion] = useState('Hay 15 cajas y 5 niños. ¿Cuántas cajas recibe cada niño?');
  const [options, setOptions] = useState(['3 cajas', '5 cajas', '10 cajas']);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    try {
      setImported(JSON.parse(localStorage.getItem(IMPORT_KEY) || '[]'));
    } catch {}
  }, []);

  const saveImported = (list: StudentProfile[]) => {
    setImported(list);
    try {
      localStorage.setItem(IMPORT_KEY, JSON.stringify(list));
    } catch {}
  };

  const importCode = (raw: string) => {
    try {
      const p = decodePassport(raw);
      saveImported([...imported.filter((i) => i.name !== p.name), p]);
      setCode('');
      playSuccessSound();
      setStatus({ ok: true, text: `Pasaporte de ${p.name} verificado y agregado al semáforo.` });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : 'Código no válido.' });
    }
  };

  const rows: Row[] = [
    ...(currentStudent
      ? [classify(currentStudent.name, 'Este dispositivo', 0, currentStudent.completedMissions.length, currentStudent.emotionalStatus, currentStudent.struggles, 'live', 'En vivo')]
      : []),
    ...imported.map((p) => classify(p.name, 'Pasaporte importado', hoursSince(p.lastActiveAt), p.completedMissions.length, p.emotionalStatus, p.struggles, p.id, 'Importado')),
    ...RURAL_CLASSROOM_DATA.map((s) => classify(s.name, s.community, s.lastActiveHoursAgo, s.completedMissionsCount, s.mood, s.struggles, s.id, 'Ejemplo')),
  ];
  const order = { rojo: 0, ambar: 1, verde: 2 };
  rows.sort((a, b) => order[a.light] - order[b.light]);
  const tips = coach(subject, story, question, options, correct);

  const Tab = ({ id, label, Icon }: { id: typeof tab; label: string; Icon: any }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${tab === id ? 'bg-sky-500 text-white shadow-md' : 'bg-white/70 text-slate-700 hover:bg-white'}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
  const card = 'bg-white/80 backdrop-blur-2xl border-2 border-white/90 shadow-[0_12px_40px_rgba(14,116,144,0.08),inset_0_2px_2px_rgba(255,255,255,1)] rounded-3xl';
  const input = 'px-4 py-3 rounded-2xl border-2 border-white bg-white/90 font-semibold text-slate-800 focus:outline-none focus:border-sky-300';

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-sky-50 bg-gradient-to-br from-sky-100 via-amber-50/60 to-emerald-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex flex-col gap-5">
        <div className="no-print flex flex-wrap items-center gap-3">
          <GlassButton onClick={onBackToGame}>
            <ArrowLeft className="w-4 h-4" /> Vista Estudiante
          </GlassButton>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Centro Docente Offline</h1>
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <WifiOff className="w-3.5 h-3.5" /> Sin internet
          </span>
        </div>

        <div className="no-print flex flex-wrap gap-2">
          <Tab id="semaforo" label="Semáforo 48 h" Icon={Clock} />
          <Tab id="copiloto" label="Copiloto de misiones" Icon={Sparkles} />
          <Tab id="pasaportes" label="Importar pasaportes" Icon={Upload} />
        </div>

        {tab === 'semaforo' && (
          <div className="no-print flex flex-col gap-4">
            <div className={`${card} p-4 text-sm text-slate-600 flex flex-wrap gap-x-6 gap-y-1`}>
              <span className="font-bold text-slate-700">Reglas visibles:</span>
              <span><b className="text-emerald-700">Verde</b> activo en 24 h</span>
              <span><b className="text-amber-700">Ámbar</b> +24 h sin actividad, inquieto o atasco en una materia</span>
              <span><b className="text-rose-600">Rojo</b> +48 h sin señal o pidió ayuda</span>
              <span className="w-full text-xs text-slate-500">El check-in emocional no diagnostica: solo adapta la pantalla del niño y registra si pidió hablar con usted.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rows.map((r) => (
                <div key={r.id} className={`${card} p-4 flex flex-col gap-3`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full ${LIGHT[r.light].dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">{r.name}</p>
                      <p className="text-xs text-slate-500 truncate">{r.place} · {r.tag}</p>
                    </div>
                    {r.sos && <LifeBuoy className="w-6 h-6 text-rose-500" aria-label="Pidió ayuda" />}
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${LIGHT[r.light].chip}`}>{LIGHT[r.light].label}</span>
                  </div>
                  <div className="flex gap-1.5" aria-label={`${r.missions} de 4 estaciones`}>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-2 flex-1 rounded-full ${i < r.missions ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <ul className="text-xs text-slate-600 flex flex-col gap-0.5">
                    {r.reasons.map((x) => (
                      <li key={x} className="flex items-center gap-1.5">
                        {r.light === 'verde' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />} {x}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold text-slate-700 bg-white/80 rounded-xl px-3 py-2">
                    <span className="text-sky-700">Ruta de segunda oportunidad: </span>
                    {r.plan}
                  </p>
                </div>
              ))}
            </div>
            {currentStudent && (
              <div className={`${card} p-4 flex flex-wrap items-center gap-3`}>
                <p className="text-sm text-slate-600 flex-1">
                  {currentStudent.name} tiene {currentStudent.currentSunEnergy} de 3 soles hoy. Los soles se recargan solos cada día.
                </p>
                <GlassButton size="sm" onClick={onResetSuns}>
                  <RotateCcw className="w-4 h-4" /> Recargar soles (demostración)
                </GlassButton>
              </div>
            )}
          </div>
        )}

        {tab === 'copiloto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={`no-print ${card} p-5 flex flex-col gap-3`}>
              <div className="grid grid-cols-2 gap-2">
                {(['Matemáticas', 'Lectura'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 ${
                      subject === s ? (s === 'Matemáticas' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-emerald-100 border-emerald-200 text-emerald-800') : 'bg-white/80 border-white text-slate-600'
                    }`}
                  >
                    {s === 'Matemáticas' ? <Calculator className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />} {s}
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                Título
                <input className={input} value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                Historia corta (2 frases)
                <textarea rows={2} className={`${input} resize-none`} value={story} onInput={(e) => setStory((e.target as HTMLTextAreaElement).value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
                Pregunta
                <textarea rows={2} className={`${input} resize-none`} value={question} onInput={(e) => setQuestion((e.target as HTMLTextAreaElement).value)} />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-600">Opciones (marca la correcta)</span>
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="w-5 h-5 accent-sky-600" aria-label={`Opción ${i + 1} correcta`} />
                    <input className={`${input} flex-1 py-2`} value={o} onInput={(e) => setOptions(options.map((x, k) => (k === i ? (e.target as HTMLInputElement).value : x)))} />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Copiloto docente (reglas locales para TDAH)</span>
                {tips.map((t) => (
                  <p key={t.text} className={`text-xs font-semibold flex items-start gap-1.5 ${t.ok ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {t.ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />} {t.text}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="print-sheet bg-white rounded-2xl p-6 border border-slate-200 text-slate-800">
                <div className="flex justify-between text-xs border-b-2 border-slate-300 pb-2 mb-4">
                  <span className="font-bold">Sendero · {subject}</span>
                  <span>Nombre: ________________ Fecha: ________</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <p className="text-lg mb-4">{story}</p>
                <div className="border-2 border-slate-300 rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-slate-500 mb-1">PASO 1 · LEE</p>
                  <p className="text-xl font-semibold">{question}</p>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 mb-3 h-32">
                  <p className="text-xs font-bold text-slate-500">PASO 2 · DIBUJA O USA OBJETOS (piedritas, tapas)</p>
                </div>
                <div className="border-2 border-slate-300 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">PASO 3 · MARCA TU RESPUESTA</p>
                  {options.filter((o) => o.trim()).map((o) => (
                    <p key={o} className="text-lg flex items-center gap-3 mb-1.5">
                      <span className="inline-block w-5 h-5 border-2 border-slate-500 rounded" /> {o}
                    </p>
                  ))}
                </div>
                <p className="text-sm text-slate-600">Al terminar: respira 3 veces y cuéntale a alguien lo que aprendiste.</p>
              </div>
              <GlassButton variant="primary" size="lg" onClick={() => window.print()} className="no-print self-end">
                <Printer className="w-5 h-5" /> Imprimir Misión para Niños sin Dispositivo
              </GlassButton>
            </div>
          </div>
        )}

        {tab === 'pasaportes' && (
          <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={`${card} p-5 flex flex-col gap-3`}>
              <p className="font-bold text-slate-800">Pegar o cargar el código del pasaporte</p>
              <p className="text-xs text-slate-500">Escanea el QR con cualquier lector (sin internet) y pega aquí el texto, o carga el archivo .txt de una memoria USB.</p>
              <textarea rows={5} value={code} onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)} placeholder="VR1...." className={`${input} font-mono text-xs resize-none`} />
              {status && (
                <p className={`px-3 py-2 rounded-xl text-sm font-semibold ${status.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{status.text}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/85 border-2 border-white font-semibold text-sm text-slate-800 cursor-pointer hover:bg-white">
                  <FileUp className="w-4 h-4" /> Cargar .txt
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) importCode(await f.text());
                    }}
                  />
                </label>
                <GlassButton variant="primary" onClick={() => (code.trim() ? importCode(code) : setStatus({ ok: false, text: 'Pega primero el código.' }))} className="ml-auto">
                  <Upload className="w-4 h-4" /> Verificar e importar
                </GlassButton>
              </div>
            </div>
            <div className={`${card} p-5 flex flex-col gap-2`}>
              <p className="font-bold text-slate-800">Expedientes importados</p>
              {!imported.length && <p className="text-sm text-slate-500">Aún no hay pasaportes.</p>}
              {imported.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white/85 rounded-2xl px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.completedMissions.length} de 4 estaciones · última actividad hace {hoursSince(p.lastActiveAt)} h</p>
                  </div>
                  <button onClick={() => saveImported(imported.filter((i) => i.id !== p.id))} className="p-2 rounded-xl bg-rose-50 text-rose-600" aria-label={`Quitar ${p.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
