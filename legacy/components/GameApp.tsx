import type { FunctionalComponent } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import {
  WorldScene3D,
  type CameraMode,
  type SquirrelDialog,
} from '../three/WorldScene3D';
import {
  type CharacterOutfit,
  DEFAULT_OUTFIT,
} from '../three/ExplorerCharacter3D';
import { WardrobeOverlay } from './WardrobeOverlay';
import { MissionRunner } from './MissionRunner';
import { TeacherView } from './TeacherView';
import { PassportModal } from './PassportModal';
import { BreathingModal } from './ui/BreathingModal';
import {
  loadStudentProgress,
  saveStudentProgress,
  type StudentProfile,
  DEFAULT_STUDENT,
} from '../services/storageService';
import { MISSIONS, type Mission } from '../data/missionsData';
import {
  playClickSound,
  playSuccessSound,
  speakLocalText,
} from '../services/soundService';

export const GameApp: FunctionalComponent = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<WorldScene3D | null>(null);
  const hydratedRef = useRef(false);

  const [student, setStudent] = useState<StudentProfile>(DEFAULT_STUDENT);
  const [outfit, setOutfit] = useState<CharacterOutfit>(DEFAULT_OUTFIT);
  const [cameraMode, setCameraMode] = useState<CameraMode>('explore');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [gemsCount, setGemsCount] = useState(0);
  const [squirrelDialog, setSquirrelDialog] = useState<SquirrelDialog | null>({
    title: '¡Hola! Soy Chispa la Ardilla',
    text: 'Camina conmigo por el sendero del bosque. ¡Recoge las 3 gemas doradas con WASD o el Ratón!',
    stepNumber: 1,
    totalSteps: 3,
    completed: false,
  });
  const [squirrelScreenPos, setSquirrelScreenPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Modal de Menú estilo Tarjetas (Idéntico a la Imagen 2)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [walkedKm, setWalkedKm] = useState('0.0');

  // Modales adicionales
  const [viewMode, setViewMode] = useState<'game' | 'teacher'>('game');
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);

  // 1. Cargar progreso del estudiante
  useEffect(() => {
    let isMounted = true;
    loadStudentProgress()
      .then((loaded) => {
        if (isMounted) {
          setStudent(loaded);
          setGemsCount(loaded.totalStars * 2 + 1);
        }
      })
      .finally(() => {
        hydratedRef.current = true;
      });

    try {
      const savedOutfit = localStorage.getItem('valle_resiliente_outfit_v3');
      if (savedOutfit) {
        setOutfit(JSON.parse(savedOutfit));
      }
    } catch {}

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Inicializar motor 3D
  useEffect(() => {
    if (!mountRef.current) return;

    let world: WorldScene3D | null = null;
    try {
      world = new WorldScene3D(
        mountRef.current,
        outfit,
        (count) => {
          setGemsCount(count);
          playSuccessSound();
        },
        (dialog) => {
          setSquirrelDialog(dialog);
        },
        (nearStationId) => {
          if (nearStationId) {
            const found = MISSIONS.find((m) => m.id === nearStationId);
            if (found && !selectedMission) {
              // Activar reto de la fuente / estación
            }
          }
        },
        (screenPos) => {
          setSquirrelScreenPos(screenPos);
        }
      );
      worldRef.current = world;
    } catch (err) {
      console.error('Error al iniciar WebGL 3D:', err);
    }

    return () => {
      if (world) world.dispose();
      worldRef.current = null;
    };
  }, []);

  // Actualizar distancia recorrida para el encabezado del menú
  useEffect(() => {
    const timer = setInterval(() => {
      if (worldRef.current) {
        setWalkedKm(worldRef.current.getWalkedDistanceKm());
      }
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // Atajos de teclado para PC (M / Tab = Menú, E = Hablar, Espacio = Saltar)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || viewMode === 'teacher') return;

      if (e.key === 'Tab' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        playClickSound();
        setIsMenuOpen((p) => !p);
      }
      if (e.key.toLowerCase() === 'e') {
        const m1 = MISSIONS[0];
        if (m1 && !selectedMission) {
          playClickSound();
          setSelectedMission(m1);
        }
      }
      if (e.key === 'Escape') {
        if (selectedMission) setSelectedMission(null);
        else if (isMenuOpen) setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode, selectedMission, isMenuOpen]);

  const handleUpdateOutfit = (newOutfit: CharacterOutfit) => {
    setOutfit(newOutfit);
    worldRef.current?.explorer.applyOutfit(newOutfit);
    try {
      localStorage.setItem('valle_resiliente_outfit_v3', JSON.stringify(newOutfit));
    } catch {}
  };

  const updateStudent = (updated: StudentProfile) => {
    setStudent(updated);
    if (hydratedRef.current) {
      saveStudentProgress(updated);
    }
  };

  const handleCompleteMission = (missionId: string, isDuo: boolean) => {
    const isFirst = !student.completedMissions.includes(missionId);
    const completed = isFirst
      ? [...student.completedMissions, missionId]
      : student.completedMissions;
    const newEnergy = Math.max(0, student.currentSunEnergy - 1);

    const updated: StudentProfile = {
      ...student,
      completedMissions: completed,
      currentSunEnergy: newEnergy,
      totalStars: student.totalStars + 1,
      duoModeCompleted: student.duoModeCompleted || isDuo,
      talentScores: {
        perseverance: Math.min(100, student.talentScores.perseverance + 6),
        criticalThinking: Math.min(100, student.talentScores.criticalThinking + 8),
        collaboration: Math.min(100, student.talentScores.collaboration + (isDuo ? 12 : 5)),
        emergencyCalm: Math.min(100, student.talentScores.emergencyCalm + 6),
        mathProblemSolving: Math.min(100, student.talentScores.mathProblemSolving + 8),
        readingComprehension: Math.min(100, student.talentScores.readingComprehension + 8),
      },
    };
    updateStudent(updated);
    playSuccessSound();
    worldRef.current?.squirrel.triggerCheer();

    if (newEnergy === 0) {
      setTimeout(() => setIsRestModalOpen(true), 1200);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans">
      {/* ========================================================= */}
      {/* 1. LIENZO 3D THREE.JS A PANTALLA COMPLETA                */}
      {/* ========================================================= */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full z-0" />

      {/* ========================================================= */}
      {/* 2. BANNER SUPERIOR CON DIAMANTE (IDÉNTICO A LA IMAGEN 1)  */}
      {/* ========================================================= */}
      <div className="fixed top-7 inset-x-0 z-10 flex flex-col items-center pointer-events-none px-4">
        <div className="flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          {/* Diamante verde/amarillo brillante */}
          <div className="w-5 h-5 bg-[#c6ff00] rotate-45 border-2 border-white shadow-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-[#76ff03]" />
          </div>
          <h1
            className="text-white text-xl sm:text-2xl font-bold italic tracking-wide"
            style={{ fontFamily: "'Brush Script MT', 'Caveat', cursive, sans-serif" }}
          >
            Explora y recolecta gemas
          </h1>
        </div>
        <p className="text-white/95 text-[11px] sm:text-xs font-black tracking-[0.18em] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)] mt-0.5">
          Para desbloquear nuevos atuendos y estaciones del bosque
        </p>
      </div>

      {/* ========================================================= */}
      {/* 3. DIÁLOGO 3D ANCLADO DIRECTAMENTE SOBRE CHISPA LA ARDILLA */}
      {/* ========================================================= */}
      {squirrelDialog && !selectedMission && !isMenuOpen && (
        <div
          style={
            squirrelScreenPos.visible
              ? {
                  position: 'fixed',
                  left: `${Math.round(squirrelScreenPos.x)}px`,
                  top: `${Math.round(squirrelScreenPos.y - 12)}px`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 30,
                  maxWidth: '330px',
                  width: 'max-content',
                  pointerEvents: 'auto',
                }
              : {
                  position: 'fixed',
                  bottom: '96px',
                  left: '24px',
                  zIndex: 30,
                  maxWidth: '330px',
                  pointerEvents: 'auto',
                }
          }
          className="transition-all duration-75 ease-out animate-fadeIn"
        >
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border-2 border-[#b45309] flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-1.5">
              <span className="text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#ea580c] text-white">
                Chispa la Ardilla
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                Paso {squirrelDialog.stepNumber} de {squirrelDialog.totalSteps}
              </span>
            </div>

            <p className="text-xs sm:text-[13px] font-bold text-stone-800 leading-snug">
              {squirrelDialog.text}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => speakLocalText(squirrelDialog.text)}
                className="text-[11px] font-extrabold text-[#c2410c] bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition flex items-center gap-1"
              >
                Escuchar voz
              </button>
              {squirrelDialog.completed && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedMission(MISSIONS[0]);
                  }}
                  className="text-[11px] font-black text-white bg-[#65a30d] hover:bg-[#4d7c0f] px-3 py-1 rounded-lg shadow transition"
                >
                  ¡Activar Fuente!
                </button>
              )}
            </div>

            {/* Cola del bocadillo de cómic apuntando exactamente a la ardilla 3D */}
            {squirrelScreenPos.visible && (
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-[#b45309] rotate-45"
                style={{ zIndex: 1 }}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. BARRA DE ACCESO RÁPIDO Y BOTÓN DEL MENÚ PRINCIPAL      */}
      {/* ========================================================= */}
      <div className="fixed top-6 right-6 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setIsMenuOpen(true);
          }}
          className="flex items-center gap-2 bg-white/95 hover:bg-white text-[#1f2937] px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 font-extrabold text-xs transition-transform active:scale-95"
        >
          <span className="text-sm">☰</span>
          <span>Menú</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-bold">
            [Tab]
          </span>
        </button>
      </div>

      {/* Indicadores en esquina inferior izquierda */}
      <div className="fixed bottom-6 left-6 z-10 pointer-events-none flex items-center gap-3">
        <div className="bg-[#1f2937]/85 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border border-white/20 shadow-lg">
          <span className="text-amber-400">💎</span>
          <span>{gemsCount} Gemas</span>
        </div>
        <div className="bg-[#1f2937]/85 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border border-white/20 shadow-lg">
          <span className="text-emerald-400">🐾</span>
          <span>WASD / Ratón para mover</span>
          <span className="text-white/40">|</span>
          <span className="text-amber-300">Espacio</span>
          <span>Saltar</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MODAL DE MENÚ PRINCIPAL (IDÉNTICO A LA IMAGEN 2)       */}
      {/* ========================================================= */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Cabecera del Menú (Imagen 2: "menú" + gemas + trofeos + kilómetros + [X]) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-black text-[#111827] lowercase tracking-tight">
                menú
              </h2>
              <div className="flex items-center gap-4 text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-1">
                  <span>💎</span>
                  <span>{gemsCount}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>🏆</span>
                  <span>{student.totalStars}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span>🗺️</span>
                  <span>{walkedKm} kilómetros</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm ml-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Fila de Botones Redondeados de Acción Rápida (Imagen 2) */}
            <div className="grid grid-cols-6 gap-2 my-4">
              {[
                { label: 'Cambiar zona', icon: '📍', act: () => {} },
                {
                  label: 'Tiempo',
                  icon: '☀️',
                  act: () => setNightMode((p) => !p),
                },
                {
                  label: 'FOTO',
                  icon: '📷',
                  act: () => {
                    playSuccessSound();
                    alert('¡Foto del bosque capturada!');
                  },
                },
                {
                  label: soundEnabled ? 'Sonido' : 'Silencio',
                  icon: soundEnabled ? '🔊' : '🔇',
                  act: () => setSoundEnabled((p) => !p),
                },
                {
                  label: 'Controles',
                  icon: '🎮',
                  act: () => alert('Usa WASD o el ratón para caminar, y Espacio para saltar.'),
                },
                {
                  label: 'Maestro',
                  icon: '⚙️',
                  act: () => {
                    setIsMenuOpen(false);
                    setViewMode('teacher');
                  },
                },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    b.act();
                  }}
                  className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl flex flex-col items-center gap-1 border border-slate-100 transition"
                >
                  <span className="text-base">{b.icon}</span>
                  <span className="text-[10px] font-black text-slate-700 leading-tight">
                    {b.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Banner Destacado / Evento Especial (Imagen 2: Víspera con switch) */}
            <div className="rounded-2xl p-4 bg-gradient-to-r from-[#2e1065] via-[#581c87] to-[#831843] text-white flex items-center justify-between shadow-md mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎃</span>
                <div>
                  <h4 className="font-black text-sm text-amber-200">
                    Aventura del Bosque Encantado
                  </h4>
                  <p className="text-[11px] font-bold text-white/80">
                    Activa luciérnagas nocturnas, hojas mágicas y niebla misteriosa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNightMode(!nightMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  nightMode ? 'bg-amber-400' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    nightMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cuadrícula de Tarjetas con Miniaturas (Imagen 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Tarjeta 1: Cochera / Vestuario */}
              <div
                onClick={() => {
                  playClickSound();
                  setIsMenuOpen(false);
                  worldRef.current?.setCameraMode('wardrobe');
                  setCameraMode('wardrobe');
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-2xl border border-slate-200 cursor-pointer flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="h-20 bg-gradient-to-b from-sky-100 to-white rounded-xl flex items-center justify-center text-3xl mb-2">
                  🦺
                </div>
                <div>
                  <h5 className="font-black text-xs text-[#111827]">vestuario 3D</h5>
                  <p className="text-[10px] font-bold text-slate-500">ropa y equipo</p>
                </div>
              </div>

              {/* Tarjeta 2: Misiones del Sendero */}
              <div
                onClick={() => {
                  playClickSound();
                  setIsMenuOpen(false);
                  setSelectedMission(MISSIONS[0]);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-2xl border border-slate-200 cursor-pointer flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="h-20 bg-gradient-to-b from-emerald-100 to-white rounded-xl flex items-center justify-center text-3xl mb-2">
                  🎯
                </div>
                <div>
                  <h5 className="font-black text-xs text-[#111827]">Misiones</h5>
                  <p className="text-[10px] font-bold text-slate-500">estaciones del bosque</p>
                </div>
              </div>

              {/* Tarjeta 3: Pasaporte QR */}
              <div
                onClick={() => {
                  playClickSound();
                  setIsMenuOpen(false);
                  setIsPassportOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-2xl border border-slate-200 cursor-pointer flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="h-20 bg-gradient-to-b from-indigo-100 to-white rounded-xl flex items-center justify-center text-3xl mb-2">
                  🗺️
                </div>
                <div>
                  <h5 className="font-black text-xs text-[#111827]">pasaporte</h5>
                  <p className="text-[10px] font-bold text-slate-500">1 ruta · 4 estaciones</p>
                </div>
              </div>

              {/* Tarjeta 4: Pausa de Calma */}
              <div
                onClick={() => {
                  playClickSound();
                  setIsMenuOpen(false);
                  setIsBreathingOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-2xl border border-slate-200 cursor-pointer flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="h-20 bg-gradient-to-b from-amber-100 to-white rounded-xl flex items-center justify-center text-3xl mb-2">
                  🫧
                </div>
                <div>
                  <h5 className="font-black text-xs text-[#111827]">pausa de calma</h5>
                  <p className="text-[10px] font-bold text-slate-500">respiración 15s</p>
                </div>
              </div>

              {/* Tarjeta 5: Logros */}
              <div
                onClick={() => {
                  playClickSound();
                  alert(`Has superado ${student.completedMissions.length} de 4 estaciones en el sendero.`);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-2xl border border-slate-200 cursor-pointer flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="h-20 bg-gradient-to-b from-yellow-100 to-white rounded-xl flex items-center justify-center text-3xl mb-2">
                  🏆
                </div>
                <div>
                  <h5 className="font-black text-xs text-[#111827]">Logros</h5>
                  <p className="text-[10px] font-bold text-slate-500">
                    {student.completedMissions.length} / 4 desbloqueados
                  </p>
                </div>
              </div>

              {/* Tarjeta 6: Aula del Maestro */}
              <div
                onClick={() => {
                  playClickSound();
                  setIsMenuOpen(false);
                  setViewMode('teacher');
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-2xl border border-slate-200 cursor-pointer flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="h-20 bg-gradient-to-b from-rose-100 to-white rounded-xl flex items-center justify-center text-3xl mb-2">
                  📋
                </div>
                <div>
                  <h5 className="font-black text-xs text-[#111827]">modo maestro</h5>
                  <p className="text-[10px] font-bold text-slate-500">semáforo y fichas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. VESTUARIO 3D INTERACTIVO                               */}
      {/* ========================================================= */}
      {cameraMode === 'wardrobe' && (
        <WardrobeOverlay
          outfit={outfit}
          onChangeOutfit={handleUpdateOutfit}
          onRotateCharacter={(delta) => worldRef.current?.rotateWardrobeCharacter(delta)}
          onJumpCharacter={() => {
            worldRef.current?.explorer.triggerCelebration();
            worldRef.current?.squirrel.triggerCheer();
          }}
          onClose={() => {
            worldRef.current?.setCameraMode('explore');
            setCameraMode('explore');
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 7. DESAFÍO ACTIVO (NIVEL 1 EN LA FUENTE, ETC.)            */}
      {/* ========================================================= */}
      {selectedMission && (
        <MissionRunner
          mission={selectedMission}
          worldRef={worldRef.current}
          onExit={() => {
            setSelectedMission(null);
            worldRef.current?.setCameraMode('explore');
            setCameraMode('explore');
          }}
          onCompleteMission={handleCompleteMission}
        />
      )}

      {/* Modales de apoyo */}
      <PassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        student={student}
      />

      <BreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
        durationSeconds={12}
      />

      {isRestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
            <h3 className="text-xl font-black text-amber-600 mb-2">
              ¡3 Retos Completados!
            </h3>
            <p className="text-xs font-bold text-slate-600 mb-4 leading-relaxed">
              Gran trabajo en el sendero del bosque. Es buen momento para descansar la vista y compartir lo aprendido.
            </p>
            <button
              type="button"
              onClick={() => setIsRestModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {viewMode === 'teacher' && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <TeacherView
            currentStudent={student}
            onBackToGame={() => {
              playClickSound();
              setViewMode('game');
            }}
          />
        </div>
      )}
    </div>
  );
};
