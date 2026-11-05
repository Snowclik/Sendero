/**
 * problems.ts — genera un problema nuevo en cada intento.
 * Tocar opciones hasta acertar deja de funcionar: si fallas, cambian los números o el texto.
 */
import type { MicroStep } from '../data/missionsData';

export type Params = Record<string, number | string>;

export interface Problem {
  params: Params;
  answer: number | string; // número o id de opción
  variant?: number; // lectura / par de mensajes
  order?: string[]; // orden en que se muestran opciones o tarjetas
  initial?: number[]; // válvulas
  max?: number; // casillas disponibles
}

const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const int = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = <T>(xs: T[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const otherIndex = (len: number, prev?: number) => {
  if (len < 2 || prev === undefined) return int(0, len - 1);
  let i = prev;
  while (i === prev) i = int(0, len - 1);
  return i;
};

/** Crea un problema distinto al anterior (si lo hay). */
export function makeProblem(step: MicroStep, prev?: Problem): Problem {
  for (let tries = 0; tries < 20; tries++) {
    const p = generate(step, prev);
    if (!prev || JSON.stringify(p.params) !== JSON.stringify(prev.params) || p.variant !== prev.variant) return p;
  }
  return generate(step, prev);
}

function generate(step: MicroStep, prev?: Problem): Problem {
  switch (step.type) {
    case 'counter': {
      if (step.data.gen === 'filters') {
        const per = pick([2, 3, 4, 5, 6]);
        const n = pick([2, 3, 4, 5].filter((k) => k * per <= 30));
        return { params: { per, target: per * n }, answer: n, max: 6 };
      }
      const per = pick([2, 3, 4, 6]); // el río mide 12 m (4 bloques del mapa)
      return { params: { per, target: 12 }, answer: 12 / per, max: 6 };
    }
    case 'share': {
      const each = int(3, 8);
      return { params: { total: each * 3 }, answer: each };
    }
    case 'balance': {
      const target = int(7, 12);
      let initial = [int(1, 5), int(1, 5), int(1, 5)];
      while (initial.reduce((a, b) => a + b, 0) === target) initial = [int(1, 5), int(1, 5), int(1, 5)];
      return { params: { target }, answer: target, initial };
    }
    case 'number': {
      if (step.data.gen === 'pillars') {
        const per = pick([20, 25, 30, 40, 50]);
        const n = int(2, 4);
        const weight = per * (n - 1) + pick([5, 10, 15].filter((r) => r < per));
        return { params: { per, weight }, answer: Math.ceil(weight / per) };
      }
      let w = int(2, 6);
      let h = int(1, 4);
      if (w === h) w = w === 6 ? 5 : w + 1;
      return { params: { w, h }, answer: 2 * (w + h) };
    }
    case 'read': {
      const variant = otherIndex(step.data.variants.length, prev?.variant);
      return { params: {}, answer: step.data.variants[variant].answer, variant, order: shuffle(step.data.options.map((o) => o.id)) };
    }
    case 'sift': {
      const variant = otherIndex(step.data.pairs.length, prev?.variant);
      const reliableFirst = Math.random() < 0.5; // el confiable no siempre está en el mismo lado
      return { params: {}, answer: reliableFirst ? 'A' : 'B', variant, order: reliableFirst ? ['reliable', 'rumor'] : ['rumor', 'reliable'] };
    }
    case 'order':
      return { params: {}, answer: step.data.correctOrder.join(','), order: shuffle(step.data.items.map((i) => i.id)) };
    case 'vocab': {
      const words = step.data.words.filter((w) => w.lang === 'es');
      const k = otherIndex(words.length, prev?.variant);
      const correct = words[k];
      const wrong = shuffle(words.filter((w) => w !== correct)).slice(0, 2);
      return { params: { word: correct.word }, answer: correct.meaning, variant: k, order: shuffle([correct, ...wrong].map((w) => w.meaning)) };
    }
  }
}

/** Rellena una plantilla: "Cada filtro da {per} litros" -> "Cada filtro da 6 litros". */
export const fill = (tpl: string, params: Params) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));

/**
 * Parte una plantilla en fragmentos fijos + valores, para la voz pregrabada:
 * "Cada filtro da {per} litros." -> ["Cada filtro da", 6, "litros."]
 */
export function speechParts(tpl: string, params: Params): (string | number)[] {
  const out: (string | number)[] = [];
  tpl.split(/(\{\w+\})/).forEach((chunk) => {
    const m = chunk.match(/^\{(\w+)\}$/);
    if (m) out.push(params[m[1]] ?? '');
    else if (/[\p{L}\p{N}]/u.test(chunk)) out.push(cleanFragment(chunk));
  });
  return out.filter((x) => x !== '');
}

/** Quita espacios y puntuación suelta al inicio (". Le faltan" -> "Le faltan"). */
export const cleanFragment = (s: string) => s.replace(/^[\s.,;:]+/, '').trim();

/** Fragmentos fijos de una plantilla (para generar los audios). */
export const templateFragments = (tpl: string) =>
  tpl.split(/\{\w+\}/).map(cleanFragment).filter((s) => /[\p{L}\p{N}]/u.test(s));
