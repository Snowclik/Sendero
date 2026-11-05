/**
 * Frases de Chispa y de la interfaz que se dicen en voz alta.
 * Están aquí (y no sueltas en el código) para que el generador de voz las grabe todas.
 */
export const LINES = {
  // Menú y mapa
  menuHello: '¡Hola! Soy Chispa. Si sabes qué hacer, no hay que tener miedo.',
  allDone: '¡Toca Reto! Cada reto es nuevo y hecho para ti.',
  locked: '¡Aún no! Primero: {station}.',
  achievement: '¡Logro nuevo! {name}.',
  wardrobe: '¡Elige tu ropa!',
  saved: '¡Qué bien te ves!',
  // Ingreso
  hello: '¡Hola! Soy Chispa. ¿Tu apodo?',
  whoPlays: '¿Quién juega hoy?',
  // Misión
  tapMe: '¿Pista? ¡Tócame!',
  nextOne: '¡Otro más!',
  bothTurn: '¡Turno de los dos!',
  turnOf: 'Turno de {role}.',
  almost: '¡Casi! {hint}',
  practice: '¡Bien! Ahora uno más, para practicar.',
  newText: 'Mira, llegó otro mensaje. Léelo.',
  newSituation: 'Ahora imagina otra situación.',
  newNumbers: '¡Números nuevos! Inténtalo otra vez.',
  cheers: ['¡Lo lograste!', '¡Bien pensado!', '¡Eso es! Así se hace.', '¡Genial, explorador!'],
  // Resultados (con números del intento)
  counterLow: '{n} por {per} da {total}. ¡Faltan {diff}!',
  counterHigh: '{n} por {per} da {total}. ¡Sobran {diff}!',
  shareLow: 'Con {each} por puerta, sobran {diff} vecinos.',
  shareHigh: 'Con {each} por puerta, ¡faltan {diff} vecinos!',
  risingLow: 'En {n} horas sube {total}. Todavía no llega.',
  risingHigh: 'En {n} horas sube {total}. ¡Te pasaste!',
  thunderWrong: '{n} kilómetros serían {total} segundos. Inténtalo otra vez.',
  readWrong: 'Esa no es. Piensa qué te protege.',
  fracWrong: 'Divide {total} entre {den}: da {part}. Luego toma {num} partes.',
  moneyWrong: 'Casi. Suma {price} una vez por cada lata.',
  perimWrong: 'El perímetro suma los 4 lados: {a} más {b} más {a} más {b}.',
  areaWrong: 'El área es largo por ancho: {a} por {b}.',
  siftWrong: 'Ese mensaje no tiene autor ni fecha.',
  siftRight: '¡Tiene autor y fecha! Es confiable.',
  orderWrong: '¿Qué va primero?',
  // Historia de inicio (una idea por tarjeta)
  story: [
    'A veces la naturaleza se mueve: tiembla, llueve fuerte o caen rayos.',
    'Sentir miedo es normal. Primero, respira conmigo.',
    'Si sabes qué hacer, estás a salvo.',
    'Contando y leyendo, vamos a practicar. ¡Tú puedes!',
  ],
  retoNext: '¡Muy bien! Tu próximo reto será distinto.',
  // Fin
  rest: '¡A descansar! Mañana hay más soles.',
} as const;
