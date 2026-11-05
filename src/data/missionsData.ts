/**
 * missionsData.ts
 * Contenido de Sendero en JSON puro (portable a otro motor, p. ej. Roblox).
 *
 * Anti "tocar al azar":
 * - Los textos son plantillas con {parametros}: cada intento genera números nuevos (ver game/problems.ts).
 * - Las lecturas tienen varias versiones: la respuesta depende de lo que dice el texto ese día.
 * Textos cortos a propósito (TDAH): instrucción <= 10 palabras, pistas <= 12.
 */

export type IconKey =
  | 'Bird' | 'CloudRain' | 'Leaf' | 'Backpack' | 'Users' | 'Footprints' | 'Droplet' | 'Sprout' | 'Mountain' | 'Home'
  | 'School' | 'Sun' | 'Wind' | 'Waves' | 'Shovel';

export interface TextBlock {
  text: string;
  icon?: IconKey;
}

export interface SocraticHints {
  level1_question: string;
  level2_visual: string;
  level3_analogy: string;
}

export type SkillId =
  | 'multiplicar' | 'repartir' | 'sumar' | 'medir' | 'perimetro'
  | 'avisos' | 'rumores' | 'secuencias' | 'causa' | 'palabras';

export const SKILLS: { id: SkillId; name: string; subject: 'matematica' | 'espanol' }[] = [
  { id: 'multiplicar', name: 'Multiplicar', subject: 'matematica' },
  { id: 'repartir', name: 'Repartir', subject: 'matematica' },
  { id: 'sumar', name: 'Sumar', subject: 'matematica' },
  { id: 'medir', name: 'Medir', subject: 'matematica' },
  { id: 'perimetro', name: 'Perímetro', subject: 'matematica' },
  { id: 'avisos', name: 'Entender avisos', subject: 'espanol' },
  { id: 'rumores', name: 'Detectar rumores', subject: 'espanol' },
  { id: 'secuencias', name: 'Ordenar pasos', subject: 'espanol' },
  { id: 'causa', name: 'Causa y efecto', subject: 'espanol' },
  { id: 'palabras', name: 'Palabras nuevas', subject: 'espanol' },
];

interface StepBase {
  title: string;
  instruction: string; // plantilla: {per}, {target}...
  highlightWords?: string[]; // plantillas
  skill: SkillId;
  duoRole?: 'A' | 'B' | 'AB';
  socraticHints: SocraticHints; // plantillas
}

export interface ReadOption {
  id: string;
  text: string;
  icon: IconKey;
}

export interface SiftMessage {
  content: string;
  author: string;
  date: string;
  tone: string;
}

export type MicroStep =
  | (StepBase & { type: 'counter'; data: { gen: 'filters' | 'beams'; item: [string, string]; unit: string } })
  | (StepBase & { type: 'share'; data: { unit: string; sectors: string[] } })
  | (StepBase & { type: 'balance'; data: { valves: string[] } })
  | (StepBase & { type: 'number'; data: { gen: 'pillars' | 'perimeter'; unit: string } })
  | (StepBase & {
      type: 'read';
      data: { source: string; badge: string; options: ReadOption[]; variants: { blocks: TextBlock[]; question: string; answer: string }[] };
    })
  | (StepBase & { type: 'sift'; data: { pairs: { reliable: SiftMessage; rumor: SiftMessage }[] } })
  | (StepBase & { type: 'order'; data: { items: ReadOption[]; correctOrder: string[] } })
  | (StepBase & { type: 'vocab'; data: { words: { language: string; word: string; meaning: string; say: string; lang: 'es' | 'en' }[] } });

export type MissionId = 'mision-1-agua' | 'mision-2-rumor' | 'mision-3-puente' | 'mision-4-bosque';

export interface Mission {
  id: MissionId;
  stationName: string;
  title: string;
  subject: 'Matemáticas' | 'Lectura Comprensiva';
  shortStory: [string, string];
  squirrelCall: string;
  duoRoles?: { A: string; B: string };
  steps: [MicroStep, MicroStep, MicroStep];
  offScreenChallenge: { actionPrompt: string; breathingSeconds: number; companionPrompt: string };
}

export const MISSIONS: Mission[] = [
  // ==========================================================================
  // MISIÓN 1 · Planta de agua (multiplicar, repartir, sumar)
  // ==========================================================================
  {
    id: 'mision-1-agua',
    stationName: 'Planta de Agua',
    title: 'La Planta Potabilizadora del Río',
    subject: 'Matemáticas',
    shortStory: ['El río creció con la lluvia.', 'El albergue necesita agua limpia.'],
    squirrelCall: '¡El agua está sucia! Vamos a la planta.',
    steps: [
      {
        type: 'counter',
        skill: 'multiplicar',
        title: 'Enciende los filtros',
        instruction: 'Cada filtro da {per} litros. Necesitamos {target} litros.',
        highlightWords: ['{per} litros', '{target} litros'],
        data: { gen: 'filters', item: ['filtro', 'filtros'], unit: 'litros' },
        socraticHints: {
          level1_question: '¿Cuántos litros dan 2 filtros de {per}?',
          level2_visual: 'Cuenta de {per} en {per} hasta llegar a {target}.',
          level3_analogy: 'Una caja trae {per} huevos. ¿Cuántas cajas para {target}?',
        },
      },
      {
        type: 'share',
        skill: 'repartir',
        title: 'Reparte el agua',
        instruction: 'Hay {total} litros. Da lo mismo a los 3 lugares.',
        highlightWords: ['{total} litros', 'lo mismo'],
        data: { unit: 'litros', sectors: ['Salud', 'Familias', 'Cocina'] },
        socraticHints: {
          level1_question: '¿Qué número, 3 veces, da {total}?',
          level2_visual: 'Haz 3 montones iguales con {total} gotas.',
          level3_analogy: '6 dulces para 3 amigos: 2 cada uno. ¿Y {total}?',
        },
      },
      {
        type: 'balance',
        skill: 'sumar',
        title: 'Ajusta la presión',
        instruction: 'Las 3 válvulas deben sumar {target}.',
        highlightWords: ['sumar {target}'],
        data: { valves: ['Norte', 'Centro', 'Sur'] },
        socraticHints: {
          level1_question: '¿Cuánto suman ahora? ¿Cuánto falta?',
          level2_visual: 'Suma de dos en dos: primero dos válvulas, luego la otra.',
          level3_analogy: 'Como una balanza: pon o quita poquito.',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Revisa que ningún grifo gotee.',
      breathingSeconds: 15,
      companionPrompt: '¡Bien! Cuéntale a alguien cómo cuidar el agua.',
    },
  },

  // ==========================================================================
  // MISIÓN 2 · Tablón del pueblo (avisos, rumores, secuencias)
  // ==========================================================================
  {
    id: 'mision-2-rumor',
    stationName: 'Tablón del Pueblo',
    title: 'El Rumor de la Quebrada',
    subject: 'Lectura Comprensiva',
    shortStory: ['Llegaron mensajes al pueblo.', '¿Cuál dice la verdad?'],
    squirrelCall: '¡Hay mensajes nuevos en el tablón!',
    steps: [
      {
        type: 'read',
        skill: 'avisos',
        title: 'Lee el aviso',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué dice la segunda frase?',
          level2_visual: 'Busca la palabra que dice a dónde ir.',
          level3_analogy: 'Un aviso es como un mapa: dice a dónde ir.',
        },
        data: {
          source: 'Protección Civil',
          badge: 'Oficial',
          options: [
            { id: 'alta', text: 'Ir por la Ruta Alta', icon: 'Mountain' },
            { id: 'albergue', text: 'Quedarse en el albergue', icon: 'Home' },
            { id: 'centro', text: 'Ir al Centro Comunal', icon: 'School' },
            { id: 'puente', text: 'Cruzar el puente', icon: 'Waves' },
          ],
          variants: [
            {
              blocks: [
                { text: 'La quebrada subió.', icon: 'CloudRain' },
                { text: 'Caminen por la Ruta Alta, con calma.', icon: 'Mountain' },
              ],
              question: '¿Qué pide el aviso?',
              answer: 'alta',
            },
            {
              blocks: [
                { text: 'Viene una tormenta fuerte.', icon: 'Wind' },
                { text: 'Nadie salga del albergue hoy.', icon: 'Home' },
              ],
              question: '¿Qué pide el aviso?',
              answer: 'albergue',
            },
            {
              blocks: [
                { text: 'La escuela está mojada.', icon: 'CloudRain' },
                { text: 'Las clases son en el Centro Comunal.', icon: 'School' },
              ],
              question: '¿A dónde van los niños?',
              answer: 'centro',
            },
          ],
        },
      },
      {
        type: 'sift',
        skill: 'rumores',
        title: 'Usa la lupa',
        instruction: 'Mira quién escribió cada mensaje.',
        highlightWords: ['quién escribió'],
        socraticHints: {
          level1_question: '¿Cuál dice quién lo escribió?',
          level2_visual: 'Los rumores gritan y dicen "pásalo".',
          level3_analogy: '¿Crees a un grito sin nombre o a tu maestra?',
        },
        data: {
          pairs: [
            {
              rumor: { content: '¡¡Todo se inunda YA!! Pásalo a todos.', author: 'Sin firma', date: 'Sin fecha', tone: 'Asusta' },
              reliable: { content: 'Clases en el Centro Comunal. Lleven mochila.', author: 'Comité Escolar', date: 'Hoy, 9:00', tone: 'Tranquilo' },
            },
            {
              rumor: { content: '¡¡El puente se cayó!! Nadie sabe más. Reenvía.', author: 'Sin firma', date: 'Sin fecha', tone: 'Asusta' },
              reliable: { content: 'El puente está cerrado. Usen la Ruta Alta.', author: 'Protección Civil', date: 'Hoy, 7:30', tone: 'Tranquilo' },
            },
            {
              rumor: { content: '¡¡No tomen agua nunca más!! Lo dijo alguien.', author: 'Sin firma', date: 'Sin fecha', tone: 'Asusta' },
              reliable: { content: 'Hiervan el agua antes de tomarla.', author: 'Centro de Salud', date: 'Hoy, 8:00', tone: 'Tranquilo' },
            },
          ],
        },
      },
      {
        type: 'order',
        skill: 'secuencias',
        title: 'Plan de seguridad',
        instruction: 'Toca los pasos en orden.',
        socraticHints: {
          level1_question: '¿Qué guardas antes de salir?',
          level2_visual: 'Primero preparo, luego reúno, al final camino.',
          level3_analogy: 'Para ir a la escuela: mochila, adiós, salir.',
        },
        data: {
          items: [
            { id: 'guardar', text: 'Guardar cuadernos', icon: 'Backpack' },
            { id: 'avisar', text: 'Reunir a la familia', icon: 'Users' },
            { id: 'caminar', text: 'Caminar juntos', icon: 'Footprints' },
          ],
          correctOrder: ['guardar', 'avisar', 'caminar'],
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Escribe el nombre de tu maestro en un papel.',
      breathingSeconds: 15,
      companionPrompt: '¡Gran detective! Pregunta dónde están los documentos.',
    },
  },

  // ==========================================================================
  // MISIÓN 3 · Puente (medir, multiplicar, perímetro) en Modo Dúo
  // ==========================================================================
  {
    id: 'mision-3-puente',
    stationName: 'Puente de la Escuela',
    title: 'El Puente de la Escuela',
    subject: 'Matemáticas',
    shortStory: ['El puente tiene tablas sueltas.', '¡Vamos a arreglarlo!'],
    squirrelCall: '¡El puente está roto! Hay que arreglarlo.',
    duoRoles: { A: 'Explorador A · Medidas', B: 'Explorador B · Resistencia' },
    steps: [
      {
        type: 'counter',
        skill: 'medir',
        duoRole: 'A',
        title: 'Pon las vigas',
        instruction: 'El río mide {target} metros. Cada viga, {per} metros.',
        highlightWords: ['{target} metros', '{per} metros'],
        data: { gen: 'beams', item: ['viga', 'vigas'], unit: 'metros' },
        socraticHints: {
          level1_question: '¿Cuántas veces cabe {per} en {target}?',
          level2_visual: 'Salta de {per} en {per} hasta {target}.',
          level3_analogy: '¿Cuántas piezas de {per} hacen {target}?',
        },
      },
      {
        type: 'number',
        skill: 'multiplicar',
        duoRole: 'B',
        title: 'Pilares fuertes',
        instruction: 'Un pilar aguanta {per} kilos. Cruzan {weight} kilos.',
        highlightWords: ['{per} kilos', '{weight} kilos'],
        data: { gen: 'pillars', unit: 'pilares' },
        socraticHints: {
          level1_question: '¿Cuánto aguantan 2 pilares de {per}?',
          level2_visual: 'Suma {per} varias veces hasta pasar {weight}.',
          level3_analogy: 'Bolsas de {per} mandarinas. ¿Cuántas para {weight}?',
        },
      },
      {
        type: 'number',
        skill: 'perimetro',
        duoRole: 'AB',
        title: 'La baranda',
        instruction: 'La baranda va por todo el borde.',
        highlightWords: ['todo el borde'],
        data: { gen: 'perimeter', unit: 'metros' },
        socraticHints: {
          level1_question: '¿Cuántos lados tiene el rectángulo?',
          level2_visual: 'Suma los 4 lados: {w}, {h}, {w} y {h}.',
          level3_analogy: 'Al rodear una mesa pasas por 4 lados.',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Con alguien, formen un arco con las manos.',
      breathingSeconds: 15,
      companionPrompt: '¡En equipo todo es más fácil!',
    },
  },

  // ==========================================================================
  // MISIÓN 4 · Cabaña de la abuela (causa y efecto, palabras, avisos)
  // ==========================================================================
  {
    id: 'mision-4-bosque',
    stationName: 'Cabaña de la Abuela',
    title: 'La Bitácora del Bosque y la Abuela',
    subject: 'Lectura Comprensiva',
    shortStory: ['La abuela lee el clima en la naturaleza.', 'Leamos su bitácora.'],
    squirrelCall: 'La abuela nos espera al otro lado del río.',
    steps: [
      {
        type: 'read',
        skill: 'causa',
        title: 'Señales del clima',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué señal vio la abuela?',
          level2_visual: 'Primero pasa la señal. Después llega el clima.',
          level3_analogy: 'Si ves nubes negras, sacas el paraguas.',
        },
        data: {
          source: 'La Abuela',
          badge: 'Saber',
          options: [
            { id: 'lluvia', text: 'Va a llover fuerte', icon: 'CloudRain' },
            { id: 'sol', text: 'Va a hacer sol', icon: 'Sun' },
            { id: 'viento', text: 'Va a venir viento', icon: 'Wind' },
          ],
          variants: [
            {
              blocks: [
                { text: 'Las aves bajan cantando de la colina.', icon: 'Bird' },
                { text: 'Así avisan que viene lluvia fuerte.', icon: 'CloudRain' },
              ],
              question: '¿Qué va a pasar?',
              answer: 'lluvia',
            },
            {
              blocks: [
                { text: 'El cielo está rojo al atardecer.', icon: 'Sun' },
                { text: 'Mañana hará sol y calor.', icon: 'Sun' },
              ],
              question: '¿Qué va a pasar mañana?',
              answer: 'sol',
            },
            {
              blocks: [
                { text: 'Las hojas giran y suben solas.', icon: 'Leaf' },
                { text: 'Pronto llega un viento fuerte.', icon: 'Wind' },
              ],
              question: '¿Qué va a pasar?',
              answer: 'viento',
            },
          ],
        },
      },
      {
        type: 'vocab',
        skill: 'palabras',
        title: 'Palabras de la tierra',
        instruction: 'Toca las 4 tarjetas.',
        socraticHints: {
          level1_question: 'Busca la tarjeta de esa palabra.',
          level2_visual: 'Abajo de cada palabra está lo que significa.',
          level3_analogy: 'Cada idioma es una llave nueva.',
        },
        data: {
          words: [
            { language: 'Ngäbere', word: 'Ñö', meaning: 'Agua', say: 'Ño. Significa agua.', lang: 'es' },
            { language: 'Ngäbere', word: 'Däbere', meaning: 'Amigo', say: 'Dá be re. Significa amigo.', lang: 'es' },
            { language: 'Emberá', word: 'Do', meaning: 'Río', say: 'Do. Significa río.', lang: 'es' },
            { language: 'Inglés', word: 'Safe shelter', meaning: 'Refugio', say: 'Seif shélter. Significa refugio.', lang: 'es' },
          ],
        },
      },
      {
        type: 'read',
        skill: 'avisos',
        title: 'Cuida el huerto',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué dice la guía que hay que hacer?',
          level2_visual: 'Busca qué cosa se usa en la guía.',
          level3_analogy: 'Como una receta: dice qué usar.',
        },
        data: {
          source: 'Huerto Escolar',
          badge: 'Guía',
          options: [
            { id: 'piedras', text: 'Poner piedras en fila', icon: 'Mountain' },
            { id: 'canales', text: 'Cavar canales', icon: 'Shovel' },
            { id: 'hojas', text: 'Tapar con hojas', icon: 'Leaf' },
          ],
          variants: [
            {
              blocks: [
                { text: 'La tierra del huerto se derrumba.', icon: 'Sprout' },
                { text: 'Las piedras en fila la sostienen.', icon: 'Mountain' },
              ],
              question: '¿Qué hacemos?',
              answer: 'piedras',
            },
            {
              blocks: [
                { text: 'El huerto se llena de agua.', icon: 'Droplet' },
                { text: 'Los canales llevan el agua lejos.', icon: 'Shovel' },
              ],
              question: '¿Qué hacemos?',
              answer: 'canales',
            },
            {
              blocks: [
                { text: 'Las semillas están sueltas.', icon: 'Sprout' },
                { text: 'Las hojas grandes las protegen.', icon: 'Leaf' },
              ],
              question: '¿Qué hacemos?',
              answer: 'hojas',
            },
          ],
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Busca una hoja y mira su forma.',
      breathingSeconds: 15,
      companionPrompt: 'Enséñale "Ñö" (agua) a alguien hoy.',
    },
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

/** Siguiente misión del sendero (orden lineal: menos decisiones = menos bloqueo ejecutivo). */
export const nextMission = (completed: string[]) => MISSIONS.find((m) => !completed.includes(m.id)) ?? null;

export const isUnlocked = (id: string, completed: string[]) => {
  const idx = MISSIONS.findIndex((m) => m.id === id);
  return idx === 0 || completed.includes(MISSIONS[idx - 1].id);
};
