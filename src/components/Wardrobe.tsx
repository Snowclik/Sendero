import type { FunctionalComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';
import { ArrowLeft, Backpack, Check, Footprints, HardHat, Lock, Palette, RotateCcw, RotateCw, Scissors, Shirt } from 'lucide-preact';
import { CATEGORIES, WARDROBE, type Category, type Outfit } from '../data/wardrobe';
import { ACHIEVEMENTS } from '../data/achievements';
import { buildCharacter } from '../game/character';
import { GlassButton } from './ui/GlassButton';
import { ItemThumb, SquirrelArt } from './ui/Art';
import { LINES } from '../data/lines';
import { playClickSound, playSuccessSound, sayText } from '../services/soundService';

const CAT_ICON: Record<Category, any> = { hat: HardHat, shirt: Shirt, pants: null, shoes: Footprints, bag: Backpack, skin: Palette, hair: Scissors };

/** Vista previa 3D del explorador: gira sola y se puede arrastrar. */
function usePreview(outfit: Outfit) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<{ apply: (o: Outfit) => void; spin: (d: number) => void } | null>(null);
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xf5d0b5, 2.2));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.4);
    sun.position.set(1, 2, 2);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 1.3, 6.2);
    camera.lookAt(0, 0.9, 0); // cuerpo entero, como en un selector de personaje
    const ch = buildCharacter(outfit);
    ch.group.scale.setScalar(1.35);
    ch.group.position.y = -0.15;
    scene.add(ch.group);
    let rot = -0.5;
    let auto = true;
    let drag: number | null = null;
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const down = (e: PointerEvent) => { drag = e.clientX; auto = false; };
    const move = (e: PointerEvent) => { if (drag !== null) { rot += (e.clientX - drag) * 0.01; drag = e.clientX; } };
    const up = () => (drag = null);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('resize', resize);
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (auto) rot += 0.006;
      ch.group.rotation.y = rot;
      const t = (performance.now() - t0) / 1000;
      ch.limbs.armL.rotation.x = Math.sin(t * 2) * 0.15; // respira, saluda un poquito
      ch.limbs.armR.rotation.x = -Math.sin(t * 2) * 0.15;
      renderer.render(scene, camera);
    };
    loop();
    api.current = { apply: ch.apply, spin: (d) => { auto = false; rot += d; } };
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  useEffect(() => api.current?.apply(outfit), [outfit]);
  return { mount, spin: (d: number) => api.current?.spin(d) };
}

export const Wardrobe: FunctionalComponent<{
  outfit: Outfit;
  isUnlocked: (achievementId: string) => boolean;
  onSave: (o: Outfit) => void;
  onClose: () => void;
}> = ({ outfit, isUnlocked, onSave, onClose }) => {
  const [draft, setDraft] = useState<Outfit>(outfit);
  const [cat, setCat] = useState<Category>('hat');
  const [say, setSay] = useState<string>(LINES.wardrobe);
  const { mount, spin } = usePreview(draft);
  useEffect(() => {
    sayText(LINES.wardrobe);
  }, []);
  const changed = JSON.stringify(draft) !== JSON.stringify(outfit);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'radial-gradient(circle at 25% 30%, #fff4e6 0, #fde4cf 45%, #f6c9a8 100%)' }}>
      {/* Decoración de cuarto acogedor */}
      <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: 'repeating-linear-gradient(90deg,#f3d9b8 0 60px,#eecba4 60px 120px)' }} />
      <div className="absolute left-[6%] top-[10%] w-40 h-56 rounded-[28px] bg-white/40 border-8 border-white/50" />

      <div className="relative h-full flex flex-col lg:flex-row shortwide:flex-row items-stretch gap-4 p-4 lg:p-8 short:!p-2 short:gap-2">
        {/* Personaje */}
        <div className="relative flex-1 min-h-[280px] short:min-h-0 shortnarrow:hidden flex items-end justify-center">
          <span className="absolute top-0 left-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#fffaf0] border-[3px] border-white shadow-[0_4px_0_rgba(146,112,52,.22)] font-black text-slate-700">
            <Shirt className="w-5 h-5 text-sky-600" /> Vestuario
          </span>
          <div className="absolute bottom-[4%] w-[70%] max-w-[420px] aspect-[3/1] rounded-[50%] bg-[#f9a8b4]/70 border-[6px] border-dashed border-white/70" />
          <div ref={mount} className="relative w-full h-[90%] max-w-[520px] cursor-grab active:cursor-grabbing" aria-label="Vista de tu explorador. Arrastra para girarlo." />
          <div className="absolute left-0 bottom-4 flex flex-col gap-2">
            <button onClick={() => spin(-0.6)} className="w-11 h-11 rounded-full bg-white/90 shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-600" aria-label="Girar a la izquierda"><RotateCcw className="w-5 h-5" /></button>
            <button onClick={() => spin(0.6)} className="w-11 h-11 rounded-full bg-white/90 shadow-[0_4px_0_#e6d3ab] flex items-center justify-center text-slate-600" aria-label="Girar a la derecha"><RotateCw className="w-5 h-5" /></button>
          </div>
          <div className="absolute right-2 bottom-6 flex items-end gap-1">
            <div className="relative mb-6 rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[0_4px_0_#e6d3ab] px-3 py-1.5 font-bold text-slate-700 text-sm max-w-[180px]">{say}</div>
            <SquirrelArt mood={changed ? 'happy' : 'idle'} size={70} />
          </div>
        </div>

        {/* Panel de ropa */}
        <div className="cozy-panel w-full lg:w-[520px] shortwide:w-[min(480px,56vw)] p-4 short:p-2 flex flex-col gap-3 short:gap-1.5 max-h-full overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => {
              const Icon = CAT_ICON[c.id];
              const on = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { playClickSound(); setCat(c.id); }}
                  aria-pressed={on}
                  title={c.name}
                  aria-label={c.name}
                  className={`w-12 h-12 short:w-9 short:h-9 rounded-2xl flex items-center justify-center transition-all ${on ? 'bg-amber-400 text-white shadow-[0_4px_0_#b45309]' : 'bg-white text-slate-500 shadow-[0_4px_0_#e6d3ab]'}`}
                >
                  {Icon ? <Icon className="w-6 h-6" /> : <ItemThumb cat="pants" id="x" color={on ? 0xffffff : 0x64748b} size={30} />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center short:hidden"><span className="cozy-ribbon !bg-sky-500 text-sm">{CATEGORIES.find((c) => c.id === cat)!.name}</span></div>

          <div className="cozy-inset p-3 short:p-2 grid grid-cols-3 sm:grid-cols-4 gap-2.5 overflow-y-auto min-h-0">
            {WARDROBE[cat].map((item) => {
              const locked = !!item.unlock && !isUnlocked(item.unlock);
              const selected = draft[cat] === item.id;
              const need = item.unlock ? ACHIEVEMENTS.find((a) => a.id === item.unlock) : null;
              return (
                <button
                  key={item.id}
                  disabled={locked}
                  onClick={() => {
                    playClickSound();
                    setDraft({ ...draft, [cat]: item.id });
                    setSay(item.name);
                  }}
                  title={locked ? `Gana el logro: ${need?.hidden ? '???' : need?.name}` : item.name}
                  aria-label={locked ? `${item.name}, bloqueado` : item.name}
                  aria-pressed={selected}
                  className={`cozy-tile relative aspect-square flex flex-col items-center justify-center gap-0.5 p-1 ${selected ? 'is-on' : ''} ${locked ? 'opacity-60' : ''}`}
                >
                  <ItemThumb cat={cat} id={item.id} color={item.color} size={48} />
                  <span className="text-[10px] font-black text-slate-600 leading-tight text-center">{item.name}</span>
                  {selected && (
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_3px_0_#047857]"><Check className="w-4 h-4" /></span>
                  )}
                  {locked && (
                    <span className="absolute inset-0 rounded-[15px] bg-slate-700/40 flex flex-col items-center justify-center text-white">
                      <Lock className="w-6 h-6" />
                      <span className="text-[9px] font-black px-1 leading-tight text-center">{need?.hidden ? 'Logro secreto' : need?.name}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-auto">
            <GlassButton size="lg" onClick={onClose} ariaLabel="Volver"><ArrowLeft className="w-5 h-5" /></GlassButton>
            <GlassButton
              size="lg"
              variant="emerald"
              className="flex-1"
              disabled={!changed}
              onClick={() => {
                playSuccessSound();
                sayText(LINES.saved);
                setSay(LINES.saved);
                onSave(draft);
              }}
            >
              <Check className="w-5 h-5" /> Guardar
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};
