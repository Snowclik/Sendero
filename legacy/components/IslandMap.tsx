import type { FunctionalComponent } from 'preact';
import { GlassCard } from './ui/GlassCard';
import { GlassBadge } from './ui/GlassBadge';
import { MISSIONS, type Mission } from '../data/missionsData';
import {
  Droplet,
  FileSearch,
  Hammer,
  Leaf,
  CheckCircle2,
  Lock,
  Compass,
  Sparkles,
  Users,
} from 'lucide-preact';
import { playClickSound } from '../services/soundService';

interface IslandMapProps {
  completedMissions: string[];
  onSelectMission: (mission: Mission) => void;
  dailyEnergy: number;
}

export const IslandMap: FunctionalComponent<IslandMapProps> = ({
  completedMissions,
  onSelectMission,
  dailyEnergy,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplet':
        return Droplet;
      case 'FileSearch':
        return FileSearch;
      case 'Hammer':
        return Hammer;
      case 'Leaf':
        return Leaf;
      default:
        return Compass;
    }
  };

  // Posiciones en el mapa vectorial del Valle Resiliente (porcentajes X, Y)
  const stationCoords: Record<string, { x: number; y: number }> = {
    'mision-1-agua': { x: 25, y: 72 },    // Planta Potabilizadora junto al río sur
    'mision-2-rumor': { x: 30, y: 32 },   // Quebrada y estación de radio norte
    'mision-3-puente': { x: 68, y: 48 },  // Puente de cruce este
    'mision-4-bosque': { x: 75, y: 80 },  // Huerto y bosque de la abuela
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Banner Informativo del Valle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-xl p-4 rounded-3xl border-2 border-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 border border-sky-200">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Mapa del Valle Resiliente
            </h2>
            <p className="text-xs text-slate-500">
              Toca una estación para resolver su emergencia matemática o de lectura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassBadge variant="emerald" size="sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedMissions.length} de 4 Estaciones Seguras</span>
          </GlassBadge>
          <GlassBadge variant="amber" size="sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nivel 3.º y 4.º Primaria</span>
          </GlassBadge>
        </div>
      </div>

      {/* Lienzo Visual del Valle Resiliente (SVG Diurno Modo Claro) */}
      <GlassCard className="relative p-3 sm:p-5 overflow-hidden border-2 border-white shadow-xl">
        <div className="relative w-full aspect-[16/9] min-h-[380px] max-h-[540px] rounded-2xl overflow-hidden bg-gradient-to-b from-sky-200/50 via-emerald-50/60 to-amber-100/40 select-none border border-sky-100">
          {/* Ilustración Vectorial del Paisaje Rural */}
          <svg
            viewBox="0 0 1000 562"
            className="absolute inset-0 w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Colinas del fondo */}
            <path
              d="M0,320 Q200,180 450,280 T1000,260 L1000,562 L0,562 Z"
              fill="#d1fae5"
              opacity="0.8"
            />
            <path
              d="M0,380 Q350,260 700,360 T1000,340 L1000,562 L0,562 Z"
              fill="#a7f3d0"
              opacity="0.9"
            />

            {/* Río cristalino que serpentea */}
            <path
              d="M200,0 C220,150 180,260 320,380 C420,460 480,500 520,562"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="48"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M200,0 C220,150 180,260 320,380 C420,460 480,500 520,562"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="24"
              strokeLinecap="round"
              opacity="0.95"
            />

            {/* Puente de madera sobre el río */}
            <rect
              x="260"
              y="330"
              width="120"
              height="28"
              rx="4"
              fill="#d97706"
              stroke="#b45309"
              strokeWidth="2"
              transform="rotate(25, 320, 344)"
            />

            {/* Caminos de senderos de tierra suave */}
            <path
              d="M320,344 Q500,330 680,270 T820,450"
              fill="none"
              stroke="#fed7aa"
              strokeWidth="14"
              strokeDasharray="8 6"
              opacity="0.9"
            />
            <path
              d="M250,404 Q220,440 250,510"
              fill="none"
              stroke="#fed7aa"
              strokeWidth="12"
              strokeDasharray="6 4"
              opacity="0.8"
            />

            {/* Escuela Rural temporal y Albergue Comunitario en el centro */}
            <g transform="translate(480, 240)">
              {/* Techo a dos aguas */}
              <polygon points="0,30 50,0 100,30" fill="#f43f5e" />
              {/* Fachada de madera clara */}
              <rect x="10" y="30" width="80" height="50" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" rx="4" />
              {/* Puerta y ventanas */}
              <rect x="40" y="50" width="20" height="30" fill="#0284c7" rx="2" />
              <rect x="18" y="42" width="14" height="14" fill="#bae6fd" rx="2" />
              <rect x="68" y="42" width="14" height="14" fill="#bae6fd" rx="2" />
              {/* Bandera blanca de seguridad */}
              <line x1="50" y1="0" x2="50" y2="-20" stroke="#64748b" strokeWidth="2" />
              <polygon points="50,-20 70,-14 50,-8" fill="#10b981" />
            </g>

            {/* Árboles y vegetación diurna */}
            <circle cx="120" cy="280" r="32" fill="#10b981" opacity="0.8" />
            <circle cx="150" cy="270" r="26" fill="#059669" opacity="0.9" />
            <circle cx="850" cy="220" r="40" fill="#10b981" opacity="0.85" />
            <circle cx="880" cy="240" r="30" fill="#047857" opacity="0.9" />
            <circle cx="620" cy="420" r="28" fill="#34d399" opacity="0.8" />

            {/* Sol radiante vectorial (Sin emojis) */}
            <g transform="translate(80, 60)">
              <circle cx="0" cy="0" r="28" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
              {/* Rayos del sol */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="-38"
                  x2="0"
                  y2="-46"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform={`rotate(${deg})`}
                />
              ))}
            </g>
          </svg>

          {/* Marcadores Interactivos de las 4 Misiones */}
          {MISSIONS.map((mission) => {
            const coords = stationCoords[mission.id] || { x: 50, y: 50 };
            const isCompleted = completedMissions.includes(mission.id);
            const isAvailable = dailyEnergy > 0 || isCompleted;
            const Icon = getIcon(mission.iconName);

            return (
              <div
                key={mission.id}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onSelectMission(mission);
                  }}
                  className={`
                    group relative flex flex-col items-center
                    focus:outline-none focus:ring-4 focus:ring-sky-400/50 rounded-3xl
                    transition-all duration-300 hover:scale-105 active:scale-95
                  `}
                >
                  {/* Tarjeta Flotante del Marcador */}
                  <div
                    className={`
                      relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl
                      flex items-center justify-center
                      border-3 shadow-xl backdrop-blur-xl transition-all
                      ${
                        isCompleted
                          ? 'bg-emerald-500 text-white border-white shadow-emerald-500/30 ring-4 ring-emerald-200'
                          : isAvailable
                          ? 'bg-white/95 text-slate-800 border-white hover:border-sky-300 shadow-slate-300/60 ring-4 ring-sky-100'
                          : 'bg-slate-200/90 text-slate-400 border-slate-300'
                      }
                    `}
                  >
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110" />

                    {/* Insignia de Estado */}
                    <div className="absolute -top-2 -right-2">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-amber-900 shadow-md">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : !isAvailable ? (
                        <div className="w-7 h-7 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-white shadow-md">
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-white shadow-md animate-bounce">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Etiqueta de Texto Debajo del Marcador */}
                  <div className="mt-2 px-3 py-1 bg-white/90 backdrop-blur-md rounded-xl border border-white/90 shadow-md text-center max-w-[150px]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {mission.subject}
                    </span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {mission.title}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Lista Rápida de Misiones para Pantallas Táctiles y Teclado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MISSIONS.map((m, idx) => {
          const isDone = completedMissions.includes(m.id);
          const Icon = getIcon(m.iconName);
          return (
            <GlassCard
              key={m.id}
              onClick={() => {
                playClickSound();
                onSelectMission(m);
              }}
              hoverEffect
              className={`p-4 flex flex-col justify-between border-2 ${
                isDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <GlassBadge
                    variant={m.subject === 'Matemáticas' ? 'amber' : 'emerald'}
                    size="sm"
                  >
                    {m.subject}
                  </GlassBadge>
                  <span className="text-[10px] font-bold text-slate-400">
                    Atajo: [{idx + 1}]
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">
                    {m.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{m.shortStory}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {isDone ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> ¡Estación Segura!
                  </span>
                ) : (
                  <span className="text-sky-600 font-bold flex items-center gap-1">
                    Iniciar Misión
                  </span>
                )}
                {m.id === 'mision-3-puente' && (
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Modo Dúo
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

