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
export function makeProblem(step: MicroStep, prev?: Problem, tier = 1): Problem {
  for (let tries = 0; tries < 20; tries++) {
    const p = generate(step, prev, tier);
    if (!prev || JSON.stringify(p.params) !== JSON.stringify(prev.params) || p.variant !== prev.variant) return p;
  }
  return generate(step, prev, tier);
}

/** 1.25 -> "1.25" (siempre 2 decimales, como el dinero). */
const money = (cents: number) => (cents / 100).toFixed(2);

/** Nombres de fracciones para leerlas en voz alta (y que los niños las aprendan escritas). */
export const FRACTION_NAMES: Record<string, string> = Object.fromEntries(
  [2, 3, 4, 5, 6, 8, 10].flatMap((den) =>
    Array.from({ length: den - 1 }, (_, i) => {
      const num = i + 1;
      const d = { 2: 'medio', 3: 'tercio', 4: 'cuarto', 5: 'quinto', 6: 'sexto', 8: 'octavo', 10: 'décimo' }[den]!;
      const n = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'][num];
      return [`${num}/${den}`, num === 1 ? `${n} ${d}` : `${n} ${d}s`];
    })
  )
);

/** Elige según el nivel (1-4) que la IA local calculó para esa habilidad. */
const byTier = <T>(tier: number, xs: T[]) => xs[Math.max(0, Math.min(xs.length, tier) - 1)];

function generate(step: MicroStep, prev: Problem | undefined, tier: number): Problem {
  switch (step.type) {
    case 'counter': {
      // Mochila: botellas de {per} litros hasta {target} litros
      const per = pick(byTier(tier, [[1, 2, 3], [2, 3, 4, 5], [4, 5, 6, 7], [6, 7, 8, 9]]));
      const n = tier === 1 ? int(2, 5) : int(3, 6);
      return { params: { per, target: per * n }, answer: n, max: 6 };
    }
    case 'share': {
      const [a, b] = byTier(tier, [[3, 8], [6, 12], [10, 20], [15, 33]]);
      const each = int(a, b);
      return { params: { total: each * 3 }, answer: each };
    }
    case 'number': {
      if (step.data.gen === 'rising') {
        const per = pick(byTier(tier, [[5, 10], [2, 3, 4, 6], [6, 7, 8, 9], [12, 15, 25]]));
        const [a, b] = byTier(tier, [[2, 6], [3, 7], [4, 9], [5, 9]]);
        const n = int(a, b);
        return { params: { per, target: per * n }, answer: n };
      }
      if (step.data.gen === 'fraction') {
        // Fracción de una cantidad: total divisible entre el denominador (4.° grado)
        const den = pick(byTier(tier, [[2, 4], [3, 4, 5], [3, 5, 6, 8], [6, 8, 10]]));
        const num = int(1, den - 1);
        const k = int(...byTier(tier, [[2, 4], [2, 6], [3, 8], [4, 10]]) as [number, number]);
        const total = den * k;
        return { params: { total, num, den, fname: FRACTION_NAMES[`${num}/${den}`] ?? `${num}/${den}` }, answer: k * num };
      }
      if (step.data.gen === 'money') {
        // Decimales con dinero (5.° grado): precio en balboas × cantidad
        const cents = pick(byTier(tier, [[25, 50, 75], [25, 50, 75, 125, 150], [35, 45, 65, 85, 120, 175], [95, 125, 235, 340, 415]]));
        const n = int(...byTier(tier, [[2, 4], [2, 5], [3, 6], [4, 9]]) as [number, number]);
        return { params: { price: money(cents), n, cents }, answer: money(cents * n) };
      }
      if (step.data.gen === 'perimeter' || step.data.gen === 'area') {
        const r = byTier(tier, step.data.gen === 'area' ? [[2, 5], [3, 8], [4, 10], [6, 12]] : [[3, 9], [5, 15], [8, 25], [12, 40]]) as [number, number];
        const a = int(...r);
        let b = int(...r);
        if (b === a) b = a > r[0] ? a - 1 : a + 1; // rectángulo, no cuadrado
        return { params: { a: Math.max(a, b), b: Math.min(a, b) }, answer: step.data.gen === 'area' ? a * b : 2 * (a + b) };
      }
      // Tormenta: cada 3 segundos entre rayo y trueno = 1 km
      const [a, b] = byTier(tier, [[1, 5], [2, 7], [4, 9], [6, 10]]);
      const km = int(a, b);
      return { params: { s: km * 3 }, answer: km };
    }
    case 'read': {
      const variant = otherIndex(step.data.variants.length, prev?.variant);
      const v = step.data.variants[variant];
      return { params: {}, answer: v.answer, variant, order: shuffle((v.options ?? step.data.options).map((o) => o.id)) };
    }
    case 'sift': {
      const variant = otherIndex(step.data.pairs.length, prev?.variant);
      const reliableFirst = Math.random() < 0.5; // el confiable no siempre está en el mismo lado
      return { params: {}, answer: reliableFirst ? 'A' : 'B', variant, order: reliableFirst ? ['reliable', 'rumor'] : ['rumor', 'reliable'] };
    }
    case 'order':
      return { params: {}, answer: step.data.correctOrder.join(','), order: shuffle(step.data.items.map((i) => i.id)) };
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
