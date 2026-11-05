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
  | 'TreePine' | 'Clock' | 'Wind' | 'DoorClosed' | 'DoorOpen' | 'Flame' | 'Shirt' | 'Megaphone' | 'Phone' | 'BookOpen';

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
  | 'multiplicar' | 'dividir' | 'repartir' | 'fracciones' | 'decimales' | 'medidas'
  | 'avisos' | 'rumores' | 'secuencias' | 'comprension' | 'vocabulario' | 'ortografia'
  | 'sismo' | 'inundacion' | 'tormenta' | 'incendio' | 'recuperacion';

export type Subject = 'prevencion' | 'matematica' | 'espanol';

export const SKILLS: { id: SkillId; name: string; subject: Subject }[] = [
  { id: 'sismo', name: 'Sismos', subject: 'prevencion' },
  { id: 'inundacion', name: 'Inundaciones', subject: 'prevencion' },
  { id: 'tormenta', name: 'Tormentas eléctricas', subject: 'prevencion' },
  { id: 'incendio', name: 'Incendios', subject: 'prevencion' },
  { id: 'recuperacion', name: 'Después del desastre', subject: 'prevencion' },
  { id: 'multiplicar', name: 'Multiplicar', subject: 'matematica' },
  { id: 'dividir', name: 'Dividir', subject: 'matematica' },
  { id: 'repartir', name: 'Repartir', subject: 'matematica' },
  { id: 'fracciones', name: 'Fracciones', subject: 'matematica' },
  { id: 'decimales', name: 'Decimales y dinero', subject: 'matematica' },
  { id: 'medidas', name: 'Perímetro y área', subject: 'matematica' },
  { id: 'avisos', name: 'Entender avisos', subject: 'espanol' },
  { id: 'rumores', name: 'Detectar rumores', subject: 'espanol' },
  { id: 'secuencias', name: 'Ordenar pasos', subject: 'espanol' },
  { id: 'comprension', name: 'Idea principal', subject: 'espanol' },
  { id: 'vocabulario', name: 'Sinónimos', subject: 'espanol' },
  { id: 'ortografia', name: 'Ortografía', subject: 'espanol' },
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
  | (StepBase & { type: 'number'; data: { gen: 'rising' | 'thunder' | 'fraction' | 'money' | 'perimeter' | 'area'; unit: string } })
  | (StepBase & {
      type: 'read';
      data: {
        source: string;
        badge: string;
        options: ReadOption[];
        why?: Record<string, string>; // por qué una opción es peligrosa
        variants: { blocks: TextBlock[]; question: string; answer: string; explain: string; options?: ReadOption[] }[]; // options propias por variante (vocabulario, ortografía)
      };
    })
  | (StepBase & { type: 'sift'; data: { pairs: { reliable: SiftMessage; rumor: SiftMessage }[] } })
  | (StepBase & { type: 'order'; data: { items: ReadOption[]; correctOrder: string[] } });

export type MissionId = 'nivel-sismo' | 'nivel-inundacion' | 'nivel-tormenta' | 'nivel-incendio' | 'isla-albergue' | 'isla-reconstruccion' | 'isla-noticias';

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

  // ==========================================================================
  // ISLAS · DESPUÉS DEL DESASTRE (contenidos de 4.° y 5.° grado)
  // Se llega por los puentes al sur del valle. Cada isla = qué hacer DESPUÉS + un tema escolar.
  // ==========================================================================
  {
    id: 'isla-albergue',
    stationName: 'Isla del Albergue',
    title: 'Después del sismo',
    disaster: 'Fracciones y decimales',
    shortStory: ['Ya pasó el sismo. Estamos en el albergue.', 'Aquí repartimos agua y comida, con fracciones.'],
    squirrelCall: 'Cruza el puente: vamos a la Isla del Albergue.',
    steps: [
      {
        type: 'read',
        skills: ['recuperacion', 'comprension'],
        title: 'Después del sismo',
        instruction: '',
        socraticHints: {
          level1_question: '¿Qué peligro sigue después del sismo?',
          level2_visual: 'Después pueden venir réplicas: temblores más pequeños.',
          level3_analogy: 'Como una ola: después de la grande vienen otras.',
        },
        data: {
          source: 'SINAPROC',
          badge: 'Después',
          options: [
            { id: 'afuera', text: 'Quedarme afuera, lejos de paredes rotas', icon: 'Footprints' },
            { id: 'gas', text: 'Salir y avisar a un adulto', icon: 'Megaphone' },
            { id: 'cables', text: 'No tocarlo y alejarme', icon: 'Zap' },
            { id: 'entrar', text: 'Entrar rápido por mis juguetes', icon: 'Home' },
          ],
          why: { entrar: 'Una casa dañada se puede caer con una réplica. ¡No entres!' },
          variants: [
            {
              blocks: [
                { text: 'Tu casa tiene grietas grandes.', icon: 'Home' },
                { text: 'Pueden venir réplicas: temblores más pequeños.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'afuera',
              explain: '¡Bien! Una réplica puede tumbar una pared dañada.',
            },
            {
              blocks: [
                { text: 'En la cocina huele a gas.', icon: 'Flame' },
                { text: 'Una chispa puede causar un incendio.', icon: 'Zap' },
              ],
              question: '¿Qué haces?',
              answer: 'gas',
              explain: '¡Bien! No prendas luces ni fósforos: sal y avisa.',
            },
            {
              blocks: [
                { text: 'Hay un cable de luz caído en la calle.', icon: 'Zap' },
                { text: 'Todavía puede tener corriente.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'cables',
              explain: '¡Bien! Un cable caído puede dar una descarga.',
            },
          ],
        },
      },
      {
        type: 'number',
        skills: ['fracciones', 'recuperacion'],
        title: 'Repartir el agua',
        instruction: 'Hay {total} litros de agua. A cada familia le tocan {fname} del agua. ¿Cuántos litros son?',
        highlightWords: ['{total} litros', '{fname}'],
        data: { gen: 'fraction', unit: 'litros' },
        socraticHints: {
          level1_question: '¿En cuántas partes iguales se divide el agua?',
          level2_visual: 'Divide {total} entre {den}. Luego toma {num} partes.',
          level3_analogy: 'Una pizza en {den} pedazos: ¿cuánto son {num} pedazos?',
        },
      },
      {
        type: 'number',
        skills: ['decimales', 'multiplicar'],
        title: 'La tienda del albergue',
        instruction: 'Una lata de comida cuesta {price} balboas. ¿Cuánto pagas por {n} latas?',
        highlightWords: ['{price} balboas', '{n} latas'],
        data: { gen: 'money', unit: 'balboas' },
        socraticHints: {
          level1_question: '¿Cuánto cuestan 2 latas?',
          level2_visual: 'Suma {price} una vez por cada lata.',
          level3_analogy: 'Cuenta como monedas: {price}, otra vez {price}...',
        },
      },
    ],
    offScreenChallenge: { actionPrompt: '', breathingSeconds: 15, companionPrompt: '¡Bien! Después de un sismo, cuidado con las réplicas.' },
  },
  {
    id: 'isla-reconstruccion',
    stationName: 'Isla de la Reconstrucción',
    title: 'Después de la inundación',
    disaster: 'Medidas: perímetro y área',
    shortStory: ['El agua ya bajó. Toca limpiar y reconstruir.', 'Vamos a medir la cerca y las lonas.'],
    squirrelCall: 'Sigue el puente: vamos a la Isla de la Reconstrucción.',
    steps: [
      {
        type: 'read',
        skills: ['recuperacion', 'inundacion'],
        title: 'Después del agua',
        instruction: '',
        socraticHints: {
          level1_question: '¿El agua de la inundación está limpia?',
          level2_visual: 'El agua de la inundación trae suciedad y mosquitos.',
          level3_analogy: 'Como un charco de la calle: no lo tomarías, ¿verdad?',
        },
        data: {
          source: 'Ministerio de Salud',
          badge: 'Después',
          options: [
            { id: 'hervir', text: 'Hervir el agua antes de tomarla', icon: 'Flame' },
            { id: 'vaciar', text: 'Vaciar el agua de llantas y tarros', icon: 'Droplet' },
            { id: 'botas', text: 'Limpiar con botas y guantes', icon: 'Hand' },
            { id: 'jugar', text: 'Jugar en el agua sucia', icon: 'Waves' },
          ],
          why: { jugar: 'El agua de la inundación trae suciedad y enfermedades.' },
          variants: [
            {
              blocks: [
                { text: 'El agua de la llave sale turbia.', icon: 'Droplet' },
                { text: 'Puede tener microbios.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'hervir',
              explain: '¡Bien! Hervir el agua mata los microbios.',
            },
            {
              blocks: [
                { text: 'Quedó agua quieta en llantas viejas.', icon: 'Droplet' },
                { text: 'Ahí nacen los mosquitos del dengue.', icon: 'Activity' },
              ],
              question: '¿Qué haces?',
              answer: 'vaciar',
              explain: '¡Bien! Sin agua quieta no hay mosquitos del dengue.',
            },
            {
              blocks: [
                { text: 'Tu casa quedó llena de lodo.', icon: 'Home' },
                { text: 'El lodo puede tener vidrios y clavos.', icon: 'Hand' },
              ],
              question: '¿Qué haces?',
              answer: 'botas',
              explain: '¡Bien! Las botas y guantes protegen de cortadas.',
            },
          ],
        },
      },
      {
        type: 'number',
        skills: ['medidas', 'recuperacion'],
        title: 'La cerca del huerto',
        instruction: 'El huerto mide {a} metros de largo y {b} metros de ancho. ¿Cuántos metros de cerca lo rodean?',
        highlightWords: ['{a} metros', '{b} metros'],
        data: { gen: 'perimeter', unit: 'metros' },
        socraticHints: {
          level1_question: '¿Cuántos lados tiene el huerto?',
          level2_visual: 'El perímetro es sumar los 4 lados: {a} + {b} + {a} + {b}.',
          level3_analogy: 'Camina alrededor del huerto: ¿cuántos metros das?',
        },
      },
      {
        type: 'number',
        skills: ['medidas', 'multiplicar'],
        title: 'Una lona para el techo',
        instruction: 'La lona mide {a} metros por {b} metros. ¿Cuántos metros cuadrados cubre?',
        highlightWords: ['{a} metros', '{b} metros'],
        data: { gen: 'area', unit: 'm²' },
        socraticHints: {
          level1_question: '¿Cuántos cuadritos hay en una fila?',
          level2_visual: 'El área es largo por ancho: {a} × {b}.',
          level3_analogy: 'Como un piso de baldosas: filas por columnas.',
        },
      },
    ],
    offScreenChallenge: { actionPrompt: '', breathingSeconds: 15, companionPrompt: '¡Bien! Después de una inundación, hierve el agua.' },
  },
  {
    id: 'isla-noticias',
    stationName: 'Isla de las Noticias',
    title: 'Después de la tormenta',
    disaster: 'Lectura y ortografía',
    shortStory: ['La tormenta pasó. La radio da noticias.', 'Hay que leer con cuidado y escribir bien.'],
    squirrelCall: 'Último puente: vamos a la Isla de las Noticias.',
    steps: [
      {
        type: 'read',
        skills: ['comprension', 'recuperacion'],
        title: 'La noticia',
        instruction: '',
        socraticHints: {
          level1_question: '¿De qué habla todo el texto, no solo una parte?',
          level2_visual: 'La idea principal resume todo el texto.',
          level3_analogy: 'Es como el título de una película: dice de qué trata.',
        },
        data: {
          source: 'Radio Comunitaria',
          badge: 'Noticia',
          options: [],
          variants: [
            {
              blocks: [
                { text: 'La tormenta tumbó árboles en la calle.', icon: 'TreePine' },
                { text: 'Los bomberos los están quitando.', icon: 'Megaphone' },
                { text: 'Mañana la calle estará abierta otra vez.', icon: 'Footprints' },
              ],
              question: '¿Cuál es la idea principal?',
              answer: 'a',
              options: [
                { id: 'a', text: 'Están limpiando la calle tras la tormenta', icon: 'TreePine' },
                { id: 'b', text: 'Los bomberos tienen camiones rojos', icon: 'Flame' },
                { id: 'c', text: 'Mañana va a llover mucho', icon: 'CloudRain' },
              ],
              explain: '¡Bien! Todo el texto habla de limpiar la calle.',
            },
            {
              blocks: [
                { text: 'Ana ve el cielo muy oscuro.', icon: 'CloudRain' },
                { text: 'A lo lejos se oye un trueno.', icon: 'CloudLightning' },
                { text: 'Ana guarda su bicicleta y entra a la casa.', icon: 'Home' },
              ],
              question: '¿Por qué Ana entra a la casa?',
              answer: 'b',
              options: [
                { id: 'a', text: 'Porque tiene hambre', icon: 'Home' },
                { id: 'b', text: 'Porque viene una tormenta', icon: 'CloudLightning' },
                { id: 'c', text: 'Porque se cansó de jugar', icon: 'BedDouble' },
              ],
              explain: '¡Bien! Las pistas son el cielo oscuro y el trueno.',
            },
            {
              blocks: [
                { text: 'Después de la tormenta, el río sigue alto.', icon: 'Waves' },
                { text: 'Protección Civil pide no acercarse a la orilla.', icon: 'Megaphone' },
                { text: 'Las clases vuelven el lunes.', icon: 'School' },
              ],
              question: '¿Qué NO debes hacer hoy?',
              answer: 'c',
              options: [
                { id: 'a', text: 'Quedarme en casa', icon: 'Home' },
                { id: 'b', text: 'Preparar mis útiles para el lunes', icon: 'Backpack' },
                { id: 'c', text: 'Ir a mirar el río de cerca', icon: 'Waves' },
              ],
              explain: '¡Bien! El texto pide no acercarse a la orilla.',
            },
          ],
        },
      },
      {
        type: 'read',
        skills: ['vocabulario', 'avisos'],
        title: 'Palabras del aviso',
        instruction: '',
        socraticHints: {
          level1_question: 'Lee la frase otra vez con cada opción.',
          level2_visual: 'Un sinónimo dice lo mismo con otra palabra.',
          level3_analogy: 'Como "feliz" y "contento": significan lo mismo.',
        },
        data: {
          source: 'SINAPROC',
          badge: 'Palabra',
          options: [],
          variants: [
            {
              blocks: [{ text: 'Deben evacuar la escuela.', icon: 'School' }, { text: '¿Qué significa evacuar?', icon: 'BookOpen' }],
              question: 'Evacuar significa…',
              answer: 'a',
              options: [
                { id: 'a', text: 'Salir del lugar', icon: 'Footprints' },
                { id: 'b', text: 'Limpiar el lugar', icon: 'Droplet' },
                { id: 'c', text: 'Pintar el lugar', icon: 'Home' },
              ],
              explain: '¡Bien! Evacuar es salir de un lugar peligroso.',
            },
            {
              blocks: [{ text: 'El albergue es un refugio seguro.', icon: 'Home' }, { text: '¿Qué palabra dice lo mismo que refugio?', icon: 'BookOpen' }],
              question: 'Un sinónimo de refugio es…',
              answer: 'b',
              options: [
                { id: 'a', text: 'Peligro', icon: 'Zap' },
                { id: 'b', text: 'Resguardo', icon: 'Shield' },
                { id: 'c', text: 'Camino', icon: 'Footprints' },
              ],
              explain: '¡Bien! Refugio y resguardo: un lugar que protege.',
            },
            {
              blocks: [{ text: 'El río está crecido.', icon: 'Waves' }, { text: '¿Cuál es lo contrario de crecido?', icon: 'BookOpen' }],
              question: 'Lo contrario (antónimo) de crecido es…',
              answer: 'c',
              options: [
                { id: 'a', text: 'Alto', icon: 'Mountain' },
                { id: 'b', text: 'Grande', icon: 'Waves' },
                { id: 'c', text: 'Bajo', icon: 'ArrowDownToLine' },
              ],
              explain: '¡Bien! Crecido y bajo son antónimos.',
            },
          ],
        },
      },
      {
        type: 'read',
        skills: ['ortografia'],
        title: 'Escribe bien el cartel',
        instruction: '',
        socraticHints: {
          level1_question: 'Fíjate en cada letra con calma.',
          level2_visual: 'Recuerda: emergencia va con g, ayuda con y.',
          level3_analogy: 'Léela despacio, como si la deletrearas.',
        },
        data: {
          source: 'Cartel del albergue',
          badge: 'Ortografía',
          options: [],
          variants: [
            {
              blocks: [{ text: 'El cartel dice: "Salida de _______".', icon: 'DoorOpen' }],
              question: '¿Cuál está bien escrita?',
              answer: 'b',
              options: [
                { id: 'a', text: 'emerjencia', icon: 'DoorOpen' },
                { id: 'b', text: 'emergencia', icon: 'DoorOpen' },
                { id: 'c', text: 'emergensia', icon: 'DoorOpen' },
              ],
              explain: '¡Bien! Emergencia va con g y con c.',
            },
            {
              blocks: [{ text: 'El cartel dice: "Aquí hay _______".', icon: 'Megaphone' }],
              question: '¿Cuál está bien escrita?',
              answer: 'a',
              options: [
                { id: 'a', text: 'ayuda', icon: 'Hand' },
                { id: 'b', text: 'alluda', icon: 'Hand' },
                { id: 'c', text: 'ahyuda', icon: 'Hand' },
              ],
              explain: '¡Bien! Ayuda va con y.',
            },
            {
              blocks: [{ text: 'El cartel dice: "Ruta de _______".', icon: 'Footprints' }],
              question: '¿Cuál está bien escrita?',
              answer: 'c',
              options: [
                { id: 'a', text: 'evacuasión', icon: 'Footprints' },
                { id: 'b', text: 'evakuación', icon: 'Footprints' },
                { id: 'c', text: 'evacuación', icon: 'Footprints' },
              ],
              explain: '¡Bien! Evacuación lleva c, ción y tilde.',
            },
            {
              blocks: [{ text: 'El cartel dice: "Este es el _______".', icon: 'Home' }],
              question: '¿Cuál está bien escrita?',
              answer: 'b',
              options: [
                { id: 'a', text: 'alverge', icon: 'Home' },
                { id: 'b', text: 'albergue', icon: 'Home' },
                { id: 'c', text: 'albergé', icon: 'Home' },
              ],
              explain: '¡Bien! Albergue va con b y con gue.',
            },
          ],
        },
      },
    ],
    offScreenChallenge: { actionPrompt: '', breathingSeconds: 15, companionPrompt: '¡Bien! Lee siempre los avisos oficiales completos.' },
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

/** Siguiente nivel (orden lineal: menos decisiones = menos bloqueo ejecutivo). */
export const nextMission = (completed: string[]) => MISSIONS.find((m) => !completed.includes(m.id)) ?? null;

export const isUnlocked = (id: string, completed: string[]) => {
  const idx = MISSIONS.findIndex((m) => m.id === id);
  return idx === 0 || completed.includes(MISSIONS[idx - 1].id);
};
