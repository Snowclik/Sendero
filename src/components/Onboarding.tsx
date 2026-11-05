import type { FunctionalComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft, BookOpen, Compass, Heart, Lock, Plus, Shield, Sun, TreePine } from 'lucide-preact';
import { GlassButton } from './ui/GlassButton';
import { SquirrelArt } from './ui/Art';
import { playClickSound, sayText } from '../services/soundService';
import { LINES } from '../data/lines';
import type { AvatarIcon, StudentProfile } from '../services/storageService';

export const AVATARS: Record<AvatarIcon, any> = { Compass, Shield, BookOpen, TreePine, Sun, Heart };
const AVATAR_TONE: Record<AvatarIcon, string> = {
  Compass: 'bg-sky-400', Shield: 'bg-indigo-400', BookOpen: 'bg-emerald-500', TreePine: 'bg-teal-500', Sun: 'bg-amber-400', Heart: 'bg-rose-400',
};

const Stage = ({ children, say }: { children: any; say: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-100/50 backdrop-blur-sm overflow-y-auto">
    <div className="w-full max-w-xl my-6 flex flex-col gap-3 animate-fadeIn">
      <div className="flex items-end gap-2 px-2">
        <SquirrelArt mood="happy" size={86} />
        <div className="relative mb-4 rounded-2xl bg-white border-[3px] border-[#f1e4c6] shadow-[0_4px_0_#e6d3ab] px-4 py-2.5">
          <span className="absolute -left-2 bottom-3 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-[#f1e4c6] rotate-45" />
          <p className="font-bold text-slate-700">{say}</p>
        </div>
      </div>
      <div className="cozy-panel p-5 sm:p-6">{children}</div>
    </div>
  </div>
);

export const ProfileScreen: FunctionalComponent<{
  profiles: StudentProfile[];
  onSelect: (id: string) => void;
  onCreate: (name: string, avatar: AvatarIcon) => void;
}> = ({ profiles, onSelect, onCreate }) => {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarIcon>('Compass');
  const valid = name.trim().length >= 2;
  const Preview = AVATARS[avatar];
  useEffect(() => {
    sayText(creating ? LINES.hello : LINES.whoPlays);
  }, [creating]);

  return (
    <Stage say={creating ? LINES.hello : LINES.whoPlays}>
      <div className="flex justify-center -mt-1 mb-4"><span className="cozy-ribbon text-lg">Sendero</span></div>

      {!creating ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profiles.map((p) => {
            const Icon = AVATARS[p.avatarIcon] ?? Compass;
            return (
              <button key={p.id} onClick={() => { playClickSound(); onSelect(p.id); }} className="cozy-tile p-3 flex flex-col items-center gap-2">
                <span className={`w-16 h-16 rounded-full border-4 border-white shadow-[0_4px_0_rgba(0,0,0,.12)] flex items-center justify-center text-white ${AVATAR_TONE[p.avatarIcon] ?? 'bg-sky-400'}`}>
                  <Icon className="w-8 h-8" />
                </span>
                <span className="font-black text-slate-800 truncate max-w-full">{p.name}</span>
                <span className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < p.completedMissions.length ? 'bg-emerald-500' : 'bg-[#eadcbc]'}`} />)}
                </span>
              </button>
            );
          })}
          <button onClick={() => setCreating(true)} className="rounded-[18px] border-[3px] border-dashed border-[#d9c79f] p-3 flex flex-col items-center justify-center gap-2 text-[#b49a66] hover:bg-white/60 font-black">
            <Plus className="w-10 h-10" /> Nuevo
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (valid) onCreate(name, avatar); }} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className={`w-20 h-20 shrink-0 rounded-full border-4 border-white shadow-[0_5px_0_rgba(0,0,0,.12)] flex items-center justify-center text-white ${AVATAR_TONE[avatar]}`}>
              <Preview className="w-10 h-10" />
            </span>
            <label className="flex-1 flex flex-col gap-1">
              <input
                autoFocus
                maxLength={16}
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="Tu apodo"
                aria-label="Tu apodo de explorador"
                className="px-4 py-3.5 rounded-2xl border-[3px] border-[#f1e4c6] bg-white text-lg font-bold text-slate-800 shadow-[inset_0_3px_0_rgba(146,112,52,.08)] focus:outline-none focus:border-sky-300"
              />
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Solo un apodo, no tu nombre.
              </span>
            </label>
          </div>
          <div className="cozy-inset p-3 grid grid-cols-6 gap-2">
            {(Object.keys(AVATARS) as AvatarIcon[]).map((k) => {
              const Icon = AVATARS[k];
              return (
                <button type="button" key={k} onClick={() => { playClickSound(); setAvatar(k); }} aria-pressed={avatar === k} aria-label={k} className={`cozy-tile aspect-square flex items-center justify-center ${avatar === k ? 'is-on' : ''}`}>
                  <Icon className={`w-7 h-7 ${avatar === k ? 'text-sky-600' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {profiles.length > 0 && (
              <GlassButton size="lg" onClick={() => setCreating(false)} ariaLabel="Volver"><ArrowLeft className="w-5 h-5" /></GlassButton>
            )}
            <GlassButton size="xl" variant="primary" type="submit" disabled={!valid} className="flex-1">
              ¡A jugar!
            </GlassButton>
          </div>
        </form>
      )}
    </Stage>
  );
};
