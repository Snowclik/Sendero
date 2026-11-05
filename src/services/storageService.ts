/**
 * storageService.ts
 * Persistencia unificada 100% offline.
 * - Dentro de Tauri: archivo JSON nativo vía Rust (escritura atómica en la carpeta de datos de la app).
 * - En navegador de desarrollo: localStorage (siempre se escribe también como respaldo).
 */

export interface TalentScores {
  perseverance: number;
  criticalThinking: number;
  collaboration: number;
  emergencyCalm: number;
  mathProblemSolving: number;
  readingComprehension: number;
}

export type Mood = 'tranquilo' | 'inquieto' | 'ayuda';
export type AvatarIcon = 'Compass' | 'Shield' | 'BookOpen' | 'TreePine' | 'Sun' | 'Heart';

export interface StudentProfile {
  id: string;
  name: string; // Seudónimo, nunca nombre completo (privacidad de menores)
  avatarIcon: AvatarIcon;
  completedMissions: string[];
  currentSunEnergy: number; // Candado anti-adicción: 3 misiones por día
  lastPlayedDate: string; // YYYY-MM-DD local, para recargar soles
  lastActiveAt: string; // ISO, para el semáforo de 48 h del maestro
  emotionalStatus: Mood;
  talentScores: TalentScores; // Crecen solo con evidencia (0 al inicio)
  duoModeCompleted: boolean;
  resilienceEarned: boolean; // Terminó una misión después de equivocarse
  hintsUsed: number;
  struggles: { math: number; reading: number }; // Pasos que necesitaron 3+ intentos
}

export interface SaveStore {
  version: 2;
  activeId: string | null;
  profiles: StudentProfile[];
}

const STORAGE_KEY = 'valle_resiliente_store_v2'; // nombre viejo a propósito: renombrarla borraría partidas guardadas
export const MAX_SUNS = 3;

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
    talentScores: {
      perseverance: 0,
      criticalThinking: 0,
      collaboration: 0,
      emergencyCalm: 0,
      mathProblemSolving: 0,
      readingComprehension: 0,
    },
    duoModeCompleted: false,
    resilienceEarned: false,
    hintsUsed: 0,
    struggles: { math: 0, reading: 0 },
  };
}

/** Completa campos faltantes (partidas viejas) y recarga los 3 soles si es un día nuevo. */
export function normalizeProfile(raw: Partial<StudentProfile>): StudentProfile {
  const base = createProfile(raw.name || 'Explorador', (raw.avatarIcon as AvatarIcon) || 'Compass');
  const p: StudentProfile = {
    ...base,
    ...raw,
    talentScores: { ...base.talentScores, ...(raw.talentScores || {}) },
    struggles: { ...base.struggles, ...(raw.struggles || {}) },
  } as StudentProfile;
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
  const profiles = Array.isArray(raw?.profiles) ? raw.profiles.map(normalizeProfile) : [];
  const activeId = profiles.some((p: StudentProfile) => p.id === raw?.activeId) ? raw.activeId : null;
  return { version: 2, activeId, profiles };
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

// ---------------------------------------------------------------------------
// Pasaporte escolar: código compacto + sello de integridad (cabe en un QR)
// ponytail: el sello es FNV-1a, detecta códigos dañados o mal copiados, NO falsificaciones.
// Para firma real: clave del maestro + Ed25519 en Rust (crate ed25519-dalek).
// ---------------------------------------------------------------------------

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

const toB64 = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64 = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function encodePassport(p: StudentProfile): { code: string; seal: string } {
  const t = p.talentScores;
  const body = toB64(
    JSON.stringify({
      n: p.name,
      a: p.avatarIcon,
      m: p.completedMissions,
      t: [t.perseverance, t.criticalThinking, t.collaboration, t.emergencyCalm, t.mathProblemSolving, t.readingComprehension],
      d: p.duoModeCompleted ? 1 : 0,
      r: p.resilienceEarned ? 1 : 0,
      e: p.emotionalStatus,
      s: [p.struggles.math, p.struggles.reading],
      h: p.hintsUsed,
      at: p.lastActiveAt,
    })
  );
  const seal = fnv1a(body);
  return { code: `VR1.${body}.${seal}`, seal };
}

export function decodePassport(code: string): StudentProfile {
  const parts = code.trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'VR1') throw new Error('No es un pasaporte de Sendero.');
  if (fnv1a(parts[1]) !== parts[2]) throw new Error('El código está dañado o incompleto. Pide que lo copien de nuevo.');
  const j = JSON.parse(fromB64(parts[1]));
  const p = normalizeProfile({
    name: j.n,
    avatarIcon: j.a,
    completedMissions: j.m,
    talentScores: {
      perseverance: j.t[0],
      criticalThinking: j.t[1],
      collaboration: j.t[2],
      emergencyCalm: j.t[3],
      mathProblemSolving: j.t[4],
      readingComprehension: j.t[5],
    },
    duoModeCompleted: !!j.d,
    resilienceEarned: !!j.r,
    emotionalStatus: j.e,
    struggles: { math: j.s[0], reading: j.s[1] },
    hintsUsed: j.h,
  });
  p.id = `imp-${parts[2]}`;
  p.lastActiveAt = j.at || p.lastActiveAt; // conservar la última actividad real del alumno
  return p;
}

/** Guarda el pasaporte como .txt en Documentos (solo app nativa). */
export async function exportPassportFile(p: StudentProfile): Promise<string | null> {
  const t = tauri();
  if (!t) return null;
  return t.invoke('export_signed_passport', { studentName: p.name, code: encodePassport(p).code });
}
