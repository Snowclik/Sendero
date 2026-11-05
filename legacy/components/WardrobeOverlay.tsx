import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import {
  type CharacterOutfit,
  DEFAULT_OUTFIT,
} from '../three/ExplorerCharacter3D';
import {
  RotateCcw,
  RotateCw,
  Sparkles,
  Check,
  LogOut,
  Shirt,
} from 'lucide-preact';
import { playClickSound, playSuccessSound } from '../services/soundService';

interface WardrobeOverlayProps {
  outfit: CharacterOutfit;
  onChangeOutfit: (newOutfit: CharacterOutfit) => void;
  onRotateCharacter: (delta: number) => void;
  onJumpCharacter: () => void;
  onClose: () => void;
}

interface OutfitItemDef {
  category: keyof CharacterOutfit;
  id: string;
  label: string;
  colorPrimary: string;
  colorSecondary: string;
  svgType: string;
}

const OUTFIT_ITEMS: OutfitItemDef[] = [
  // Fila 1: Sombreros
  { category: 'hat', id: 'wizard', label: 'Mago del Bosque', colorPrimary: '#3b2f2f', colorSecondary: '#fbbf24', svgType: 'hat-wizard' },
  { category: 'hat', id: 'cat-sunhat', label: 'Explorador Gato', colorPrimary: '#f3ba5f', colorSecondary: '#5c3a21', svgType: 'hat-cat' },
  { category: 'hat', id: 'ranger', label: 'Guardabosques', colorPrimary: '#2563eb', colorSecondary: '#facc15', svgType: 'hat-cap' },
  { category: 'hat', id: 'beret', label: 'Boina Musgo', colorPrimary: '#10b981', colorSecondary: '#047857', svgType: 'hat-beret' },
  { category: 'hat', id: 'crown', label: 'Corona Floral', colorPrimary: '#22c55e', colorSecondary: '#f43f5e', svgType: 'hat-crown' },

  // Fila 2: Pañuelos y Gafas
  { category: 'scarf', id: 'striped-orange', label: 'Pañuelo Solar', colorPrimary: '#fbbf24', colorSecondary: '#ea580c', svgType: 'scarf' },
  { category: 'scarf', id: 'emerald', label: 'Pañuelo Río', colorPrimary: '#34d399', colorSecondary: '#059669', svgType: 'scarf' },
  { category: 'scarf', id: 'sky', label: 'Pañuelo Brisa', colorPrimary: '#38bdf8', colorSecondary: '#0284c7', svgType: 'scarf' },
  { category: 'glasses', id: 'round-amber', label: 'Gafas Carey', colorPrimary: '#78350f', colorSecondary: '#f59e0b', svgType: 'glasses' },
  { category: 'glasses', id: 'sky-frames', label: 'Gafas Cielo', colorPrimary: '#0284c7', colorSecondary: '#7dd3fc', svgType: 'glasses' },

  // Fila 3: Trajes y Chalecos
  { category: 'coat', id: 'explorer-vest', label: 'Chaleco Coral', colorPrimary: '#5c4033', colorSecondary: '#f97316', svgType: 'coat' },
  { category: 'coat', id: 'forest-cloak', label: 'Capa del Bosque', colorPrimary: '#1e3a2f', colorSecondary: '#10b981', svgType: 'coat' },
  { category: 'coat', id: 'sunny-tunic', label: 'Túnica Girasol', colorPrimary: '#d97706', colorSecondary: '#facc15', svgType: 'coat' },
  { category: 'coat', id: 'poncho', label: 'Poncho Lluvia', colorPrimary: '#0d9488', colorSecondary: '#38bdf8', svgType: 'coat' },
  { category: 'glasses', id: 'none', label: 'Sin Gafas', colorPrimary: '#94a3b8', colorSecondary: '#cbd5e1', svgType: 'none' },

  // Fila 4: Botas y Herramientas 3D
  { category: 'boots', id: 'cat-boots', label: 'Botas Naranja', colorPrimary: '#ea580c', colorSecondary: '#271c19', svgType: 'boots' },
  { category: 'boots', id: 'forest-boots', label: 'Botas Montaña', colorPrimary: '#451a03', colorSecondary: '#78350f', svgType: 'boots' },
  { category: 'tool', id: 'bug-net', label: 'Red Explorador', colorPrimary: '#5c3a21', colorSecondary: '#e2e8f0', svgType: 'tool-net' },
  { category: 'tool', id: 'magnifier', label: 'Súper Lupa', colorPrimary: '#f59e0b', colorSecondary: '#bae6fd', svgType: 'tool-lens' },
  { category: 'tool', id: 'lantern', label: 'Farol Solar', colorPrimary: '#d97706', colorSecondary: '#fef08a', svgType: 'tool-lantern' },
];

export const WardrobeOverlay: FunctionalComponent<WardrobeOverlayProps> = ({
  outfit,
  onChangeOutfit,
  onRotateCharacter,
  onJumpCharacter,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | keyof CharacterOutfit>('all');

  const handleSelectItem = (item: OutfitItemDef) => {
    playClickSound();
    onChangeOutfit({
      ...outfit,
      [item.category]: item.id,
    });
  };

  const renderItemSvg = (item: OutfitItemDef) => {
    switch (item.svgType) {
      case 'hat-wizard':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <ellipse cx="32" cy="48" rx="26" ry="7" fill={item.colorPrimary} />
            <path d="M16 46 L34 10 L48 46 Z" fill={item.colorPrimary} />
            <path d="M19 43 Q32 47 45 43" stroke={item.colorSecondary} strokeWidth="4" fill="none" />
          </svg>
        );
      case 'hat-cat':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <ellipse cx="32" cy="44" rx="26" ry="8" fill={item.colorPrimary} />
            <path d="M16 42 C16 22 48 22 48 42 Z" fill={item.colorPrimary} />
            <polygon points="18,28 22,14 29,24" fill={item.colorPrimary} />
            <polygon points="46,28 42,14 35,24" fill={item.colorPrimary} />
            <path d="M17 40 Q32 45 47 40" stroke={item.colorSecondary} strokeWidth="3.5" fill="none" />
          </svg>
        );
      case 'hat-cap':
      case 'hat-beret':
      case 'hat-crown':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <path d="M14 40 C14 20 50 20 50 40 Z" fill={item.colorPrimary} />
            <ellipse cx="36" cy="40" rx="22" ry="6" fill={item.colorSecondary} />
            <circle cx="32" cy="28" r="5" fill="#ffffff" opacity="0.8" />
          </svg>
        );
      case 'scarf':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <path d="M14 24 Q32 34 50 24 L44 38 Q32 44 20 38 Z" fill={item.colorPrimary} />
            <polygon points="34,36 44,54 32,50" fill={item.colorSecondary} />
            <circle cx="32" cy="36" r="5" fill="#ffffff" />
          </svg>
        );
      case 'glasses':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <circle cx="20" cy="34" r="11" stroke={item.colorPrimary} strokeWidth="4.5" fill={item.colorSecondary} fillOpacity="0.25" />
            <circle cx="44" cy="34" r="11" stroke={item.colorPrimary} strokeWidth="4.5" fill={item.colorSecondary} fillOpacity="0.25" />
            <line x1="31" y1="34" x2="33" y2="34" stroke={item.colorPrimary} strokeWidth="4.5" />
          </svg>
        );
      case 'coat':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <path d="M12 22 L22 14 L42 14 L52 22 L46 32 L42 26 L42 50 L22 50 L22 26 L18 32 Z" fill={item.colorSecondary} />
            <path d="M22 14 L30 14 L30 50 L22 50 Z" fill={item.colorPrimary} />
            <path d="M34 14 L42 14 L42 50 L34 50 Z" fill={item.colorPrimary} />
          </svg>
        );
      case 'boots':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <path d="M14 18 L26 18 L26 42 L32 46 L14 46 Z" fill={item.colorPrimary} />
            <path d="M34 18 L46 18 L46 42 L52 46 L34 46 Z" fill={item.colorPrimary} />
            <rect x="13" y="46" width="20" height="5" rx="2" fill={item.colorSecondary} />
            <rect x="33" y="46" width="20" height="5" rx="2" fill={item.colorSecondary} />
          </svg>
        );
      case 'tool-net':
      case 'tool-lens':
      case 'tool-lantern':
        return (
          <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm">
            <line x1="16" y1="50" x2="40" y2="26" stroke={item.colorPrimary} strokeWidth="5" strokeLinecap="round" />
            <circle cx="42" cy="22" r="12" stroke={item.colorPrimary} strokeWidth="4" fill={item.colorSecondary} fillOpacity="0.65" />
          </svg>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-400" />
        );
    }
  };

  const visibleItems =
    activeFilter === 'all'
      ? OUTFIT_ITEMS
      : OUTFIT_ITEMS.filter((i) => i.category === activeFilter);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-5 sm:p-8 select-none">
      {/* BARRA SUPERIOR (Estilo Imagen 2: Etiqueta Izquierda + Botón Salir Derecha) */}
      <div className="flex items-center justify-between w-full">
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#3d2b1f]/80 backdrop-blur-md text-[#fef8ec] px-4 py-2 rounded-full border-2 border-[#f3e5ab]/40 shadow-lg">
          <Shirt className="w-4 h-4 text-amber-300" />
          <span className="text-sm font-bold tracking-wide">Vestuario 3D</span>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="pointer-events-auto w-11 h-11 rounded-full bg-[#e06d53] hover:bg-[#d45b40] text-white border-2 border-[#fef8ec] shadow-lg flex items-center justify-center transition-transform active:scale-90"
          title="Volver al Valle 3D"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* ZONA CENTRAL: CONTROLES DE ROTACIÓN 3D (Izquierda) + CUADRÍCULA DE PRENDAS (Derecha) */}
      <div className="flex-1 flex flex-col lg:flex-row items-end lg:items-center justify-between gap-6 my-auto py-4">
        {/* Botones Circulares de Rotación del Personaje 3D (Abajo a la izquierda como Imagen 2) */}
        <div className="pointer-events-auto flex lg:flex-col gap-3 self-start lg:self-end mb-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onRotateCharacter(-0.45);
            }}
            className="w-11 h-11 rounded-full bg-[#fef8ec]/90 hover:bg-white text-[#5c3a21] border-2 border-[#e2d5b5] shadow-md flex items-center justify-center transition-transform active:scale-90"
            title="Girar a la izquierda"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onJumpCharacter();
            }}
            className="w-11 h-11 rounded-full bg-[#fef8ec]/90 hover:bg-white text-amber-600 border-2 border-[#e2d5b5] shadow-md flex items-center justify-center transition-transform active:scale-90"
            title="Saltar y posar"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onRotateCharacter(0.45);
            }}
            className="w-11 h-11 rounded-full bg-[#fef8ec]/90 hover:bg-white text-[#5c3a21] border-2 border-[#e2d5b5] shadow-md flex items-center justify-center transition-transform active:scale-90"
            title="Girar a la derecha"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* PANEL DERECHO DE VESTUARIO (Idéntico a Imagen 2) */}
        <div className="pointer-events-auto w-full max-w-xl flex flex-col gap-3.5 bg-[#4a3525]/25 backdrop-blur-md p-5 rounded-[32px] border-2 border-[#fef8ec]/40 shadow-2xl">
          {/* Pestañas Superiores de Categoría */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="px-2 py-0.5 rounded-md bg-[#3d2b1f]/60 text-[#fef8ec] text-[11px] font-bold">
              Q
            </span>
            {[
              { id: 'all', label: 'Todo' },
              { id: 'hat', label: 'Sombreros' },
              { id: 'coat', label: 'Trajes' },
              { id: 'boots', label: 'Botas' },
              { id: 'tool', label: 'Equipo' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveFilter(cat.id as any);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                  activeFilter === cat.id
                    ? 'bg-[#fef08a] text-[#451a03] shadow-md scale-105 ring-4 ring-[#fef08a]/40'
                    : 'bg-[#fef8ec]/75 text-[#5c3a21] hover:bg-[#fef8ec]'
                }`}
              >
                {cat.label}
              </button>
            ))}
            <span className="px-2 py-0.5 rounded-md bg-[#3d2b1f]/60 text-[#fef8ec] text-[11px] font-bold">
              E
            </span>
          </div>

          {/* Cinta inclinada "Elige tu Traje" con línea punteada (Imagen 2) */}
          <div className="flex items-center gap-3">
            <div className=" -rotate-2 bg-[#7b9acc] text-white px-4 py-1 rounded-lg border border-dashed border-white/80 shadow-sm text-xs font-extrabold tracking-wide">
              Elige tu Equipo
            </div>
            <div className="flex-1 border-b-2 border-dashed border-[#fef8ec]/60" />
          </div>

          {/* Cuadrícula 5x4 de Casillas Crema Redondeadas (Imagen 2) */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {visibleItems.map((item) => {
              const isSelected = outfit[item.category] === item.id;
              return (
                <button
                  key={`${item.category}-${item.id}`}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`
                    group relative aspect-square rounded-2xl p-2
                    flex flex-col items-center justify-center
                    transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-[#fffdf7] border-[3px] border-[#9bc53d] shadow-lg scale-105'
                        : 'bg-[#f5efe2]/90 hover:bg-[#fffdf7] border-2 border-[#e2d5b5] hover:scale-105'
                    }
                  `}
                  title={item.label}
                >
                  {renderItemSvg(item)}
                  <span className="text-[10px] font-extrabold text-[#5c3a21] mt-1 line-clamp-1">
                    {item.label}
                  </span>

                  {/* Círculo verde de selección en la esquina (Imagen 2) */}
                  {isSelected && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#9bc53d] border-2 border-white text-white flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Botones Inferiores Gruesos (Azul Pizarra y Verde Lima como Imagen 2) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onChangeOutfit(DEFAULT_OUTFIT);
              }}
              className="py-3 px-4 rounded-2xl bg-[#6c80b5] hover:bg-[#5b6fa3] text-white font-extrabold text-sm shadow-lg border-2 border-[#8fa2d4] transition-transform active:scale-95"
            >
              Traje Original
            </button>

            <button
              type="button"
              onClick={() => {
                playSuccessSound();
                onClose();
              }}
              className="py-3 px-4 rounded-2xl bg-[#a3c95c] hover:bg-[#92b84b] text-[#2d3a14] font-extrabold text-sm shadow-lg border-2 border-[#c2e285] transition-transform active:scale-95"
            >
              Guardar y Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

