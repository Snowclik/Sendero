/**
 * missionsData.ts
 * Niveles de Sendero: qué hacer en cada desastre natural (contexto: sismo de 7.7 en Panamá).
 * Cada nivel mezcla Prevención + Matemática + Español. JSON puro (portable a otro motor, p. ej. Roblox).
 *
 * Anti "tocar al azar":
 * - Los textos son plantillas con {parametros}: cada intento genera números nuevos (ver game/problems.ts).
 * - Las lecturas tienen varias situaciones: la respuesta depende de lo que dice el texto.
 * - Al acertar, Chispa explica POR QUÉ; al elegir algo peligroso, explica el peligro.
 * Textos cortos a propósito (TDAH): instrucción <= 12 palabras, pistas <= 12.
 * Protocolos basados en recomendaciones generales de protección civil (SINAPROC / Cruz Roja).
 */

export type IconKey =
  | 'Shield' | 'Hand' | 'ArrowDownToLine' | 'BedDouble' | 'School' | 'Activity' | 'Zap' | 'Footprints'
  | 'Mountain' | 'Waves' | 'Unplug' | 'Backpack' | 'CloudRain' | 'Droplet' | 'Home' | 'Sun' | 'CloudLightning'
  | 'TreePine' | 'Clock' | 'Wind' | 'DoorClosed' | 'DoorOpen' | 'Flame' | 'Shirt' | 'Megaphone' | 'Phone';

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
  | 'multiplicar' | 'dividir' | 'repartir'
  | 'avisos' | 'rumores' | 'secuencias'
  | 'sismo' | 'inundacion' | 'tormenta' | 'incendio';

export type Subject = 'prevencion' | 'matematica' | 'espanol';

export const SKILLS: { id: SkillId; name: string; subject: Subject }[] = [
  { id: 'sismo', name: 'Sismos', subject: 'prevencion' },
  { id: 'inundacion', name: 'Inundaciones', subject: 'prevencion' },
  { id: 'tormenta', name: 'Tormentas eléctricas', subject: 'prevencion' },
  { id: 'incendio', name: 'Incendios', subject: 'prevencion' },
  { id: 'multiplicar', name: 'Multiplicar', subject: 'matematica' },
  { id: 'dividir', name: 'Dividir', subject: 'matematica' },
  { id: 'repartir', name: 'Repartir', subject: 'matematica' },
  { id: 'avisos', name: 'Entender avisos', subject: 'espanol' },
  { id: 'rumores', name: 'Detectar rumores', subject: 'espanol' },
  { id: 'secuencias', name: 'Ordenar pasos', subject: 'espanol' },
];

interface StepBase {
  title: string;
  instruction: string; // plantilla: {per}, {target}...
  highlightWords?: string[]; // plantillas
  skills: SkillId[];
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
  | (StepBase & { type: 'counter'; data: { gen: 'bottles'; item: [string, string]; unit: string } })
  | (StepBase & { type: 'share'; data: { unit: string; sectors: string[] } })
  | (StepBase & { type: 'number'; data: { gen: 'rising' | 'thunder'; unit: string } })
  | (StepBase & {
      type: 'read';
      data: {
        source: string;
        badge: string;
        options: ReadOption[];
        why?: Record<string, string>; // por qué una opción es peligrosa
        variants: { blocks: TextBlock[]; question: string; answer: string; explain: string }[];
      };
    })
  | (StepBase & { type: 'sift'; data: { pairs: { reliable: SiftMessage; rumor: SiftMessage }[] } })
  | (StepBase & { type: 'order'; data: { items: ReadOption[]; correctOrder: string[] } });

export type MissionId = 'nivel-sismo' | 'nivel-inundacion' | 'nivel-tormenta' | 'nivel-incendio';

export interface Mission {
  id: MissionId;
  stationName: string;
  title: string;
  disaster: string;
  shortStory: [string, string];
  squirrelCall: string;
  duoRoles?: { A: string; B: string };
  steps: [MicroStep, MicroStep, MicroStep];
  offScreenChallenge: { actionPrompt: string; breathingSeconds: number; companionPrompt: string };
}

export const MISSIONS: Mission[] = [
  // ==========================================================================
  // NIVEL 1 · SISMO
  // ==========================================================================
  {
    id: 'nivel-sismo',
    stationName: 'Escuela',
    title: '¡Tiembla la tierra!',
    disaster: 'Sismo',
    shortStory: ['Si tiembla, no corras: tú sabes qué hacer.', 'Vamos a practicarlo con calma.'],
    squirrelCall: 'Vamos a practicar qué hacer si tiembla. ¡A la escuela!',
    steps: [
      {
        type: 'read',
        skills: ['sismo', 'avisos'],
        title: '¿Dónde estás?',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué te puede caer encima ahí?',
          level2_visual: 'Lo más importante es proteger tu cabeza.',
          level3_analogy: 'Como una tortuga: busca un caparazón que te tape.',
        },
        data: {
          source: 'Chispa',
          badge: 'Situación',
          options: [
            { id: 'mesa', text: 'Meterme bajo la mesa', icon: 'Shield' },
            { id: 'postes', text: 'Alejarme de postes y cables', icon: 'Zap' },
            { id: 'almohada', text: 'Taparme la cabeza con la almohada', icon: 'BedDouble' },
            { id: 'ventana', text: 'Correr a la ventana', icon: 'Wind' },
          ],
          why: { ventana: 'Las ventanas se pueden romper. ¡Aléjate de ellas!' },
          variants: [
            {
              blocks: [
                { text: 'Estás en el aula.', icon: 'School' },
                { text: 'La tierra empieza a temblar.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'mesa',
              explain: '¡Bien! La mesa te protege de lo que cae.',
            },
            {
              blocks: [
                { text: 'Estás en la calle.', icon: 'Footprints' },
                { text: 'Empieza a temblar fuerte.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'postes',
              explain: '¡Bien! Los postes y cables pueden caer.',
            },
            {
              blocks: [
                { text: 'Estás en tu cama, de noche.', icon: 'BedDouble' },
                { text: 'La cama se mueve.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'almohada',
              explain: '¡Bien! Quédate en la cama y protege tu cabeza.',
            },
          ],
        },
      },
      {
        type: 'order',
        skills: ['secuencias', 'sismo'],
        title: 'Cuando tiembla',
        instruction: 'Toca los pasos en orden.',
        socraticHints: {
          level1_question: '¿Qué haces primero: bajar o taparte?',
          level2_visual: 'Primero bajas, luego te tapas, al final te agarras.',
          level3_analogy: 'Como una tortuga: baja, se esconde y se queda quieta.',
        },
        data: {
          items: [
            { id: 'agachate', text: 'Agáchate', icon: 'ArrowDownToLine' },
            { id: 'cubrete', text: 'Cúbrete la cabeza', icon: 'Shield' },
            { id: 'agarrate', text: 'Agárrate fuerte', icon: 'Hand' },
          ],
          correctOrder: ['agachate', 'cubrete', 'agarrate'],
        },
      },
      {
        type: 'counter',
        skills: ['multiplicar', 'sismo'],
        title: 'Mochila de emergencia',
        instruction: 'Cada botella tiene {per} litros. Necesitamos {target} litros.',
        highlightWords: ['{per} litros', '{target} litros'],
        data: { gen: 'bottles', item: ['botella', 'botellas'], unit: 'litros' },
        socraticHints: {
          level1_question: '¿Cuántos litros dan 2 botellas de {per}?',
          level2_visual: 'Cuenta de {per} en {per} hasta llegar a {target}.',
          level3_analogy: 'Una caja trae {per} huevos. ¿Cuántas cajas para {target}?',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Busca en tu casa un lugar seguro, lejos de ventanas.',
      breathingSeconds: 15,
      companionPrompt: '¡Muy bien! Enséñale a tu familia: agáchate, cúbrete, agárrate.',
    },
  },

  // ==========================================================================
  // NIVEL 2 · INUNDACIÓN (Modo Dúo)
  // ==========================================================================
  {
    id: 'nivel-inundacion',
    stationName: 'Orilla del Río',
    title: '¡Sube el río!',
    disaster: 'Inundación',
    shortStory: ['Si llueve mucho, el río crece.', 'Si sabes cuándo subir, estás a salvo.'],
    squirrelCall: 'Ahora, qué hacer si el río crece. ¡A la orilla!',
    duoRoles: { A: 'Explorador A · Lee', B: 'Explorador B · Calcula' },
    steps: [
      {
        type: 'read',
        skills: ['avisos', 'inundacion'],
        duoRole: 'A',
        title: 'Aviso de lluvia',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué dice la segunda frase?',
          level2_visual: 'La segunda frase dice qué hacer.',
          level3_analogy: 'Un aviso es como una receta: dice qué hacer.',
        },
        data: {
          source: 'Protección Civil',
          badge: 'Oficial',
          options: [
            { id: 'alto', text: 'Subir a un lugar alto', icon: 'Mountain' },
            { id: 'luz', text: 'Desconectar la luz', icon: 'Unplug' },
            { id: 'papeles', text: 'Guardar papeles en bolsa', icon: 'Backpack' },
            { id: 'cruzar', text: 'Cruzar el río caminando', icon: 'Waves' },
          ],
          why: { cruzar: 'El agua del río te puede arrastrar. ¡Nunca lo cruces!' },
          variants: [
            {
              blocks: [
                { text: 'El agua entra a las casas.', icon: 'CloudRain' },
                { text: 'Suban a un lugar alto ya.', icon: 'Mountain' },
              ],
              question: '¿Qué pide el aviso?',
              answer: 'alto',
              explain: '¡Bien! Lo alto es seguro cuando sube el agua.',
            },
            {
              blocks: [
                { text: 'El agua llegó a los enchufes.', icon: 'Droplet' },
                { text: 'Desconecten la luz de la casa.', icon: 'Unplug' },
              ],
              question: '¿Qué pide el aviso?',
              answer: 'luz',
              explain: '¡Bien! El agua y la electricidad juntas son peligrosas.',
            },
            {
              blocks: [
                { text: 'Pronto deben salir de casa.', icon: 'Home' },
                { text: 'Guarden sus papeles en bolsas.', icon: 'Backpack' },
              ],
              question: '¿Qué pide el aviso?',
              answer: 'papeles',
              explain: '¡Bien! Así tus papeles no se mojan.',
            },
          ],
        },
      },
      {
        type: 'number',
        skills: ['dividir', 'inundacion'],
        duoRole: 'B',
        title: '¿Cuándo llega el agua?',
        instruction: 'El agua sube {per} centímetros cada hora. ¿En cuántas horas llega a {target}?',
        highlightWords: ['{per} centímetros', '{target}'],
        data: { gen: 'rising', unit: 'horas' },
        socraticHints: {
          level1_question: '¿Cuánto sube en 2 horas?',
          level2_visual: 'Suma {per} cada hora hasta llegar a {target}.',
          level3_analogy: 'Si subes {per} escalones por minuto, ¿cuánto tardas en {target}?',
        },
      },
      {
        type: 'sift',
        skills: ['rumores', 'inundacion'],
        duoRole: 'AB',
        title: '¿Rumor o verdad?',
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
              rumor: { content: '¡¡La represa se rompió!! Corran. Pásalo.', author: 'Sin firma', date: 'Sin fecha', tone: 'Asusta' },
              reliable: { content: 'La represa está bien. Sigan en zona alta.', author: 'Protección Civil', date: 'Hoy, 7:00', tone: 'Tranquilo' },
            },
            {
              rumor: { content: '¡¡El agua de la llave está envenenada!! Reenvía.', author: 'Sin firma', date: 'Sin fecha', tone: 'Asusta' },
              reliable: { content: 'Hiervan el agua antes de tomarla.', author: 'Ministerio de Salud', date: 'Hoy, 8:00', tone: 'Tranquilo' },
            },
            {
              rumor: { content: '¡¡Ya pasó todo, crucen el río!! Pásalo.', author: 'Sin firma', date: 'Sin fecha', tone: 'Apura' },
              reliable: { content: 'No crucen ríos crecidos. Esperen el aviso.', author: 'Protección Civil', date: 'Hoy, 9:30', tone: 'Tranquilo' },
            },
          ],
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Mete tus papeles importantes en una bolsa plástica.',
      breathingSeconds: 15,
      companionPrompt: '¡Bien! Recuerda: nunca cruces un río crecido.',
    },
  },

  // ==========================================================================
  // NIVEL 3 · TORMENTA ELÉCTRICA
  // ==========================================================================
  {
    id: 'nivel-tormenta',
    stationName: 'Campo Abierto',
    title: '¡Rayos y truenos!',
    disaster: 'Tormenta eléctrica',
    shortStory: ['Los truenos suenan fuerte, pero no te asustes.', 'Contando segundos, sabrás qué tan lejos están.'],
    squirrelCall: 'Ahora, qué hacer si hay rayos. ¡Al campo!',
    steps: [
      {
        type: 'number',
        skills: ['dividir', 'tormenta'],
        title: '¿Qué tan lejos cayó?',
        instruction: 'Contaste {s} segundos del rayo al trueno. Cada 3 segundos es 1 kilómetro.',
        highlightWords: ['{s} segundos', '3 segundos', '1 kilómetro'],
        data: { gen: 'thunder', unit: 'km' },
        socraticHints: {
          level1_question: '¿Cuántas veces cabe 3 en {s}?',
          level2_visual: 'Cuenta de 3 en 3 hasta llegar a {s}.',
          level3_analogy: '{s} galletas en bolsas de 3. ¿Cuántas bolsas?',
        },
      },
      {
        type: 'read',
        skills: ['avisos', 'tormenta'],
        title: '¿Dónde te proteges?',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué cosas atraen a los rayos?',
          level2_visual: 'Los rayos buscan lo alto, el agua y el metal.',
          level3_analogy: 'Como la lluvia: un techo te protege.',
        },
        data: {
          source: 'Chispa',
          badge: 'Situación',
          options: [
            { id: 'casa', text: 'Entrar a una casa', icon: 'Home' },
            { id: 'salir', text: 'Salir del agua rápido', icon: 'Waves' },
            { id: 'desconectar', text: 'Desconectar los aparatos', icon: 'Unplug' },
            { id: 'arbol', text: 'Esconderme bajo un árbol', icon: 'TreePine' },
          ],
          why: { arbol: 'Los árboles atraen los rayos. ¡Nunca te pongas debajo!' },
          variants: [
            {
              blocks: [
                { text: 'Estás jugando en el campo.', icon: 'Sun' },
                { text: 'Empieza a tronar fuerte.', icon: 'CloudLightning' },
              ],
              question: '¿Qué haces?',
              answer: 'casa',
              explain: '¡Bien! Una casa te protege de los rayos.',
            },
            {
              blocks: [
                { text: 'Estás nadando en el río.', icon: 'Waves' },
                { text: 'Se ve un rayo a lo lejos.', icon: 'CloudLightning' },
              ],
              question: '¿Qué haces?',
              answer: 'salir',
              explain: '¡Bien! El agua lleva la electricidad del rayo.',
            },
            {
              blocks: [
                { text: 'Estás en casa viendo la tele.', icon: 'Home' },
                { text: 'Caen rayos muy cerca.', icon: 'CloudLightning' },
              ],
              question: '¿Qué haces?',
              answer: 'desconectar',
              explain: '¡Bien! Así los rayos no dañan los aparatos.',
            },
          ],
        },
      },
      {
        type: 'order',
        skills: ['secuencias', 'tormenta'],
        title: 'Cuando hay tormenta',
        instruction: 'Toca los pasos en orden.',
        socraticHints: {
          level1_question: '¿Qué pasa primero en una tormenta?',
          level2_visual: 'Primero oyes, luego entras, al final esperas.',
          level3_analogy: 'Como cruzar la calle: miras, esperas y cruzas.',
        },
        data: {
          items: [
            { id: 'trueno', text: 'Oyes un trueno', icon: 'CloudLightning' },
            { id: 'entrar', text: 'Entras a la casa', icon: 'Home' },
            { id: 'esperar', text: 'Esperas 30 minutos', icon: 'Clock' },
          ],
          correctOrder: ['trueno', 'entrar', 'esperar'],
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Cuenta en voz alta: un elefante, dos elefantes, tres elefantes.',
      breathingSeconds: 15,
      companionPrompt: '¡Así se cuentan los segundos entre el rayo y el trueno!',
    },
  },

  // ==========================================================================
  // NIVEL 4 · INCENDIO
  // ==========================================================================
  {
    id: 'nivel-incendio',
    stationName: 'Cabaña del Bosque',
    title: '¡Hay humo!',
    disaster: 'Incendio',
    shortStory: ['Si hay humo, sal con calma y agachado.', 'Vamos a ensayar la salida.'],
    squirrelCall: 'Último: qué hacer si hay humo. ¡A la cabaña!',
    steps: [
      {
        type: 'read',
        skills: ['avisos', 'incendio'],
        title: '¿Qué haces?',
        instruction: '',
        socraticHints: {
          level1_question: '¿Hacia dónde sube el humo?',
          level2_visual: 'El humo sube. El fuego quema. Piensa en eso.',
          level3_analogy: 'El humo es como un globo: siempre sube.',
        },
        data: {
          source: 'Chispa',
          badge: 'Situación',
          options: [
            { id: 'agachado', text: 'Salir agachado', icon: 'ArrowDownToLine' },
            { id: 'otra', text: 'No abrir y buscar otra salida', icon: 'DoorClosed' },
            { id: 'rodar', text: 'Detenerme, tirarme y rodar', icon: 'Activity' },
            { id: 'esconder', text: 'Esconderme en el armario', icon: 'DoorOpen' },
          ],
          why: { esconder: 'Nunca te escondas. ¡Sal y avisa!' },
          variants: [
            {
              blocks: [
                { text: 'Hay humo en el cuarto.', icon: 'Wind' },
                { text: 'El humo sube hacia el techo.', icon: 'Wind' },
              ],
              question: '¿Qué haces?',
              answer: 'agachado',
              explain: '¡Bien! Abajo hay aire limpio.',
            },
            {
              blocks: [
                { text: 'Tocas la puerta y está caliente.', icon: 'DoorClosed' },
                { text: 'Detrás puede haber fuego.', icon: 'Flame' },
              ],
              question: '¿Qué haces?',
              answer: 'otra',
              explain: '¡Bien! Si la puerta quema, busca otra salida.',
            },
            {
              blocks: [
                { text: 'Una chispa cayó en tu ropa.', icon: 'Flame' },
                { text: 'Tu camisa empieza a quemarse.', icon: 'Shirt' },
              ],
              question: '¿Qué haces?',
              answer: 'rodar',
              explain: '¡Bien! Rodar por el suelo apaga el fuego.',
            },
          ],
        },
      },
      {
        type: 'order',
        skills: ['secuencias', 'incendio'],
        title: 'Plan de salida',
        instruction: 'Toca los pasos en orden.',
        socraticHints: {
          level1_question: '¿A quién debes avisar primero?',
          level2_visual: 'Primero avisas, luego sales, afuera llamas.',
          level3_analogy: 'Como un recreo: suena el timbre, sales y te reúnes.',
        },
        data: {
          items: [
            { id: 'avisar', text: 'Gritar ¡fuego! para avisar', icon: 'Megaphone' },
            { id: 'salir', text: 'Salir agachado', icon: 'ArrowDownToLine' },
            { id: 'llamar', text: 'Llamar al 9-1-1 desde afuera', icon: 'Phone' },
          ],
          correctOrder: ['avisar', 'salir', 'llamar'],
        },
      },
      {
        type: 'share',
        skills: ['repartir', 'incendio'],
        title: 'Salidas seguras',
        instruction: 'Hay {total} vecinos. Salgan igual por las 3 puertas.',
        highlightWords: ['{total} vecinos', 'igual'],
        data: { unit: 'vecinos', sectors: ['Norte', 'Sur', 'Este'] },
        socraticHints: {
          level1_question: '¿Qué número, 3 veces, da {total}?',
          level2_visual: 'Haz 3 filas iguales con {total} vecinos.',
          level3_analogy: '6 dulces para 3 amigos: 2 cada uno. ¿Y {total}?',
        },
      },
    ],
    offScreenChallenge: {
      actionPrompt: 'Con tu familia, elijan un punto de encuentro afuera de casa.',
      breathingSeconds: 15,
      companionPrompt: '¡Bombero junior! Sal agachado y llama al 9-1-1.',
    },
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

/** Siguiente nivel (orden lineal: menos decisiones = menos bloqueo ejecutivo). */
export const nextMission = (completed: string[]) => MISSIONS.find((m) => !completed.includes(m.id)) ?? null;

export const isUnlocked = (id: string, completed: string[]) => {
  const idx = MISSIONS.findIndex((m) => m.id === id);
  return idx === 0 || completed.includes(MISSIONS[idx - 1].id);
};
