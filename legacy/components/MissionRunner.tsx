import type { FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { TutorModal } from './TutorModal';
import { BreathingModal } from './ui/BreathingModal';
import type { Mission } from '../data/missionsData';
import type { WorldScene3D } from '../three/WorldScene3D';
import {
  ArrowLeft,
  Volume2,
  Compass,
  Check,
  Search,
  Users,
  ShieldCheck,
  Award,
  ArrowUp,
  ArrowDown,
  VolumeX,
} from 'lucide-preact';
import {
  playSuccessSound,
  playStepCompleteSound,
  playClickSound,
  speakLocalText,
  stopSpeaking,
} from '../services/soundService';

interface MissionRunnerProps {
  mission: Mission;
  worldRef: WorldScene3D | null;
  onExit: () => void;
  onCompleteMission: (missionId: string, isDuo: boolean) => void;
}

export const MissionRunner: FunctionalComponent<MissionRunnerProps> = ({
  mission,
  worldRef,
  onExit,
  onCompleteMission,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [missionFinished, setMissionFinished] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Misión 1: Planta de Agua 3D
  const [m1Filters, setM1Filters] = useState(2);
  const [m1SectorLiters, setM1SectorLiters] = useState<number | null>(null);
  const [m1Valves, setM1Valves] = useState({ v1: 3, v2: 2, v3: 3 });

  // Misión 2: Detective SIFT
  const [m2Option, setM2Option] = useState<number | null>(null);
  const [m2Inspected, setM2Inspected] = useState<'A' | 'B' | null>(null);
  const [m2Chosen, setM2Chosen] = useState<'A' | 'B' | null>(null);
  const [m2Order, setM2Order] = useState(['step-b', 'step-a', 'step-c']);

  // Misión 3: Puente 3D + Modo Dúo
  const [isDuoMode, setIsDuoMode] = useState(true);
  const [m3Beams, setM3Beams] = useState(2);
  const [m3Pillars, setM3Pillars] = useState(1);
  const [m3Planks, setM3Planks] = useState<number | null>(null);

  // Misión 4: Cabaña Tetera 3D
  const [m4Option1, setM4Option1] = useState<number | null>(null);
  const [m4HeardWords, setM4HeardWords] = useState<string[]>([]);
  const [m4Option3, setM4Option3] = useState<number | null>(null);

  const step = mission.steps[currentStepIndex];

  // Sincronizar objetos 3D en vivo cuando cambian los controles
  useEffect(() => {
    if (!worldRef) return;
    if (mission.id === 'mision-1-agua') {
      const sum = m1Valves.v1 + m1Valves.v2 + m1Valves.v3;
      worldRef.updateWaterPlantState(m1Filters, sum);
    } else if (mission.id === 'mision-3-puente') {
      const totalPlanks = m3Planks === 3 ? 10 : 7;
      worldRef.updateBridgeState(m3Beams, m3Pillars, totalPlanks);
    }
  }, [m1Filters, m1Valves, m3Beams, m3Pillars, m3Planks, mission.id, worldRef]);

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakLocalText(step.instruction, () => setIsSpeaking(false));
    }
  };

  const advanceStep = () => {
    setFeedbackMsg(null);
    stopSpeaking();
    setIsSpeaking(false);
    playStepCompleteSound();
    worldRef?.explorer.triggerCelebration();

    if (currentStepIndex + 1 < mission.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      playSuccessSound();
      setMissionFinished(true);
      onCompleteMission(mission.id, isDuoMode);
    }
  };

  const moveOrder = (idx: number, dir: 'up' | 'down') => {
    playClickSound();
    const copy = [...m2Order];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target >= 0 && target < copy.length) {
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      setM2Order(copy);
    }
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* ========================================================= */}
      {/* BARRA FLOTANTE SUPERIOR COMPACTA                          */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-3 w-full max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onExit();
          }}
          className="pointer-events-auto flex items-center gap-2 bg-[#fcf7eb] hover:bg-white text-[#3d2b1f] px-4 py-2.5 rounded-2xl border-2 border-[#d8c7a6] shadow-lg font-extrabold text-sm transition-transform active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir al Mapa 3D</span>
        </button>

        {/* Indicador Visual de 3 Pasos (Píldoras de Juego, Cero Texto Basura) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#3d2b1f]/80 backdrop-blur-md px-4 py-2 rounded-full border-2 border-[#f3e5ab]/40 shadow-lg">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-3 rounded-full transition-all duration-300 ${
                idx < currentStepIndex
                  ? 'w-8 bg-[#a3c95c]'
                  : idx === currentStepIndex
                  ? 'w-10 bg-[#facc15] ring-4 ring-[#facc15]/30'
                  : 'w-3 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Botones de Voz y Pista Socrática */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleVoice}
            className="w-11 h-11 rounded-2xl bg-[#fcf7eb] hover:bg-white text-[#3d2b1f] border-2 border-[#d8c7a6] shadow-lg flex items-center justify-center transition-transform active:scale-95"
            title="Escuchar voz"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5 text-sky-600" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setIsTutorOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-2.5 rounded-2xl border-2 border-[#fde68a] shadow-lg font-extrabold text-sm transition-transform active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>Pista</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL INTERACTIVO INFERIOR / LATERAL (Dejando ver el 3D)  */}
      {/* ========================================================= */}
      <div className="w-full max-w-2xl mx-auto lg:ml-auto lg:mr-6 my-auto lg:my-0">
        {!missionFinished ? (
          <div className="pointer-events-auto bg-[#fcf7eb]/95 backdrop-blur-md rounded-[28px] p-3 shadow-2xl border-2 border-[#e2d5b5]">
            <div className="border-2 border-dashed border-[#c8b692] rounded-[22px] p-4 sm:p-5 flex flex-col gap-4">
              {/* Título corto y directo */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#a3c95c]/25 text-[#2d3a14] text-xs font-extrabold">
                  Reto {currentStepIndex + 1} de 3
                </span>

                {mission.id === 'mision-3-puente' && (
                  <button
                    type="button"
                    onClick={() => setIsDuoMode(!isDuoMode)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                      isDuoMode
                        ? 'bg-[#6c80b5] text-white border-[#8fa2d4]'
                        : 'bg-white text-[#5c3a21] border-[#d8c7a6]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isDuoMode ? 'Turno: Explorador ' + (currentStepIndex % 2 === 0 ? 'A' : 'B') : '1 Jugador'}</span>
                  </button>
                )}
              </div>

              {/* ===================================================== */}
              {/* MECÁNICAS INTERACTIVAS DIRECTAS CON EL MUNDO 3D       */}
              {/* ===================================================== */}

              {/* MISIÓN 1 · PASO 1: FILTROS 3D EN EL TANQUE */}
              {mission.id === 'mision-1-agua' && currentStepIndex === 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-base sm:text-lg font-extrabold text-[#3d2b1f] leading-snug">
                    Cada filtro da <span className="text-sky-600">6 L</span>. ¡Enciende filtros en el tanque 3D para lograr <span className="text-emerald-700">24 Litros</span>!
                  </p>

                  <div className="flex items-center justify-between bg-white/90 p-3.5 rounded-2xl border-2 border-[#e2d5b5]">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setM1Filters((p) => Math.max(1, p - 1));
                      }}
                      className="w-12 h-12 rounded-xl bg-[#f5efe2] hover:bg-[#e2d5b5] text-[#3d2b1f] font-black text-2xl"
                    >
                      -
                    </button>

                    <div className="text-center">
                      <span className="text-2xl font-black text-sky-600 block">
                        {m1Filters} Filtros = {m1Filters * 6} L
                      </span>
                      <span className="text-xs font-bold text-[#7c6248]">
                        Mira cómo sube el agua en el tanque 3D
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setM1Filters((p) => Math.min(6, p + 1));
                      }}
                      className="w-12 h-12 rounded-xl bg-[#f5efe2] hover:bg-[#e2d5b5] text-[#3d2b1f] font-black text-2xl"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      m1Filters === 4
                        ? advanceStep()
                        : setFeedbackMsg('Prueba con 4 filtros para llegar a 24 litros.')
                    }
                    className="w-full py-3.5 rounded-2xl bg-[#a3c95c] hover:bg-[#92b84b] text-[#2d3a14] font-black text-base shadow-md border-2 border-[#c2e285] transition-transform active:scale-95"
                  >
                    ¡Listo! ({m1Filters * 6} / 24 L)
                  </button>
                </div>
              )}

              {/* MISIÓN 1 · PASO 2: REPARTO EN 3 SECTORES */}
              {mission.id === 'mision-1-agua' && currentStepIndex === 1 && (
                <div className="flex flex-col gap-4">
                  <p className="text-base sm:text-lg font-extrabold text-[#3d2b1f]">
                    Reparte los <span className="text-sky-600">24 L</span> en partes iguales para <span className="text-amber-600">3 sectores</span>:
                  </p>

                  <div className="grid grid-cols-4 gap-2.5">
                    {[6, 8, 10, 12].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setM1SectorLiters(val);
                          if (val === 8) setTimeout(advanceStep, 250);
                          else setFeedbackMsg('24 dividido entre 3 sectores es 8 L.');
                        }}
                        className={`py-4 rounded-2xl font-black text-xl border-2 transition-all ${
                          m1SectorLiters === val
                            ? 'bg-sky-500 text-white border-sky-300 scale-105 shadow-lg'
                            : 'bg-white text-[#3d2b1f] border-[#e2d5b5] hover:scale-105'
                        }`}
                      >
                        {val} L
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MISIÓN 1 · PASO 3: GIRAR LAS 3 VÁLVULAS 3D */}
              {mission.id === 'mision-1-agua' && currentStepIndex === 2 && (
                <div className="flex flex-col gap-4">
                  <p className="text-base sm:text-lg font-extrabold text-[#3d2b1f]">
                    Gira las 3 ruedas 3D para que sumen <span className="text-emerald-700">10 bares</span>:
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {(['v1', 'v2', 'v3'] as const).map((key, idx) => (
                      <div
                        key={key}
                        className="bg-white p-2.5 rounded-2xl border-2 border-[#e2d5b5] flex flex-col items-center gap-1.5"
                      >
                        <span className="text-[11px] font-extrabold text-[#7c6248]">
                          Rueda {idx + 1}
                        </span>
                        <span className="text-2xl font-black text-amber-600">
                          {m1Valves[key]}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setM1Valves((p) => ({ ...p, [key]: Math.max(1, p[key] - 1) }));
                            }}
                            className="w-8 h-8 rounded-lg bg-[#f5efe2] font-black"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setM1Valves((p) => ({ ...p, [key]: Math.min(5, p[key] + 1) }));
                            }}
                            className="w-8 h-8 rounded-lg bg-[#f5efe2] font-black"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const sum = m1Valves.v1 + m1Valves.v2 + m1Valves.v3;
                      if (sum === 10) advanceStep();
                      else setFeedbackMsg(`Suman ${sum} bares. Ajusta hasta tener 10.`);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#a3c95c] hover:bg-[#92b84b] text-[#2d3a14] font-black text-base shadow-md border-2 border-[#c2e285]"
                  >
                    Confirmar Presión ({m1Valves.v1 + m1Valves.v2 + m1Valves.v3} / 10 bar)
                  </button>
                </div>
              )}

              {/* MISIÓN 2 · PASO 1: ALERTA DEL GUARDABOSQUES */}
              {mission.id === 'mision-2-rumor' && currentStepIndex === 0 && (
                <div className="flex flex-col gap-3.5">
                  <div className="p-3 bg-emerald-100/80 border-2 border-emerald-400 rounded-2xl text-sm font-extrabold text-emerald-950">
                    "El río subió. Usa la <span className="underline">Ruta Alta Señalizada</span> con calma."
                  </div>

                  <p className="text-sm font-extrabold text-[#3d2b1f]">
                    ¿Por dónde debemos caminar?
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Cruzar el río nadando rápido',
                      'Ir por la Ruta Alta Señalizada con calma',
                      'Quedarse en la orilla del río',
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setM2Option(idx);
                          if (idx === 1) setTimeout(advanceStep, 250);
                          else setFeedbackMsg('Lee la palabra subrayada en el cartel verde.');
                        }}
                        className={`p-3 rounded-xl font-extrabold text-sm text-left border-2 transition-all ${
                          m2Option === idx
                            ? 'bg-[#a3c95c] text-[#2d3a14] border-[#7ca333]'
                            : 'bg-white text-[#3d2b1f] border-[#e2d5b5] hover:bg-[#fffdf7]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MISIÓN 2 · PASO 2: LUPA SIFT DE DETECTIVE */}
              {mission.id === 'mision-2-rumor' && currentStepIndex === 1 && (
                <div className="flex flex-col gap-3.5">
                  <p className="text-sm font-extrabold text-[#3d2b1f]">
                    Usa la <span className="text-amber-600">Lupa</span> y toca el mensaje <span className="text-emerald-700">VERDADERO</span>:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-white border-2 border-[#e2d5b5] flex flex-col justify-between gap-2">
                      <span className="text-xs font-black text-rose-600">Nota A (Sin firma)</span>
                      <p className="text-xs font-bold text-[#3d2b1f]">
                        "¡Corran todos sin mirar atrás!"
                      </p>
                      {m2Inspected === 'A' && (
                        <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 p-1.5 rounded-lg">
                          Bulo: Anónimo y alarmista
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setM2Inspected('A');
                          }}
                          className="p-2 rounded-xl bg-amber-100 text-amber-800"
                          title="Inspeccionar con Lupa"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackMsg('¡Cuidado! La Nota A no tiene firma real.')}
                          className="flex-1 py-1.5 rounded-xl bg-rose-100 text-rose-900 font-extrabold text-xs"
                        >
                          Elegir A
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border-2 border-emerald-400 flex flex-col justify-between gap-2">
                      <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Nota B (Escuela)
                      </span>
                      <p className="text-xs font-bold text-[#3d2b1f]">
                        "Centro Comunal abierto a las 9:00 AM."
                      </p>
                      {m2Inspected === 'B' && (
                        <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 p-1.5 rounded-lg">
                          Oficial: Firmado por el Maestro
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setM2Inspected('B');
                          }}
                          className="p-2 rounded-xl bg-amber-100 text-amber-800"
                          title="Inspeccionar con Lupa"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setM2Chosen('B');
                            advanceStep();
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-[#a3c95c] text-[#2d3a14] font-extrabold text-xs"
                        >
                          Elegir B
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MISIÓN 2 · PASO 3: ORDENAR 3 PASOS */}
              {mission.id === 'mision-2-rumor' && currentStepIndex === 2 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-extrabold text-[#3d2b1f]">
                    Ordena el plan: 1.º Guardar mochila, 2.º Avisar, 3.º Caminar:
                  </p>

                  {m2Order.map((id, idx) => {
                    const labels: Record<string, string> = {
                      'step-a': 'Guardar útiles en bolsa impermeable',
                      'step-b': 'Reunir y avisar a la familia',
                      'step-c': 'Caminar juntos por la Ruta Alta',
                    };
                    return (
                      <div
                        key={id}
                        className="p-2.5 bg-white rounded-xl border-2 border-[#e2d5b5] flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-extrabold text-[#3d2b1f]">
                          {idx + 1}. {labels[id]}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveOrder(idx, 'up')}
                            className="p-1.5 rounded-lg bg-[#f5efe2]"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(idx, 'down')}
                            className="p-1.5 rounded-lg bg-[#f5efe2]"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      m2Order[0] === 'step-a' && m2Order[1] === 'step-b'
                        ? advanceStep()
                        : setFeedbackMsg('Pon "Guardar útiles" en el número 1.')
                    }
                    className="w-full py-3 rounded-2xl bg-[#a3c95c] text-[#2d3a14] font-black text-sm"
                  >
                    Comprobar Orden
                  </button>
                </div>
              )}

              {/* MISIÓN 3 · PASO 1: VIGAS 3D DEL PUENTE */}
              {mission.id === 'mision-3-puente' && currentStepIndex === 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-base font-extrabold text-[#3d2b1f]">
                    El río mide <span className="text-sky-600">12 m</span> y cada viga mide <span className="text-amber-700">3 m</span>. ¡Coloca las vigas en el puente 3D!
                  </p>

                  <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border-2 border-[#e2d5b5]">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setM3Beams((p) => Math.max(1, p - 1));
                      }}
                      className="w-12 h-12 rounded-xl bg-[#f5efe2] font-black text-2xl"
                    >
                      -
                    </button>

                    <div className="text-center">
                      <span className="text-2xl font-black text-amber-700 block">
                        {m3Beams} Vigas = {m3Beams * 3} m
                      </span>
                      <span className="text-xs font-bold text-[#7c6248]">
                        Observa el puente 3D frente a ti
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setM3Beams((p) => Math.min(4, p + 1));
                      }}
                      className="w-12 h-12 rounded-xl bg-[#f5efe2] font-black text-2xl"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      m3Beams === 4
                        ? advanceStep()
                        : setFeedbackMsg('Necesitas 4 vigas (4 × 3 m = 12 m).')
                    }
                    className="w-full py-3.5 rounded-2xl bg-[#a3c95c] text-[#2d3a14] font-black text-base"
                  >
                    Fijar Vigas 3D ({m3Beams * 3} / 12 m)
                  </button>
                </div>
              )}

              {/* MISIÓN 3 · PASO 2: PILARES 3D */}
              {mission.id === 'mision-3-puente' && currentStepIndex === 1 && (
                <div className="flex flex-col gap-4">
                  <p className="text-base font-extrabold text-[#3d2b1f]">
                    Cada pilar soporta <span className="text-amber-700">50 kg</span>. Para sostener <span className="text-sky-600">90 kg</span>, ¿cuántos pilares ponemos?
                  </p>

                  <div className="grid grid-cols-4 gap-2.5">
                    {[1, 2, 3, 4].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setM3Pillars(p);
                          if (p === 2) setTimeout(advanceStep, 300);
                          else setFeedbackMsg('Con 2 pilares tienes 100 kg de soporte ideal.');
                        }}
                        className={`py-3.5 rounded-2xl font-black text-lg border-2 ${
                          m3Pillars === p
                            ? 'bg-amber-500 text-white border-amber-300'
                            : 'bg-white text-[#3d2b1f] border-[#e2d5b5]'
                        }`}
                      >
                        {p} ({p * 50}kg)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MISIÓN 3 · PASO 3: TABLONES FALTANTES */}
              {mission.id === 'mision-3-puente' && currentStepIndex === 2 && (
                <div className="flex flex-col gap-4">
                  <p className="text-base font-extrabold text-[#3d2b1f]">
                    Faltan tablones para llegar de <span className="text-amber-700">7 a 10</span>. ¿Cuántos colocamos?
                  </p>

                  <div className="grid grid-cols-4 gap-2.5">
                    {[2, 3, 4, 5].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setM3Planks(opt);
                          if (opt === 3) setTimeout(advanceStep, 350);
                          else setFeedbackMsg('7 + 3 = 10 tablones.');
                        }}
                        className="py-4 rounded-2xl bg-white hover:bg-[#a3c95c] text-[#3d2b1f] font-black text-xl border-2 border-[#e2d5b5]"
                      >
                        +{opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MISIÓN 4 · PASO 1: CABAÑA TETERA CAUSA Y EFECTO */}
              {mission.id === 'mision-4-bosque' && currentStepIndex === 0 && (
                <div className="flex flex-col gap-3.5">
                  <div className="p-3 bg-amber-100/80 border-2 border-amber-400 rounded-2xl text-sm font-extrabold text-[#3d2b1f]">
                    "Las aves bajan de la colina cuando viene lluvia fuerte. ¡Tapemos las semillas con hojas!"
                  </div>

                  <p className="text-sm font-extrabold text-[#3d2b1f]">
                    ¿Por qué tapamos las semillas hoy?
                  </p>

                  {[
                    'Para esconderlas del sol',
                    'Para que la lluvia fuerte no las arrastre',
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setM4Option1(idx);
                        if (idx === 1) setTimeout(advanceStep, 250);
                        else setFeedbackMsg('La lluvia fuerte lava la tierra suelta.');
                      }}
                      className="p-3 rounded-xl bg-white hover:bg-[#a3c95c] text-left font-extrabold text-sm text-[#3d2b1f] border-2 border-[#e2d5b5]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* MISIÓN 4 · PASO 2: SONIDOS ORIGINARIOS */}
              {mission.id === 'mision-4-bosque' && currentStepIndex === 1 && (
                <div className="flex flex-col gap-3.5">
                  <p className="text-sm font-extrabold text-[#3d2b1f]">
                    Toca 2 tótems de voz para escuchar los idiomas del bosque:
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {step.data.words.map((w: any) => {
                      const heard = m4HeardWords.includes(w.word);
                      return (
                        <button
                          key={w.word}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            speakLocalText(`${w.word}. Significa ${w.meaning}`);
                            if (!heard) setM4HeardWords((p) => [...p, w.word]);
                          }}
                          className={`p-3 rounded-2xl border-2 text-left flex items-center justify-between ${
                            heard
                              ? 'bg-[#a3c95c]/30 border-[#7ca333]'
                              : 'bg-white border-[#e2d5b5]'
                          }`}
                        >
                          <div>
                            <span className="text-base font-black text-[#3d2b1f] block">
                              {w.word}
                            </span>
                            <span className="text-[11px] font-bold text-[#7c6248]">
                              {w.meaning}
                            </span>
                          </div>
                          <Volume2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        </button>
                      );
                    })}
                  </div>

                  {m4HeardWords.length >= 2 && (
                    <button
                      type="button"
                      onClick={advanceStep}
                      className="w-full py-3 rounded-2xl bg-[#a3c95c] text-[#2d3a14] font-black text-sm"
                    >
                      ¡Continuar!
                    </button>
                  )}
                </div>
              )}

              {/* MISIÓN 4 · PASO 3: PROTEGER EL HUERTO */}
              {mission.id === 'mision-4-bosque' && currentStepIndex === 2 && (
                <div className="flex flex-col gap-3.5">
                  <p className="text-base font-extrabold text-[#3d2b1f]">
                    ¿Qué colocamos alrededor del huerto para frenar el agua?
                  </p>

                  {[
                    'Bolsas sueltas en el piso',
                    'Barreras de piedras firmes y canales de desagüe',
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setM4Option3(idx);
                        if (idx === 1) setTimeout(advanceStep, 250);
                        else setFeedbackMsg('Las piedras firmes sostienen la tierra.');
                      }}
                      className="p-3.5 rounded-2xl bg-white hover:bg-[#a3c95c] text-left font-extrabold text-sm text-[#3d2b1f] border-2 border-[#e2d5b5]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {feedbackMsg && (
                <div className="px-3 py-2 rounded-xl bg-amber-100 border border-amber-300 text-xs font-extrabold text-amber-900">
                  {feedbackMsg}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TARJETA DE VICTORIA COMPACTA Y ACOGEDORA */
          <div className="pointer-events-auto bg-[#fcf7eb] rounded-[32px] p-4 shadow-2xl border-2 border-[#e2d5b5] text-center">
            <div className="border-2 border-dashed border-[#c8b692] rounded-[24px] p-5 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#fef08a] border-2 border-[#f59e0b] flex items-center justify-center text-amber-600 shadow-md">
                <Award className="w-9 h-9" />
              </div>

              <h3 className="text-2xl font-black text-[#3d2b1f]">
                ¡Estación Restaurada!
              </h3>

              <p className="text-xs font-bold text-[#5c3a21] bg-amber-100/70 p-3 rounded-2xl border border-amber-300">
                Reto físico corto: {mission.offScreenChallenge.actionPrompt}
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsBreathingOpen(true)}
                  className="py-3 rounded-2xl bg-[#6c80b5] text-white font-extrabold text-xs shadow-md"
                >
                  Respirar 15s
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="py-3 rounded-2xl bg-[#a3c95c] text-[#2d3a14] font-extrabold text-xs shadow-md"
                >
                  Seguir en el Valle 3D
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TutorModal
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        hints={step.socraticHints}
        stepTitle={step.title}
      />

      <BreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
        durationSeconds={15}
      />
    </div>
  );
};
