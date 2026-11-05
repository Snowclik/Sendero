/**
 * Frases de Chispa y de la interfaz que se dicen en voz alta.
 * Están aquí (y no sueltas en el código) para que el generador de voz las grabe todas.
 */
export const LINES = {
  // Mapa
  allDone: '¡Salvamos el valle!',
  locked: '¡Aún no! Primero: {station}.',
  helpSaved: 'Le avisé a tu maestro.',
  achievement: '¡Logro nuevo! {name}.',
  // Ingreso
  hello: '¡Hola! Soy Chispa. ¿Tu apodo?',
  whoPlays: '¿Quién juega hoy?',
  howAreYou: '¿Cómo estás?',
  // Misión
  tapMe: '¿Pista? ¡Tócame!',
  nextOne: '¡Otro más!',
  bothTurn: '¡Turno de los dos!',
  turnOf: 'Turno de {role}.',
  almost: '¡Casi! {hint}',
  practice: '¡Bien! Ahora uno más, para practicar.',
  newText: 'Mira, llegó otro mensaje. Léelo.',
  newNumbers: '¡Números nuevos! Inténtalo otra vez.',
  cheers: ['¡Lo lograste!', '¡Bien pensado!', '¡Eso es! Así se hace.', '¡Genial, explorador!'],
  // Resultados (con números del intento)
  counterLow: '{n} por {per} da {total}. ¡Faltan {diff}!',
  counterHigh: '{n} por {per} da {total}. ¡Sobran {diff}!',
  shareLow: 'Cada uno recibe {each} y sobran {diff} litros.',
  shareHigh: 'Cada uno recibe {each}. ¡Faltan {diff} litros!',
  balanceLow: 'Suman {sum}. Le faltan {diff}.',
  balanceHigh: 'Suman {sum}. Le sobran {diff}.',
  pillarsLow: '{n} pilares aguantan {cap} kilos. ¡No alcanza!',
  pillarsHigh: 'Aguanta, pero sobran pilares. ¿Cuántos como mínimo?',
  perimeterWrong: 'Esa baranda no cierra el borde. ¡Números nuevos!',
  readWrong: 'Esa no es. Lee otra vez el aviso.',
  siftWrong: 'Ese mensaje no tiene autor ni fecha.',
  orderWrong: '¿Qué guardas antes de salir?',
  vocabWrong: 'Esa no es. Toca otra vez las tarjetas.',
  siftRight: '¡Tiene autor y fecha! Es confiable.',
  // Fin
  rest: '¡A descansar! Mañana hay más soles.',
} as const;
