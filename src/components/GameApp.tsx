import type { FunctionalComponent } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Check, GraduationCap, Lock, MousePointerClick, QrCode, Sun, Tent, Volume2, WifiOff, Wind } from 'lucide-preact';
import { IsoWorld, type StationState } from '../game/IsoWorld';
import { MissionPanel, STATION_ICONS, type MissionResult } from './MissionPanel';
import { TeacherView } from './TeacherView';
import { PassportModal } from './PassportModal';
import { BreathingModal } from './ui/BreathingModal';
import { GlassButton } from './ui/GlassButton';
import { SquirrelArt } from './ui/Art';
import { AVATARS, CheckInModal, MOODS, ProfileScreen } from './Onboarding';
import { MISSIONS, getBadges, isUnlocked, missionById, nextMission, type Mission, type MissionId } from '../data/missionsData';
import {
  MAX_SUNS, createProfile, isTauriEnvironment, loadStore, normalizeProfile, saveStore,
  type Mood, type SaveStore, type StudentProfile,
} from '../services/storageService';
import { playClickSound, speakLocalText } from '../services/soundService';

const clamp100 = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
const NAMES = Object.fromEntries(MISSIONS.map((m) => [m.id, m.stationName])) as Record<MissionId, string>;
const roundBtn = 'w-12 h-12 rounded-2xl bg-[#fffaf0] border-[3px] border-white shadow-[0_5px_0_rgba(146,112,52,.22)] flex items-center justify-center text-slate-700 active:translate-y-[3px] active:shadow-[0_2px_0_rgba(146,112,52,.22)] transition-all';
const Cap = ({ k }: { k: string }) => (
  <kbd className="min-w-[26px] h-[26px] px-1 rounded-lg bg-white border-2 border-[#f1e4c6] shadow-[0_3px_0_#e6d3ab] flex items-center justify-center text-xs font-black text-slate-600">{k}</kbd>
);

export const GameApp: FunctionalComponent = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<IsoWorld | null>(null);
  const interactRef = useRef<(id: MissionId) => void>(() => {});

  const [store, setStore] = useState<SaveStore | null>(null);
  const [phase, setPhase] = useState<'profile' | 'checkin' | 'play'>('profile');
  const [view, setView] = useState<'student' | 'teacher'>('student');
  const [near, setNear] = useState<MissionId | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [sqLine, setSqLine] = useState<string | null>(null); // frase temporal de Chispa (reemplaza los avisos)
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const [passport, setPassport] = useState(false);
  const [breath, setBreath] = useState<number | null>(null);
  const [webglError, setWebglError] = useState(false);

  const student = store?.profiles.find((p) => p.id === store.activeId) ?? null;
  const suns = student?.currentSunEnergy ?? MAX_SUNS;
  const calm = student?.emotionalStatus === 'inquieto';
  const objective = student ? nextMission(student.completedMissions) : null;
  const resting = phase === 'play' && view === 'student' && !mission && suns === 0;

  // --- Persistencia --------------------------------------------------------
  useEffect(() => {
    loadStore().then(setStore);
  }, []);
  const commit = (next: SaveStore) => {
    setStore(next);
    saveStore(next);
  };
  const updateStudent = (fn: (p: StudentProfile) => StudentProfile) => {
    if (!store || !student) return;
    const updated = { ...fn(student), lastActiveAt: new Date().toISOString() };
    commit({ ...store, profiles: store.profiles.map((p) => (p.id === updated.id ? updated : p)) });
  };

  // --- Motor 3D ------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    try {
      const w = new IsoWorld(mountRef.current, { onNear: setNear, onInteract: (id) => interactRef.current(id) });
      worldRef.current = w;
      setAnchor(w.squirrelAnchor);
      return () => {
        w.dispose();
        worldRef.current = null;
      };
    } catch (e) {
      console.error('WebGL no disponible:', e);
      setWebglError(true);
    }
  }, []);

  const completedKey = student?.completedMissions.join(',') ?? '';
  useEffect(() => {
    const done = student?.completedMissions ?? [];
    const states = Object.fromEntries(
      MISSIONS.map((m) => [m.id, done.includes(m.id) ? 'done' : isUnlocked(m.id, done) ? 'open' : 'locked'])
    ) as Record<MissionId, StationState>;
    worldRef.current?.setStations(states, objective?.id ?? null, NAMES);
  }, [completedKey, student?.id]);

  const inputOn = phase === 'play' && view === 'student' && !mission && !passport && breath === null && !resting;
  useEffect(() => worldRef.current?.setInputEnabled(inputOn), [inputOn]);
  useEffect(() => worldRef.current?.setCalm(calm), [calm]);
  useEffect(() => worldRef.current?.focusStation(mission?.id ?? null), [mission]);
  useEffect(() => {
    if (!sqLine) return;
    const t = setTimeout(() => setSqLine(null), 5000);
    return () => clearTimeout(t);
  }, [sqLine]);

  // --- Entrar a una estación --------------------------------------------
  const tryStart = (id: MissionId) => {
    if (!student || !inputOn) return;
    const done = student.completedMissions;
    if (!isUnlocked(id, done)) {
      const prev = MISSIONS[MISSIONS.findIndex((x) => x.id === id) - 1];
      setSqLine(`¡Aún no! Primero: ${prev.stationName}.`);
      return;
    }
    if (suns === 0) return;
    playClickSound();
    setMission(missionById(id)!);
  };
  interactRef.current = tryStart;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (tag === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
      if (near && ['e', 'E', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        tryStart(near);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Resultado de misión ----------------------------------------------
  const completeMission = (r: MissionResult): string[] => {
    if (!student || !mission) return [];
    const isMath = mission.subject === 'Matemáticas';
    const before = new Set(getBadges(student).filter((b) => b.earned).map((b) => b.id));
    const t = student.talentScores;
    const next: StudentProfile = {
      ...student,
      completedMissions: student.completedMissions.includes(mission.id) ? student.completedMissions : [...student.completedMissions, mission.id],
      currentSunEnergy: Math.max(0, student.currentSunEnergy - 1),
      duoModeCompleted: student.duoModeCompleted || r.duo,
      resilienceEarned: student.resilienceEarned || r.mistakes > 0,
      struggles: {
        math: student.struggles.math + (isMath ? r.struggledSteps : 0),
        reading: student.struggles.reading + (isMath ? 0 : r.struggledSteps),
      },
      // Talentos: suben solo con evidencia concreta de la misión
      talentScores: {
        perseverance: clamp100(t.perseverance + (r.mistakes > 0 ? 15 : 8)),
        criticalThinking: clamp100(t.criticalThinking + (mission.id === 'mision-2-rumor' ? 25 : 6)),
        collaboration: clamp100(t.collaboration + (r.duo ? 35 : 0)),
        emergencyCalm: clamp100(t.emergencyCalm + 8),
        mathProblemSolving: clamp100(t.mathProblemSolving + (isMath ? 22 : 0)),
        readingComprehension: clamp100(t.readingComprehension + (isMath ? 0 : 22)),
      },
    };
    updateStudent(() => next);
    return getBadges(next).filter((b) => b.earned && !before.has(b.id)).map((b) => b.name);
  };

  const exitMission = () => {
    setMission(null);
    worldRef.current?.resetMissionVisuals();
  };

  const pickMood = (m: Mood) => {
    updateStudent((p) => ({ ...p, emotionalStatus: m }));
    setPhase('play');
    if (m === 'inquieto') setBreath(10);
    if (m === 'ayuda') setSqLine('Le avisé a tu maestro.');
  };

  // --- Render --------------------------------------------------------------
  const nearMission = near ? missionById(near) : null;
  const nearLocked = !!(near && student && !isUnlocked(near, student.completedMissions));
  const MoodIcon = MOODS.find((m) => m.id === student?.emotionalStatus)?.Icon ?? Sun;
  const Avatar = student ? AVATARS[student.avatarIcon] : null;
  const exploring = phase === 'play' && !!student && view === 'student' && !mission && !resting;
  const chispaSays = sqLine ?? objective?.squirrelCall ?? '¡Salvamos el valle!';

  return (
    <div className={`fixed inset-0 overflow-hidden select-none bg-sky-100 ${calm ? 'calm' : ''}`}>
      <div ref={mountRef} className="absolute inset-0" />

      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-700 font-semibold">
          Este equipo no puede mostrar el mapa 3D. Pide al maestro las fichas impresas de las misiones.
        </div>
      )}

      {/* ===== Globo de Chispa sobre su cabeza en el mapa ===== */}
      {exploring && anchor && !nearMission &&
        createPortal(
          <button
            onClick={() => speakLocalText(chispaSays)}
            className="absolute bottom-2 left-0 -translate-x-1/2 w-max max-w-[260px] rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[0_5px_0_#e6d3ab] px-3 py-2 text-left animate-fadeIn"
            aria-label={`Chispa dice: ${chispaSays}`}
          >
            <span className="absolute left-1/2 -bottom-[9px] -translate-x-1/2 w-4 h-4 bg-white border-r-[3px] border-b-[3px] border-[#f1e4c6] rotate-45" />
            <span className="flex items-start gap-1.5">
              <span className="text-[14px] font-bold text-slate-700 leading-snug">{chispaSays}</span>
              <Volume2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            </span>
          </button>,
          anchor
        )}

      {/* ===== HUD SUPERIOR (elementos flotantes de juego) ===== */}
      {phase === 'play' && student && (
        <header className="fixed z-40 top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
          <button onClick={() => { setMission(null); setPhase('profile'); }} className="pointer-events-auto flex items-center gap-2 group" title="Cambiar de explorador">
            <span className="w-14 h-14 rounded-full bg-sky-400 border-4 border-white shadow-[0_5px_0_rgba(3,105,161,.35)] flex items-center justify-center text-white">
              {Avatar && <Avatar className="w-7 h-7" />}
            </span>
            <span className="hidden sm:flex flex-col items-start">
              <span className="px-3 py-1 rounded-xl bg-[#fffaf0] border-[3px] border-white shadow-[0_4px_0_rgba(146,112,52,.22)] font-black text-slate-800 max-w-[140px] truncate">{student.name}</span>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black tracking-wide" title={isTauriEnvironment() ? 'Motor nativo Tauri + Rust' : 'Navegador local'}>
                <WifiOff className="w-3 h-3" /> 100% OFFLINE NATIVO
              </span>
            </span>
          </button>

          {/* Energía solar del campamento: 3 soles por día */}
          <div className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#fffaf0] border-[3px] border-white shadow-[0_5px_0_rgba(146,112,52,.22)]" aria-label={`Energía solar: ${suns} de 3`} title="Energía solar del campamento">
            {Array.from({ length: MAX_SUNS }).map((_, i) => (
              <Sun key={i} className={`w-8 h-8 ${i < suns ? 'text-amber-500 fill-amber-300' : 'text-[#e6d3ab]'}`} />
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => setPhase('checkin')} className={roundBtn} title="¿Cómo me siento?" aria-label="Check-in emocional">
              <MoodIcon className="w-6 h-6" />
            </button>
            <button onClick={() => setPassport(true)} className={roundBtn} title="Mi Pasaporte Escolar" aria-label="Mi Pasaporte Escolar">
              <QrCode className="w-6 h-6 text-sky-600" />
            </button>
            <button
              onClick={() => setView(view === 'student' ? 'teacher' : 'student')}
              className={`${roundBtn} ${view === 'teacher' ? '!bg-indigo-500 !text-white' : ''}`}
              title={view === 'student' ? 'Vista Maestro (Centro Docente Offline)' : 'Vista Estudiante (Juego)'}
              aria-label={view === 'student' ? 'Vista Maestro' : 'Vista Estudiante'}
              aria-pressed={view === 'teacher'}
            >
              <GraduationCap className="w-6 h-6" />
            </button>
          </div>
        </header>
      )}

      {/* ===== HUD DE EXPLORACIÓN ===== */}
      {exploring && (
        <>
          {/* Rastreador de estaciones: medallones en vez de texto */}
          <div className="fixed z-10 left-3 bottom-3 flex items-center gap-1.5 px-2.5 py-2 rounded-[22px] bg-[#fffaf0] border-[3px] border-white shadow-[0_5px_0_rgba(146,112,52,.22)]">
            {MISSIONS.map((m, i) => {
              const Icon = STATION_ICONS[m.id];
              const done = student!.completedMissions.includes(m.id);
              const now = objective?.id === m.id;
              return (
                <div key={m.id} className="flex items-center gap-1.5" title={m.stationName}>
                  <span className={`relative w-11 h-11 rounded-2xl flex items-center justify-center ${done ? 'bg-emerald-500 text-white shadow-[0_4px_0_#047857]' : now ? 'bg-sky-500 text-white shadow-[0_4px_0_#0369a1] anim-bob' : 'bg-[#f6ecd6] text-[#c8b48a]'}`}>
                    {done ? <Check className="w-6 h-6" /> : now ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                  </span>
                  {i < MISSIONS.length - 1 && <span className={`w-3 h-1.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-[#eadcbc]'}`} />}
                </div>
              );
            })}
          </div>

          {!nearMission && (
            <div className="hidden lg:flex fixed z-10 right-3 bottom-3 items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#fffaf0]/90 border-[3px] border-white text-xs font-bold text-slate-500">
              <Cap k="W" /><Cap k="A" /><Cap k="S" /><Cap k="D" />
              <span className="mx-1">o</span>
              <MousePointerClick className="w-5 h-5 text-slate-500" />
              <span className="mx-1">mover</span>
              <Cap k="E" /> <span>entrar</span>
            </div>
          )}

          {nearMission && (() => {
            const Icon = STATION_ICONS[nearMission.id];
            return (
              <div className="fixed z-20 left-1/2 -translate-x-1/2 bottom-24 sm:bottom-5 flex items-center gap-3 p-2.5 pr-3 rounded-[24px] bg-[#fffaf0] border-[3px] border-white shadow-[0_6px_0_rgba(146,112,52,.22),0_16px_30px_rgba(80,55,15,.18)] animate-fadeIn">
                <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${nearLocked ? 'bg-slate-100 text-slate-400' : 'bg-sky-100 text-sky-600'}`}>
                  {nearLocked ? <Lock className="w-7 h-7" /> : <Icon className="w-8 h-8" />}
                </span>
                <span className="font-black text-slate-800 text-lg pr-1">{nearMission.stationName}</span>
                {nearLocked ? (
                  <span className="px-3 py-2 rounded-2xl bg-slate-100 text-slate-500 text-sm font-black">Aún no</span>
                ) : (
                  <GlassButton variant="primary" size="lg" onClick={() => tryStart(nearMission.id)}>
                    Entrar <kbd className="hidden sm:inline px-1.5 rounded-md bg-white/25 text-xs">E</kbd>
                  </GlassButton>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* ===== MISIÓN ACTIVA ===== */}
      {mission && student && view === 'student' && (
        <MissionPanel
          key={mission.id}
          mission={mission}
          world={worldRef.current}
          calm={calm}
          sunsLeftAfter={Math.max(0, suns - 1)}
          onExit={exitMission}
          onComplete={completeMission}
          onHintUsed={() => updateStudent((p) => ({ ...p, hintsUsed: p.hintsUsed + 1 }))}
        />
      )}

      {/* ===== CANDADO ANTI-ADICCIÓN: el campamento descansa ===== */}
      {resting && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-sky-50/50 backdrop-blur-md">
          <div className="cozy-panel max-w-md w-full p-6 flex flex-col items-center gap-4 text-center animate-fadeIn">
            <div className="relative">
              <span className="w-28 h-28 rounded-[32px] bg-teal-100 text-teal-600 shadow-[0_6px_0_#5eead4] flex items-center justify-center"><Tent className="w-16 h-16" /></span>
              <span className="absolute -right-6 -bottom-3"><SquirrelArt mood="happy" size={70} /></span>
            </div>
            <span className="cozy-ribbon" aria-label="Descanso y Misión en el Mundo Real">¡A descansar!</span>
            <div className="flex gap-1.5" aria-label="Soles usados">
              {[0, 1, 2].map((i) => <Sun key={i} className="w-8 h-8 text-[#e6d3ab]" />)}
            </div>
            <p className="font-bold text-slate-600">Mañana hay más soles.</p>
            <div className="cozy-tile w-full p-3 text-left">
              <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">Fuera de la pantalla</p>
              <p className="font-bold text-slate-800">Busca 3 cosas seguras y muéstraselas a alguien.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <GlassButton size="lg" onClick={() => setBreath(15)}><Wind className="w-5 h-5" /> Respirar</GlassButton>
              <GlassButton size="lg" onClick={() => setPassport(true)}><QrCode className="w-5 h-5" /> Pasaporte</GlassButton>
            </div>
            <GlassButton variant="ghost" onClick={() => setPhase('profile')}>Otro jugador</GlassButton>
          </div>
        </div>
      )}

      {/* ===== INGRESO ===== */}
      {phase === 'profile' && store && (
        <ProfileScreen
          profiles={store.profiles}
          onSelect={(id) => {
            commit({ ...store, activeId: id, profiles: store.profiles.map((p) => (p.id === id ? normalizeProfile(p) : p)) });
            setPhase('checkin');
          }}
          onCreate={(name, avatar) => {
            const p = createProfile(name, avatar);
            commit({ ...store, activeId: p.id, profiles: [...store.profiles, p] });
            setPhase('checkin');
          }}
        />
      )}
      {phase === 'checkin' && student && <CheckInModal name={student.name} onPick={pickMood} />}

      {student && <PassportModal isOpen={passport} onClose={() => setPassport(false)} student={student} />}
      <BreathingModal
        isOpen={breath !== null}
        durationSeconds={breath ?? 10}
        onClose={() => {
          setBreath(null);
          updateStudent((p) => ({ ...p, talentScores: { ...p.talentScores, emergencyCalm: clamp100(p.talentScores.emergencyCalm + 2) } }));
        }}
      />

      {view === 'teacher' && (
        <TeacherView currentStudent={student} onBackToGame={() => setView('student')} onResetSuns={() => updateStudent((p) => ({ ...p, currentSunEnergy: MAX_SUNS }))} />
      )}
    </div>
  );
};
