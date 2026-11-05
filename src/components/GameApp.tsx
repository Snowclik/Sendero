import type { FunctionalComponent } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useErrorBoundary, useRef, useState } from 'preact/hooks';
import { Award, Check, Lock, MousePointerClick, RotateCcw, Shirt, Sun, Tent, Trophy, Volume2, WifiOff, Wind } from 'lucide-preact';
import { IsoWorld, type StationState } from '../game/IsoWorld';
import { MissionPanel, STATION_ICONS, type MissionResult } from './MissionPanel';
import { AchievementsModal } from './AchievementsModal';
import { Wardrobe } from './Wardrobe';
import { MainMenu, type MenuItem } from './MainMenu';
import { BreathingModal } from './ui/BreathingModal';
import { GlassButton } from './ui/GlassButton';
import { SquirrelArt } from './ui/Art';
import { AVATARS, ProfileScreen } from './Onboarding';
import { MISSIONS, isUnlocked, missionById, nextMission, type Mission, type MissionId, type SkillId } from '../data/missionsData';
import { ACHIEVEMENTS } from '../data/achievements';
import { LINES } from '../data/lines';
import { fill, speechParts, type Params } from '../game/problems';
import {
  MAX_SUNS, createProfile, isTauriEnvironment, loadStore, normalizeProfile, recordSkill, saveStore,
  type SaveStore, type StudentProfile,
} from '../services/storageService';
import { onListen, playClickSound, playSuccessSound, say, sayText, sayTpl, stopSpeaking } from '../services/soundService';

const NAMES = Object.fromEntries(MISSIONS.map((m) => [m.id, m.stationName])) as Record<MissionId, string>;
const roundBtn = 'w-12 h-12 rounded-2xl bg-[#fffaf0] border-[3px] border-white shadow-[0_5px_0_rgba(146,112,52,.22)] flex items-center justify-center text-slate-700 active:translate-y-[3px] active:shadow-[0_2px_0_rgba(146,112,52,.22)] transition-all';
const Cap = ({ k }: { k: string }) => (
  <kbd className="min-w-[26px] h-[26px] px-1 rounded-lg bg-white border-2 border-[#f1e4c6] shadow-[0_3px_0_#e6d3ab] flex items-center justify-center text-xs font-black text-slate-600">{k}</kbd>
);
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Logros ganados que el niño todavía no vio anunciados. */
const unseen = (p: StudentProfile) => ACHIEVEMENTS.filter((a) => a.earned(p) && !p.achievementsSeen.includes(a.id));

type Phase = 'menu' | 'profile' | 'play' | 'wardrobe';

const Game: FunctionalComponent = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<IsoWorld | null>(null);
  const interactRef = useRef<(id: MissionId) => void>(() => {});
  const loadedRef = useRef(false);

  const [store, setStore] = useState<SaveStore | null>(null);
  const [phase, setPhase] = useState<Phase>('menu');
  const [afterProfile, setAfterProfile] = useState<Phase>('play'); // a dónde ir después de elegir jugador
  const [near, setNear] = useState<MissionId | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [sqLine, setSqLine] = useState<{ tpl: string; params: Params } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const [logros, setLogros] = useState(false);
  const [breath, setBreath] = useState<number | null>(null);
  const [webglError, setWebglError] = useState(false);

  const student = store?.profiles.find((p) => p.id === store.activeId) ?? null;
  const suns = student?.currentSunEnergy ?? MAX_SUNS;
  const calm = reducedMotion();
  const objective = student ? nextMission(student.completedMissions) : null;
  const resting = phase === 'play' && !mission && suns === 0;

  // --- Persistencia: un solo lugar guarda; los cambios se aplican sobre el estado más reciente ---
  useEffect(() => {
    loadStore().then((s) => {
      setStore(s);
      loadedRef.current = true;
    });
  }, []);
  useEffect(() => {
    if (store && loadedRef.current) saveStore(store);
  }, [store]);

  const updateStudent = (fn: (p: StudentProfile) => StudentProfile) =>
    setStore((prev) =>
      prev?.activeId
        ? { ...prev, profiles: prev.profiles.map((p) => (p.id === prev.activeId ? { ...fn(p), lastActiveAt: new Date().toISOString() } : p)) }
        : prev
    );
  const bump = (k: keyof StudentProfile['stats'], n = 1) => updateStudent((p) => ({ ...p, stats: { ...p.stats, [k]: p.stats[k] + n } }));

  // --- Motor 3D ------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    try {
      const w = new IsoWorld(mountRef.current, { onNear: setNear, onInteract: (id) => interactRef.current(id) });
      worldRef.current = w;
      if (import.meta.env.DEV) (window as any).__world = w; // depuración
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

  const outfitKey = JSON.stringify(student?.outfit ?? null);
  useEffect(() => {
    if (student) worldRef.current?.setOutfit(student.outfit);
  }, [outfitKey]);

  const inputOn = phase === 'play' && !mission && !logros && breath === null && !resting;
  useEffect(() => worldRef.current?.setInputEnabled(inputOn), [inputOn]);
  useEffect(() => worldRef.current?.setCalm(calm), [calm]);
  useEffect(() => worldRef.current?.focusStation(mission?.id ?? null), [mission]);
  useEffect(() => {
    if (!sqLine) return;
    const t = setTimeout(() => setSqLine(null), 5000);
    return () => clearTimeout(t);
  }, [sqLine]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Estadísticas para logros escondidos
  useEffect(() => {
    const t = setInterval(() => {
      const m = worldRef.current?.takeWalkedMeters() ?? 0;
      if (m >= 1) bump('meters', Math.round(m));
    }, 4000);
    onListen(() => bump('listens'));
    return () => clearInterval(t);
  }, []);

  // Anunciar logros nuevos (la pantalla final de un nivel ya los muestra)
  useEffect(() => {
    if (!student || mission) return;
    const fresh = unseen(student);
    if (!fresh.length) return;
    playSuccessSound();
    setToast(fresh[0].name);
    sayTpl(LINES.achievement, { name: fresh[0].name });
    updateStudent((p) => ({ ...p, achievementsSeen: [...p.achievementsSeen, ...fresh.map((a) => a.id)] }));
  }, [student, mission]);

  const chispaLine = sqLine ?? { tpl: objective?.squirrelCall ?? LINES.allDone, params: {} };
  const exploring = phase === 'play' && !!student && !mission && !resting;
  useEffect(() => {
    if (exploring && !sqLine) sayText(chispaLine.tpl);
  }, [exploring, objective?.id]);
  useEffect(() => {
    if (resting) sayText(LINES.rest);
  }, [resting]);

  // --- Entrar a un nivel -------------------------------------------------
  const tryStart = (id: MissionId) => {
    if (!student || !inputOn) return;
    if (!isUnlocked(id, student.completedMissions)) {
      const prev = MISSIONS[MISSIONS.findIndex((x) => x.id === id) - 1];
      const line = { tpl: LINES.locked, params: { station: prev.stationName } };
      setSqLine(line);
      say(speechParts(line.tpl, line.params));
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
      if (import.meta.env.DEV && e.shiftKey && e.key === 'S') updateStudent((p) => ({ ...p, currentSunEnergy: MAX_SUNS })); // solo desarrollo
      if (phase !== 'play') return;
      if (tag === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
      if (near && ['e', 'E', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        tryStart(near);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Resultado de nivel ------------------------------------------------
  const completeMission = (r: MissionResult): string[] => {
    if (!student || !mission) return [];
    const replay = student.completedMissions.includes(mission.id);
    const next: StudentProfile = {
      ...student,
      completedMissions: replay ? student.completedMissions : [...student.completedMissions, mission.id],
      currentSunEnergy: Math.max(0, student.currentSunEnergy - 1),
      duoModeCompleted: student.duoModeCompleted || r.duo,
      resilienceEarned: student.resilienceEarned || r.mistakes > 0,
      stats: {
        ...student.stats,
        replays: student.stats.replays + (replay ? 1 : 0),
        missionsNoHint: student.stats.missionsNoHint + (r.hints === 0 ? 1 : 0),
        missionsPerfect: student.stats.missionsPerfect + (r.mistakes === 0 ? 1 : 0),
      },
    };
    const fresh = unseen(next);
    next.achievementsSeen = [...next.achievementsSeen, ...fresh.map((a) => a.id)];
    updateStudent((p) => ({ ...next, skills: p.skills, stats: { ...next.stats, chispaTaps: p.stats.chispaTaps, listens: p.stats.listens, meters: p.stats.meters } }));
    return fresh.map((a) => a.name);
  };

  const exitMission = () => {
    setMission(null);
    worldRef.current?.resetMissionVisuals();
  };

  // --- Menú principal ------------------------------------------------------
  const go = (target: Phase) => {
    stopSpeaking();
    if (student) setPhase(target);
    else {
      setAfterProfile(target);
      setPhase('profile');
    }
  };
  const menuItems: MenuItem[] = [
    { id: 'jugar', label: '¡A jugar!', action: () => go('play') },
    { id: 'vestuario', label: 'Vestuario', action: () => go('wardrobe') },
    { id: 'logros', label: 'Mis logros', action: () => (student ? setLogros(true) : go('play')) },
    { id: 'jugador', label: student ? 'Cambiar jugador' : 'Elegir jugador', action: () => { setAfterProfile('menu'); setPhase('profile'); } },
    ...(isTauriEnvironment() ? [{ id: 'salir', label: 'Salir', action: () => (window as any).__TAURI__?.core.invoke('exit_app') }] : []),
  ];

  // --- Render --------------------------------------------------------------
  const nearMission = near ? missionById(near) : null;
  const nearLocked = !!(near && student && !isUnlocked(near, student.completedMissions));
  const Avatar = student ? AVATARS[student.avatarIcon] : null;
  const chispaText = fill(chispaLine.tpl, chispaLine.params);
  const achieved = new Set(student ? ACHIEVEMENTS.filter((a) => a.earned(student)).map((a) => a.id) : []);

  return (
    <div className={`fixed inset-0 overflow-hidden select-none bg-sky-100 ${calm ? 'calm' : ''}`}>
      <div ref={mountRef} className="absolute inset-0" />

      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-700 font-semibold">
          Este equipo no puede mostrar el mapa 3D.
        </div>
      )}

      {/* Globo de Chispa sobre su cabeza en el mapa: deja pasar los clics; solo el altavoz es tocable */}
      {exploring && anchor && !nearMission &&
        createPortal(
          <div className="absolute bottom-2 left-0 -translate-x-1/2 w-max max-w-[260px] rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[0_5px_0_#e6d3ab] pl-3 pr-1.5 py-1.5 text-left animate-fadeIn pointer-events-none">
            <span className="absolute left-1/2 -bottom-[9px] -translate-x-1/2 w-4 h-4 bg-white border-r-[3px] border-b-[3px] border-[#f1e4c6] rotate-45" />
            <span className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-slate-700 leading-snug">{chispaText}</span>
              <button
                onClick={() => { bump('chispaTaps'); say(speechParts(chispaLine.tpl, chispaLine.params), { user: true }); }}
                className="pointer-events-auto shrink-0 w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center"
                aria-label={`Escuchar a Chispa: ${chispaText}`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </span>
          </div>,
          anchor
        )}

      {/* HUD superior */}
      {phase === 'play' && student && (
        <header className="fixed z-40 top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
          <button onClick={() => { setMission(null); setPhase('menu'); }} className="pointer-events-auto flex items-center gap-2" title="Volver al inicio">
            <span className="w-14 h-14 rounded-full bg-sky-400 border-4 border-white shadow-[0_5px_0_rgba(3,105,161,.35)] flex items-center justify-center text-white">
              {Avatar && <Avatar className="w-7 h-7" />}
            </span>
            <span className="hidden sm:flex flex-col items-start">
              <span className="px-3 py-1 rounded-xl bg-[#fffaf0] border-[3px] border-white shadow-[0_4px_0_rgba(146,112,52,.22)] font-black text-slate-800 max-w-[140px] truncate">{student.name}</span>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black tracking-wide" title={isTauriEnvironment() ? 'Motor nativo Tauri + Rust' : 'Navegador local'}>
                <WifiOff className="w-3 h-3" /> 100% OFFLINE
              </span>
            </span>
          </button>

          <div className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#fffaf0] border-[3px] border-white shadow-[0_5px_0_rgba(146,112,52,.22)]" aria-label={`Energía solar: ${suns} de 3`} title="Energía solar del campamento">
            {Array.from({ length: MAX_SUNS }).map((_, i) => (
              <Sun key={i} className={`w-8 h-8 ${i < suns ? 'text-amber-500 fill-amber-300' : 'text-[#e6d3ab]'}`} />
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => { setMission(null); setPhase('wardrobe'); }} className={roundBtn} title="Vestuario" aria-label="Vestuario">
              <Shirt className="w-6 h-6 text-rose-500" />
            </button>
            <button onClick={() => setLogros(true)} className={roundBtn} title="Mis logros" aria-label="Mis logros">
              <Trophy className="w-6 h-6 text-amber-500" />
            </button>
          </div>
        </header>
      )}

      {toast && (
        <div role="status" className="fixed z-[60] top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-amber-300 text-amber-950 shadow-[0_6px_0_#d97706] anim-hop">
          <span className="w-11 h-11 rounded-full bg-white/60 flex items-center justify-center"><Award className="w-6 h-6" /></span>
          <span className="font-black">¡Logro nuevo! {toast}</span>
        </div>
      )}

      {/* HUD de exploración */}
      {exploring && (
        <>
          <div className="fixed z-10 left-3 bottom-3 flex items-center gap-1.5 px-2.5 py-2 rounded-[22px] bg-[#fffaf0] border-[3px] border-white shadow-[0_5px_0_rgba(146,112,52,.22)]">
            {MISSIONS.map((m, i) => {
              const Icon = STATION_ICONS[m.id];
              const done = student!.completedMissions.includes(m.id);
              const now = objective?.id === m.id;
              return (
                <div key={m.id} className="flex items-center gap-1.5" title={m.disaster}>
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
                <span className="flex flex-col pr-1">
                  <span className="text-xs font-black text-slate-500">{nearMission.disaster}</span>
                  <span className="font-black text-slate-800 text-lg leading-tight">{nearMission.stationName}</span>
                </span>
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

      {/* Nivel activo */}
      {mission && student && phase === 'play' && (
        <MissionPanel
          key={mission.id}
          mission={mission}
          world={worldRef.current}
          calm={calm}
          sunsLeftAfter={Math.max(0, suns - 1)}
          onExit={exitMission}
          onComplete={completeMission}
          onHintUsed={() => updateStudent((p) => ({ ...p, hintsUsed: p.hintsUsed + 1 }))}
          onSkill={(skills: SkillId[], ok, firstTry) => updateStudent((p) => recordSkill(p, skills, ok, firstTry))}
          onChispaTap={() => bump('chispaTaps')}
          onBreath={() => bump('breaths')}
        />
      )}

      {/* Candado anti-adicción: el campamento descansa */}
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
              <p className="font-bold text-slate-800">Cuéntale a tu familia qué aprendiste hoy.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <GlassButton size="lg" onClick={() => setBreath(15)}><Wind className="w-5 h-5" /> Respirar</GlassButton>
              <GlassButton size="lg" onClick={() => setPhase('wardrobe')}><Shirt className="w-5 h-5" /> Vestuario</GlassButton>
            </div>
            <GlassButton variant="ghost" onClick={() => setPhase('menu')}>Inicio</GlassButton>
          </div>
        </div>
      )}

      {/* Pantallas de inicio */}
      {phase === 'menu' && store && <MainMenu items={menuItems} player={student?.name} />}
      {phase === 'profile' && store && (
        <ProfileScreen
          profiles={store.profiles}
          onSelect={(id) => {
            setStore({ ...store, activeId: id, profiles: store.profiles.map((p) => (p.id === id ? normalizeProfile(p) : p)) });
            setPhase(afterProfile);
          }}
          onCreate={(name, avatar) => {
            const p = createProfile(name, avatar);
            setStore({ ...store, activeId: p.id, profiles: [...store.profiles, p] });
            setPhase(afterProfile);
          }}
        />
      )}
      {phase === 'wardrobe' && student && (
        <Wardrobe
          outfit={student.outfit}
          isUnlocked={(id) => achieved.has(id)}
          onSave={(o) => updateStudent((p) => ({ ...p, outfit: o, stats: { ...p.stats, outfits: p.stats.outfits + 1 } }))}
          onClose={() => setPhase('menu')}
        />
      )}

      {student && <AchievementsModal isOpen={logros} onClose={() => setLogros(false)} student={student} />}
      <BreathingModal
        isOpen={breath !== null}
        durationSeconds={breath ?? 10}
        onClose={() => {
          setBreath(null);
          bump('breaths');
        }}
      />
    </div>
  );
};

/** Si algo falla, el niño ve a Chispa y un botón para seguir (no una pantalla en blanco). */
export const GameApp: FunctionalComponent = () => {
  const [error, reset] = useErrorBoundary((e) => console.error('Error en Sendero:', e));
  const [key, setKey] = useState(0);
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 bg-sky-100">
        <div className="cozy-panel max-w-md w-full p-6 flex flex-col items-center gap-3 text-center">
          <SquirrelArt mood="thinking" size={90} />
          <span className="cozy-ribbon">¡Ups! Algo se trabó</span>
          <GlassButton size="xl" variant="primary" onClick={() => { reset(); setKey((k) => k + 1); }}>
            <RotateCcw className="w-5 h-5" /> Reintentar
          </GlassButton>
          <p className="text-[11px] font-mono text-slate-400 break-all">{String((error as Error)?.message ?? error)}</p>
        </div>
      </div>
    );
  }
  return <Game key={key} />;
};
