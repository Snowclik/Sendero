/**
 * missionsData.ts
 * Catálogo curricular 100% offline: 4 misiones (Matemáticas + Lectura Comprensiva) para 8-10 años con TDAH.
 * Todo es JSON puro (sin funciones) a propósito: el mismo catálogo se puede exportar a otro motor
 * (por ejemplo, un ModuleScript de Roblox) sin reescribir el contenido pedagógico.
 */

import type { StudentProfile } from '../services/storageService';

export type IconKey =
  | 'Bird' | 'CloudRain' | 'Leaf' | 'Backpack' | 'Users' | 'Footprints'
  | 'Droplet' | 'Sprout' | 'Mountain' | 'Home';

export interface TextBlock {
  text: string;
  icon?: IconKey;
}

export interface SocraticHints {
  level1_question: string; // Pregunta guía
  level2_visual: string; // Pista visual (bloques/grupos)
  level3_analogy: string; // Ejemplo análogo más fácil
}

interface StepBase {
  title: string;
  instruction: string;
  highlightWords?: string[];
  retryHint: string; // Feedback suave al fallar: orienta, nunca da la respuesta
  duoRole?: 'A' | 'B' | 'AB';
  socraticHints: SocraticHints;
}

export type MicroStep =
  | (StepBase & {
      type: 'counter';
      data: { perUnit: number; target: number; min: number; max: number; start: number; unit: string; item: [string, string]; world: 'filters' | 'beams' };
    })
  | (StepBase & { type: 'share'; data: { total: number; unit: string; sectors: string[]; options: number[] } })
  | (StepBase & {
      type: 'balance';
      data: { target: number; unit: string; valves: { name: string; min: number; max: number; initial: number }[] };
    })
  | (StepBase & {
      type: 'choice';
      data: {
        source?: string;
        badge?: string;
        textBlocks?: TextBlock[];
        question: string;
        options: string[];
        correctIndex: number;
        world?: 'pillars' | 'rails';
        rect?: { w: number; h: number; unit: string };
      };
    })
  | (StepBase & {
      type: 'sift';
      data: {
        messages: { id: string; label: string; content: string; author: string; date: string; tone: string; reliable: boolean; feedback: string }[];
      };
    })
  | (StepBase & { type: 'order'; data: { items: { id: string; text: string; icon: IconKey }[]; correctOrder: string[] } })
  | (StepBase & {
      type: 'vocab';
      data: {
        words: { language: string; word: string; meaning: string; say: string; lang: 'es' | 'en' }[];
        check: { question: string; options: string[]; correctIndex: number };
      };
    });

export type MissionId = 'mision-1-agua' | 'mision-2-rumor' | 'mision-3-puente' | 'mision-4-bosque';

export interface Mission {
  id: MissionId;
  stationName: string;
  title: string;
  subject: 'Matemáticas' | 'Lectura Comprensiva';
  retos: string;
  shortStory: [string, string]; // Máximo 2 líneas
  squirrelCall: string; // Lo que dice Chispa en el mapa para llevarte a la estación
  curriculumGoal: string;
  talentFocus: string;
  duoRoles?: { A: string; B: string };
  steps: [MicroStep, MicroStep, MicroStep]; // Siempre 3 micro-pasos (chunking)
  offScreenChallenge: { actionPrompt: string; breathingSeconds: number; companionPrompt: string };
  teacherPedagogicalGuide: { adhdAdjustment: string; commonMistake: string; printableSummary: string };
}

export const MISSIONS: Mission[] = [
  // Textos cortos a propósito (TDAH): instrucción <= 10 palabras, pistas <= 12, botones <= 5.
  // ==========================================================================
  // MISIÓN 1 · MATEMÁTICAS + LABORATORIO (Retos 14, 15, 17)
  // ==========================================================================
  {
    id: 'mision-1-agua',
    stationName: 'Planta de Agua',
    title: 'La Planta Potabilizadora del Río',
    subject: 'Matemáticas',
    retos: 'Retos 14, 15 y 17',
    shortStory: ['El río creció con la lluvia.', 'El albergue necesita agua limpia.'],
    squirrelCall: '¡El agua está sucia! Vamos a la planta.',
    curriculumGoal: 'Multiplicación como suma repetida, reparto en partes iguales (1/3) y suma de tres números.',
    talentFocus: 'Ingenio Matemático',
    steps: [
      {
        type: 'counter',
        title: 'Enciende los filtros',
        instruction: 'Cada filtro da 6 litros. Necesitamos 24 litros.',
        highlightWords: ['6 litros', '24 litros'],
        retryHint: '¿Llegó justo a la marca?',
        data: { perUnit: 6, target: 24, min: 0, max: 6, start: 0, unit: 'L', item: ['filtro', 'filtros'], world: 'filters' },
        socraticHints: {
          level1_question: '¿Cuántos litros dan 2 filtros?',
          level2_visual: 'Cuenta de 6 en 6: 6, 12, 18... ¿y luego?',
          level3_analogy: 'Una caja trae 6 huevos. ¿Cuántas cajas para 24?',
        },
      },
      {
        type: 'share',
        title: 'Reparte el agua',
        instruction: 'Da lo mismo a los 3 lugares.',
        highlightWords: ['lo mismo', '3 lugares'],
        retryHint: '¿Sobra o falta agua?',
        data: { total: 24, unit: 'L', sectors: ['Salud', 'Familias', 'Cocina'], options: [6, 8, 10, 12] },
        socraticHints: {
          level1_question: '¿Qué número, 3 veces, da 24?',
          level2_visual: 'Haz 3 montones iguales con 24 gotas.',
          level3_analogy: '6 dulces para 3 amigos: 2 cada uno. ¿Y 24?',
        },
      },
      {
        type: 'balance',
        title: 'Ajusta la presión',
        instruction: 'Las 3 válvulas deben sumar 10.',
        highlightWords: ['3 válvulas', 'sumar 10'],
        retryHint: 'Mira la aguja.',
        data: {
          target: 10,
          unit: 'bar',
          valves: [
            { name: 'Norte', min: 1, max: 5, initial: 2 },
            { name: 'Centro', min: 1, max: 5, initial: 2 },
            { name: 'Sur', min: 1, max: 5, initial: 2 },
          ],
        },
        socraticHints: {
          level1_question: '¿Cuánto suman ahora? ¿Cuánto falta?',
          level2_visual: 'Hay muchas formas. Ejemplo: 2 + 3 + 5.',
          level3_analogy: 'Como una balanza: pon o quita poquito.',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Revisa que ningún grifo gotee.',
      breathingSeconds: 15,
      companionPrompt: '¡Bien! Cuéntale a alguien cómo cuidar el agua.',
    },
    teacherPedagogicalGuide: {
      adhdAdjustment: 'Retienen mejor la multiplicación al ver el tanque llenarse que con la operación abstracta en papel.',
      commonMistake: 'Confundir el número de filtros (multiplicador) con los litros producidos (resultado).',
      printableSummary: 'Ficha 01: Cálculo de agua potable por familia en el albergue.',
    },
  },

  // ==========================================================================
  // MISIÓN 2 · LECTURA COMPRENSIVA + SIFT (Retos 03, 15, 16)
  // ==========================================================================
  {
    id: 'mision-2-rumor',
    stationName: 'Tablón del Pueblo',
    title: 'El Rumor de la Quebrada',
    subject: 'Lectura Comprensiva',
    retos: 'Retos 03, 15 y 16',
    shortStory: ['Llegaron mensajes al pueblo.', '¿Cuál dice la verdad?'],
    squirrelCall: '¡Hay mensajes nuevos en el tablón!',
    curriculumGoal: 'Lectura por bloques, localizar la acción principal y verificar la fuente (método SIFT).',
    talentFocus: 'Detective de la Verdad',
    steps: [
      {
        type: 'choice',
        title: 'Lee el aviso',
        instruction: '', // el título y la pregunta bastan
        highlightWords: ['Ruta Alta', 'con calma'],
        retryHint: 'Lee otra vez la segunda frase.',
        data: {
          source: 'Protección Civil',
          badge: 'Oficial',
          textBlocks: [
            { text: 'La quebrada subió.', icon: 'CloudRain' },
            { text: 'Usen la Ruta Alta y caminen con calma.', icon: 'Mountain' },
          ],
          question: '¿Qué pide el aviso?',
          options: ['Cruzar corriendo.', 'Ir por la Ruta Alta con calma.', 'Ir a tomar fotos.'],
          correctIndex: 1,
        },
        socraticHints: {
          level1_question: '¿Qué dice la segunda frase?',
          level2_visual: 'Busca las palabras de color.',
          level3_analogy: 'Con semáforo amarillo, vamos con cuidado.',
        },
      },
      {
        type: 'sift',
        title: 'Usa la lupa',
        instruction: 'Mira quién escribió cada mensaje.',
        highlightWords: ['quién escribió'],
        retryHint: '¿Tiene autor y fecha?',
        data: {
          messages: [
            {
              id: 'A',
              label: 'Mensaje A',
              content: '¡¡Todo se inunda YA!! Pásalo a todos.',
              author: 'Sin firma',
              date: 'Sin fecha',
              tone: 'Asusta',
              reliable: false,
              feedback: 'Sin autor ni fecha. Es un rumor.',
            },
            {
              id: 'B',
              label: 'Mensaje B',
              content: 'Clases en el Centro Comunal. Lleven mochila.',
              author: 'Comité Escolar',
              date: 'Hoy, 9:00',
              tone: 'Tranquilo',
              reliable: true,
              feedback: '¡Tiene autor y fecha! Es confiable.',
            },
          ],
        },
        socraticHints: {
          level1_question: '¿Cuál dice quién lo escribió?',
          level2_visual: 'Los rumores gritan "¡¡!!" y dicen "pásalo".',
          level3_analogy: '¿Crees a un grito sin nombre o a tu maestra?',
        },
      },
      {
        type: 'order',
        title: 'Plan de seguridad',
        instruction: 'Toca los pasos en orden.',
        retryHint: '¿Qué guardas antes de salir?',
        data: {
          items: [
            { id: 'avisar', text: 'Reunir a la familia', icon: 'Users' },
            { id: 'guardar', text: 'Guardar cuadernos', icon: 'Backpack' },
            { id: 'caminar', text: 'Caminar juntos', icon: 'Footprints' },
          ],
          correctOrder: ['guardar', 'avisar', 'caminar'],
        },
        socraticHints: {
          level1_question: '¿Qué guardas antes de salir?',
          level2_visual: 'Primero preparo, luego reúno, al final camino.',
          level3_analogy: 'Para ir a la escuela: mochila, adiós, salir.',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Escribe el nombre de tu maestro en un papel.',
      breathingSeconds: 15,
      companionPrompt: '¡Gran detective! Pregunta dónde están los documentos.',
    },
    teacherPedagogicalGuide: {
      adhdAdjustment: 'Nunca más de 3 renglones seguidos. Palabras clave resaltadas para anclar la atención.',
      commonMistake: 'Elegir el mensaje más llamativo por impulso, sin revisar autor ni fecha.',
      printableSummary: 'Guía SIFT para niños: Para, Investiga la fuente, Busca otra fuente, Traza el origen.',
    },
  },

  // ==========================================================================
  // MISIÓN 3 · MATEMÁTICAS + INGENIERÍA EN MODO DÚO (Retos 08, 11, 14, 15)
  // ==========================================================================
  {
    id: 'mision-3-puente',
    stationName: 'Puente de la Escuela',
    title: 'El Puente de la Escuela',
    subject: 'Matemáticas',
    retos: 'Retos 08, 11, 14 y 15',
    shortStory: ['El puente tiene tablas sueltas.', '¡Vamos a arreglarlo!'],
    squirrelCall: '¡El puente está roto! Hay que arreglarlo.',
    curriculumGoal: 'División como reparto de longitudes, comparación de cantidades y perímetro de un rectángulo.',
    talentFocus: 'Trabajo en Equipo',
    duoRoles: { A: 'Explorador A · Medidas', B: 'Explorador B · Resistencia' },
    steps: [
      {
        type: 'counter',
        duoRole: 'A',
        title: 'Pon las vigas',
        instruction: 'El río mide 12 metros. Cada viga, 3 metros.',
        highlightWords: ['12 metros', '3 metros'],
        retryHint: '¿Llegan justo a la otra orilla?',
        data: { perUnit: 3, target: 12, min: 0, max: 6, start: 0, unit: 'm', item: ['viga', 'vigas'], world: 'beams' },
        socraticHints: {
          level1_question: '¿Cuántas veces cabe 3 en 12?',
          level2_visual: 'Salta de 3 en 3: 3, 6, 9...',
          level3_analogy: '¿Cuántas piezas de 3 cm hacen 12 cm?',
        },
      },
      {
        type: 'choice',
        duoRole: 'B',
        title: 'Pilares fuertes',
        instruction: 'Un pilar aguanta 50 kilos. Cruzan 90 kilos.',
        highlightWords: ['50 kilos', '90 kilos'],
        retryHint: '¿Esos pilares aguantan 90?',
        data: { question: '¿Cuántos pilares, como mínimo?', options: ['1', '2', '3', '4'], correctIndex: 1, world: 'pillars' },
        socraticHints: {
          level1_question: '¿1 pilar aguanta 90 kilos?',
          level2_visual: 'Suma pilares: 50... 50 + 50...',
          level3_analogy: 'Bolsas de 50 mandarinas. ¿Cuántas para 90?',
        },
      },
      {
        type: 'choice',
        duoRole: 'AB',
        title: 'La baranda',
        instruction: 'La baranda va por todo el borde.',
        highlightWords: ['todo el borde'],
        retryHint: '¿Sumaste los 4 lados?',
        data: {
          question: '¿Cuántos metros de baranda?',
          options: ['6 m', '8 m', '12 m', '16 m'],
          correctIndex: 2,
          world: 'rails',
          rect: { w: 4, h: 2, unit: 'm' },
        },
        socraticHints: {
          level1_question: '¿Cuántos lados tiene el rectángulo?',
          level2_visual: 'Recorre el borde: arriba, lado, abajo, lado.',
          level3_analogy: 'Al rodear una mesa pasas por 4 lados.',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Con alguien, formen un arco con las manos.',
      breathingSeconds: 15,
      companionPrompt: '¡En equipo todo es más fácil!',
    },
    teacherPedagogicalGuide: {
      adhdAdjustment: 'El turno compartido regula la impulsividad: cada niño espera su rol y valida al otro.',
      commonMistake: 'En el perímetro, sumar solo dos lados (4 + 2 = 6) en lugar de los cuatro.',
      printableSummary: 'Taller de geometría comunitaria: longitudes, resistencia y perímetro.',
    },
  },

  // ==========================================================================
  // MISIÓN 4 · LECTURA + SABERES COMUNITARIOS E IDIOMAS (Retos 06, 15, 20)
  // ==========================================================================
  {
    id: 'mision-4-bosque',
    stationName: 'Cabaña de la Abuela',
    title: 'La Bitácora del Bosque y la Abuela',
    subject: 'Lectura Comprensiva',
    retos: 'Retos 06, 15 y 20',
    shortStory: ['La abuela lee el clima en la naturaleza.', 'Leamos su bitácora.'],
    squirrelCall: 'La abuela nos espera al otro lado del río.',
    curriculumGoal: 'Relaciones causa-efecto, saberes ancestrales y vocabulario intercultural de emergencia.',
    talentFocus: 'Sabiduría Comunitaria',
    steps: [
      {
        type: 'choice',
        title: 'Causa y efecto',
        instruction: '',
        highlightWords: ['aves bajan', 'lluvia fuerte', 'hojas'],
        retryHint: 'Mira el dibujo de la nube.',
        data: {
          source: 'La Abuela',
          badge: 'Saber',
          textBlocks: [
            { text: 'Las aves bajan de la colina...', icon: 'Bird' },
            { text: '...y llega lluvia fuerte.', icon: 'CloudRain' },
            { text: 'Tapamos las semillas con hojas.', icon: 'Leaf' },
          ],
          question: '¿Por qué tapamos las semillas?',
          options: ['Para las aves.', 'Para que la lluvia no se las lleve.', 'Por el frío.'],
          correctIndex: 1,
        },
        socraticHints: {
          level1_question: '¿Qué hace la lluvia fuerte con la tierra?',
          level2_visual: 'Sigue el orden: aves, lluvia, tapar.',
          level3_analogy: 'Si ves nubes, te pones el impermeable.',
        },
      },
      {
        type: 'vocab',
        title: 'Palabras de la tierra',
        instruction: 'Toca las 4 tarjetas.',
        retryHint: 'Toca otra vez esa tarjeta.',
        data: {
          words: [
            { language: 'Ngäbere', word: 'Ñö', meaning: 'Agua', say: 'Ño. Significa agua.', lang: 'es' },
            { language: 'Ngäbere', word: 'Däbere', meaning: 'Amigo', say: 'Dá be re. Significa amigo.', lang: 'es' },
            { language: 'Emberá', word: 'Do', meaning: 'Río', say: 'Do. Significa río.', lang: 'es' },
            { language: 'Inglés', word: 'Safe shelter', meaning: 'Refugio', say: 'Safe shelter', lang: 'en' },
          ],
          check: { question: '¿Qué es "Ñö"?', options: ['Río', 'Agua', 'Amigo'], correctIndex: 1 },
        },
        socraticHints: {
          level1_question: 'Busca la tarjeta que dice "Ñö".',
          level2_visual: 'Abajo de cada palabra está lo que significa.',
          level3_analogy: 'Cada idioma es una llave nueva.',
        },
      },
      {
        type: 'choice',
        title: 'Cuida el huerto',
        instruction: '',
        highlightWords: ['canales', 'piedras en fila'],
        retryHint: 'Lee la segunda frase.',
        data: {
          source: 'Huerto Escolar',
          badge: 'Guía',
          textBlocks: [
            { text: 'Los canales llevan el agua lejos.', icon: 'Droplet' },
            { text: 'Las piedras en fila sostienen la tierra.', icon: 'Mountain' },
          ],
          question: '¿Qué sostiene la tierra?',
          options: ['Bolsas rotas.', 'Piedras en fila.', 'Una fogata.'],
          correctIndex: 1,
        },
        socraticHints: {
          level1_question: '¿Qué dice la frase de las piedras?',
          level2_visual: 'Las piedras en fila son como un muro.',
          level3_analogy: 'Como los ladrillos de una casa.',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Busca una hoja y mira su forma.',
      breathingSeconds: 15,
      companionPrompt: 'Enséñale "Ñö" (agua) a alguien hoy.',
    },
    teacherPedagogicalGuide: {
      adhdAdjustment: 'Ver su idioma y sus saberes en la escuela da validación emocional y baja la ansiedad del aislamiento.',
      commonMistake: 'Suponer que todos conocen la misma palabra agrícola: contextualiza con objetos reales.',
      printableSummary: 'Cuaderno de saberes locales: señales del clima y glosario intercultural.',
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

/** Insignias deterministas: cada una corresponde a un esfuerzo concreto (cero azar). */
export function getBadges(p: StudentProfile) {
  const has = (id: MissionId) => p.completedMissions.includes(id);
  return [
    { id: 'ingenio', name: 'Ingenio Matemático', why: 'Restauró la planta de agua y el puente', earned: has('mision-1-agua') && has('mision-3-puente') },
    { id: 'detective', name: 'Detective de la Verdad', why: 'Detectó un rumor con la lupa SIFT', earned: has('mision-2-rumor') },
    { id: 'equipo', name: 'Trabajo en Equipo', why: 'Construyó el puente en Modo Dúo', earned: p.duoModeCompleted },
    { id: 'resiliencia', name: 'Resiliencia', why: 'Se equivocó, lo intentó otra vez y terminó', earned: p.resilienceEarned },
    { id: 'saberes', name: 'Guardián de Saberes', why: 'Aprendió palabras de su comunidad', earned: has('mision-4-bosque') },
  ];
}

// Datos de aula de ejemplo para el Semáforo de 48 h (Retos 05, 10, 13)
export interface RuralStudentStatus {
  id: string;
  name: string;
  community: string;
  lastActiveHoursAgo: number;
  completedMissionsCount: number;
  struggles: { math: number; reading: number };
  safetyFlag: boolean;
  mood: 'tranquilo' | 'inquieto' | 'ayuda';
}

export const RURAL_CLASSROOM_DATA: RuralStudentStatus[] = [
  { id: 'est-01', name: 'Ana M.', community: 'Río Guabal, Veraguas', lastActiveHoursAgo: 2, completedMissionsCount: 4, struggles: { math: 0, reading: 0 }, safetyFlag: false, mood: 'tranquilo' },
  { id: 'est-02', name: 'Carlos S.', community: 'Alto Caballero, Comarca', lastActiveHoursAgo: 26, completedMissionsCount: 2, struggles: { math: 2, reading: 0 }, safetyFlag: false, mood: 'tranquilo' },
  { id: 'est-03', name: 'Marta C.', community: 'Quebrada de Loro', lastActiveHoursAgo: 50, completedMissionsCount: 1, struggles: { math: 0, reading: 1 }, safetyFlag: true, mood: 'ayuda' },
  { id: 'est-04', name: 'David O.', community: 'San José del Valle', lastActiveHoursAgo: 14, completedMissionsCount: 3, struggles: { math: 0, reading: 2 }, safetyFlag: false, mood: 'inquieto' },
];
