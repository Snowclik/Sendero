/**
 * storageService.ts
 * Persistencia unificada 100% offline.
 * - Dentro de Tauri: archivo JSON nativo vía Rust (escritura atómica en la carpeta de datos de la app).
 * - En navegador: localStorage (siempre se escribe también como respaldo).
 */
import type { SkillId } from '../data/missionsData';
import { bkt } from '../game/brain';
import { CATEGORIES, DEFAULT_OUTFIT, WARDROBE, type Outfit } from '../data/wardrobe';

export type Mood = 'tranquilo' | 'inquieto' | 'ayuda';
export type AvatarIcon = 'Compass' | 'Shield' | 'BookOpen' | 'TreePine' | 'Sun' | 'Heart';

/** Evidencia de aprendizaje por habilidad. mastery sube solo al acertar al primer intento. */
export interface SkillProgress {
  attempts: number;
  correct: number;
  firstTry: number;
  mastery: number; // 0..3 estrellas
}

export interface Stats {
  chispaTaps: number;
  breaths: number;
  meters: number;
  replays: number;
  listens: number;
  missionsNoHint: number;
  missionsPerfect: number;
  outfits: number; // veces que guardó ropa nueva
  retos: number; // retos de Chispa superados
}

export interface StudentProfile {
  id: string;
  name: string; // Seudónimo, nunca nombre completo (privacidad de menores)
  avatarIcon: AvatarIcon;
  completedMissions: string[];
  currentSunEnergy: number; // Candado anti-adicción: 3 misiones por día
  lastPlayedDate: string; // YYYY-MM-DD local, para recargar soles
  lastActiveAt: string;
  emotionalStatus: Mood;
  duoModeCompleted: boolean;
  resilienceEarned: boolean;
  hintsUsed: number;
  skills: Partial<Record<SkillId, SkillProgress>>;
  know: Partial<Record<SkillId, number>>; // IA local: probabilidad de dominar cada habilidad (0-1)
  stats: Stats;
  achievementsSeen: string[]; // para anunciar solo los nuevos
  outfit: Outfit;
}

export interface SaveStore {
  version: 3;
  activeId: string | null;
  profiles: StudentProfile[];
}

// Clave con el nombre viejo a propósito: renombrarla borraría partidas guardadas.
const STORAGE_KEY = 'valle_resiliente_store_v2';
export const MAX_SUNS = 3;
// ponytail: límite diario apagado para probar todo. Para la entrega con niños, volver a true.
export const SUN_LIMIT_ON = false;

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EMPTY_STATS: Stats = { chispaTaps: 0, breaths: 0, meters: 0, replays: 0, listens: 0, missionsNoHint: 0, missionsPerfect: 0, outfits: 0, retos: 0 };

export function createProfile(name: string, avatarIcon: AvatarIcon): StudentProfile {
  return {
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim().slice(0, 16),
    avatarIcon,
    completedMissions: [],
    currentSunEnergy: MAX_SUNS,
    lastPlayedDate: todayKey(),
    lastActiveAt: new Date().toISOString(),
    emotionalStatus: 'tranquilo',
    duoModeCompleted: false,
    resilienceEarned: false,
    hintsUsed: 0,
    skills: {},
    know: {},
    stats: { ...EMPTY_STATS },
    achievementsSeen: [],
    outfit: { ...DEFAULT_OUTFIT },
  };
}

/** Ropa guardada válida: cualquier id desconocido vuelve al valor por defecto. */
function validOutfit(o: any): Outfit {
  const out = { ...DEFAULT_OUTFIT };
  for (const c of CATEGORIES) if (o && WARDROBE[c.id].some((i) => i.id === o[c.id])) out[c.id] = o[c.id];
  return out;
}

/** Completa campos faltantes (partidas viejas) y recarga los 3 soles si es un día nuevo. */
export function normalizeProfile(raw: any): StudentProfile {
  const base = createProfile(typeof raw?.name === 'string' ? raw.name : 'Explorador', raw?.avatarIcon || 'Compass');
  const p: StudentProfile = {
    ...base,
    id: typeof raw?.id === 'string' ? raw.id : base.id,
    completedMissions: Array.isArray(raw?.completedMissions) ? raw.completedMissions.filter((x: unknown) => typeof x === 'string') : [],
    currentSunEnergy: Number.isFinite(raw?.currentSunEnergy) ? Math.max(0, Math.min(MAX_SUNS, raw.currentSunEnergy)) : MAX_SUNS,
    lastPlayedDate: typeof raw?.lastPlayedDate === 'string' ? raw.lastPlayedDate : base.lastPlayedDate,
    lastActiveAt: typeof raw?.lastActiveAt === 'string' ? raw.lastActiveAt : base.lastActiveAt,
    emotionalStatus: ['tranquilo', 'inquieto', 'ayuda'].includes(raw?.emotionalStatus) ? raw.emotionalStatus : 'tranquilo',
    duoModeCompleted: !!raw?.duoModeCompleted,
    resilienceEarned: !!raw?.resilienceEarned,
    hintsUsed: Number(raw?.hintsUsed) || 0,
    skills: raw?.skills && typeof raw.skills === 'object' ? raw.skills : {},
    know: raw?.know && typeof raw.know === 'object' ? Object.fromEntries(Object.entries(raw.know).filter(([, v]) => Number.isFinite(v))) as StudentProfile['know'] : {},
    stats: { ...EMPTY_STATS, ...(raw?.stats || {}) },
    achievementsSeen: Array.isArray(raw?.achievementsSeen) ? raw.achievementsSeen : [],
    outfit: validOutfit(raw?.outfit),
  };
  if (p.lastPlayedDate !== todayKey()) {
    p.currentSunEnergy = MAX_SUNS;
    p.lastPlayedDate = todayKey();
  }
  return p;
}

const tauri = (): { invoke: (cmd: string, args?: object) => Promise<any> } | null =>
  typeof window !== 'undefined' ? (window as any).__TAURI__?.core ?? null : null;

export const isTauriEnvironment = () => tauri() !== null;

export async function loadStore(): Promise<SaveStore> {
  let raw: any = null;
  const t = tauri();
  if (t) {
    try {
      raw = await t.invoke('load_offline_progress');
    } catch (err) {
      console.warn('Rust no pudo leer el progreso, uso respaldo local:', err);
    }
  }
  if (!raw) {
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      raw = null;
    }
  }
  const profiles: StudentProfile[] = Array.isArray(raw?.profiles) ? raw.profiles.map(normalizeProfile) : [];
  const activeId = profiles.some((p) => p.id === raw?.activeId) ? raw.activeId : null;
  return { version: 3, activeId, profiles };
}

export async function saveStore(store: SaveStore): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('No se pudo guardar en localStorage:', e);
  }
  const t = tauri();
  if (t) {
    try {
      await t.invoke('save_offline_progress', { state: store });
    } catch (err) {
      console.warn('Rust no pudo guardar el progreso:', err);
    }
  }
}

/** Registra el resultado de un problema en sus habilidades. */
export function recordSkill(p: StudentProfile, skills: SkillId[], ok: boolean, firstTry: boolean, guess = 0.2): StudentProfile {
  const all = { ...p.skills };
  const know = { ...p.know };
  for (const skill of skills) know[skill] = bkt(know[skill] ?? 0.15, ok, guess);
  for (const skill of skills) {
    const s = all[skill] ?? { attempts: 0, correct: 0, firstTry: 0, mastery: 0 };
    all[skill] = {
      attempts: s.attempts + 1,
      correct: s.correct + (ok ? 1 : 0),
      firstTry: s.firstTry + (ok && firstTry ? 1 : 0),
      mastery: Math.min(3, s.mastery + (ok && firstTry ? 1 : 0)),
    };
  }
  return { ...p, skills: all, know };
}
