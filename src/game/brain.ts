/**
 * brain.ts — la IA local de Sendero (corre en el equipo del niño, sin internet ni nube).
 *
 * 1. Rastreo bayesiano del conocimiento (BKT, Corbett y Anderson 1995; base de los tutores inteligentes):
 *    tras cada respuesta estima la probabilidad de que el niño YA DOMINE cada habilidad.
 *    Considera que puede adivinar (más fácil con opciones que con el teclado) o equivocarse por descuido.
 * 2. Dificultad adaptativa: cada habilidad tiene su propio nivel (1-4) según esa probabilidad.
 *    Si acierta, los números crecen; si falla, bajan. Cada niño avanza a su ritmo.
 * 3. Retos de Chispa sin fin: arma misiones nuevas con lo que MÁS le cuesta a ese niño.
 *    Nunca se acaba: siempre hay algo que reforzar y los problemas se generan cada vez.
 */
import { MISSIONS, SKILLS, type MicroStep, type Mission, type SkillId, type Subject } from '../data/missionsData';
import type { StudentProfile } from '../services/storageService';

const P_INIT = 0.15; // probabilidad inicial de dominar algo
const P_LEARN = 0.2; // probabilidad de aprenderlo en cada práctica
const P_SLIP = 0.1; // sabe, pero se equivocó por descuido
/** Probabilidad de acertar adivinando, según el tipo de reto. */
export const GUESS: Record<MicroStep['type'], number> = { counter: 0.1, share: 0.05, number: 0.05, read: 0.33, sift: 0.5, order: 0.17 };

/** Actualiza la estimación de dominio con una respuesta (BKT). */
export function bkt(p: number, ok: boolean, guess: number): number {
  const post = ok ? (p * (1 - P_SLIP)) / (p * (1 - P_SLIP) + (1 - p) * guess) : (p * P_SLIP) / (p * P_SLIP + (1 - p) * (1 - guess));
  return Math.min(0.99, post + (1 - post) * P_LEARN);
}

export const knowOf = (pr: StudentProfile, k: SkillId) => pr.know?.[k] ?? P_INIT;

/** Nivel de dificultad (1-4) para un paso: lo marca la habilidad más floja que practica. */
export const TIER_NAME = ['', 'Fácil', 'Medio', 'Difícil', 'Experto'];
export const tierFromKnow = (k: number) => (k < 0.45 ? 1 : k < 0.7 ? 2 : k < 0.88 ? 3 : 4);
export const tierOf = (pr: StudentProfile, step: MicroStep) => tierFromKnow(Math.min(...step.skills.map((s) => knowOf(pr, s))));

/** Nivel del jugador: crece con cada acierto, nunca baja. */
export function playerLevel(pr: StudentProfile) {
  const xp = Object.values(pr.skills).reduce((a, s) => a + (s?.correct ?? 0), 0);
  const level = 1 + Math.floor(xp / 6);
  return { level, progress: (xp % 6) / 6 };
}

const subjectOf = (k: SkillId): Subject => SKILLS.find((s) => s.id === k)!.subject;
const MATH = new Set<MicroStep['type']>(['counter', 'share', 'number']);

/** Habilidades ordenadas de la más floja a la más fuerte (solo matemática y español). */
export function weakest(pr: StudentProfile) {
  return SKILLS.filter((s) => s.subject !== 'prevencion').sort((a, b) => knowOf(pr, a.id) - knowOf(pr, b.id));
}

export const RETO_ID = 'reto-chispa';
export const isReto = (m: Mission) => (m.id as string) === RETO_ID;

/** Arma un reto personalizado: 1 lectura + 1 de matemática + 1 de lo que más le cueste. */
export function planReto(pr: StudentProfile): { mission: Mission; focus: string } {
  const pool = MISSIONS.flatMap((m) => m.steps.map((s) => ({ s, m })));
  const need = (x: { s: MicroStep }) => Math.min(...x.s.skills.filter((k) => subjectOf(k) !== 'prevencion').map((k) => knowOf(pr, k)), 1) + Math.random() * 0.15; // algo de variedad
  const best = (xs: typeof pool) => [...xs].sort((a, b) => need(a) - need(b))[0];
  const lang = best(pool.filter((x) => !MATH.has(x.s.type)));
  const math = best(pool.filter((x) => MATH.has(x.s.type)));
  const third = best(pool.filter((x) => x !== lang && x !== math && x.s.type !== lang.s.type && x.s.type !== math.s.type));
  const focus = weakest(pr)[0];
  const clean = (s: MicroStep): MicroStep => ({ ...s, duoRole: undefined });
  return {
    focus: focus.name,
    mission: {
      ...lang.m,
      id: RETO_ID as Mission['id'],
      stationName: 'Reto de Chispa',
      title: `Reto ${pr.stats.retos + 1}`,
      disaster: 'Reto',
      duoRoles: undefined,
      shortStory: ['¡Reto nuevo! Lo armé pensando en ti.', `Hoy practicamos: ${focus.name}.`],
      steps: [clean(lang.s), clean(math.s), clean(third.s)],
    },
  };
}
