# ESPECIFICACIÓN TÉCNICA MAESTRA (`tarea.md`)

**Rol:** Arquitecto de Software Senior en Sistemas Offline-First, Diseñador de Videojuegos Educativos (Serious Games) y Especialista en UI/UX Clínico para Neurodivergencia (TDAH).
**Objetivo Inmediato:** Construir la **ETAPA BETA 100% JUGABLE Y COMPLETA** de un videojuego educativo de supervivencia y continuidad escolar en emergencias (Reto 15 de #HACK4EDU + integración orgánica de los 20 retos del torneo), enfocado en niños de **8 a 10 años (3.º y 4.º grado de primaria) con TDAH** en las áreas de **Matemáticas y Lectura Comprensiva**.

---

## 1. ARQUITECTURA 100% OFFLINE NATIVA (TAURI + RUST + PREACT)

El proyecto está dirigido a niños que viven en zonas rurales y albergues sin acceso a internet. Mientras probamos en entorno de desarrollo se visualiza en navegador local (`localhost`), pero su destino final inmediato es compilarse como binario nativo de escritorio (Windows/Linux) y móvil (Android) mediante **Tauri v2 + Rust**. Por lo tanto, debes cumplir estas reglas de oro:

1. **CERO DEPENDENCIAS EXTERNAS DE RED (`Zero-Network Policy`):**
   - **PROHIBIDO** cargar fuentes desde Google Fonts (`fonts.googleapis.com`), imágenes desde Unsplash/URLs externas, audios remotos, scripts de CDN o APIs en la nube.
   - Todo gráfico debe construirse con **SVG vectoriales inline, HTML5 Canvas nativo e iconos locales de `lucide-preact`**.
   - Todo el sonido (efectos suaves de feedback, lectura por voz local con `window.speechSynthesis` offline y audios de vocabulario indígena simulados con sintetizador WebAudio API local) debe generarse localmente sin red.
   - Al empaquetarse en **Tauri**, el ejecutable lleva embebido el 100% de las misiones, el motor del Tutor Socrático, los laboratorios interactivos y la base de datos local.

2. **Stack Tecnológico Exacto:**
   - **Frontend / Motor del Juego:** **Astro** (modo estático puro para empaquetado Tauri) + **Preact** (`preact`, NO React) + **TailwindCSS** + **`lucide-preact`**.
   - **Backend Local y Persistencia:**
     - **Capa Tauri / Rust (`src-tauri/src/main.rs` o `lib.rs`):** Incluye los comandos en Rust (`#[tauri::command]`) para guardar/cargar el estado del juego en un archivo JSON local en el disco del dispositivo, exportar el expediente firmado y verificar el estado offline.
     - **Capa Fallback Automática en Navegador (`IndexedDB` / `localStorage`):** Crea un servicio unificado `storageService.ts` que detecte si está corriendo dentro de la ventana nativa de Tauri (`window.__TAURI_INTERNALS__`) para usar Rust, o si está en el navegador de desarrollo para usar `localStorage`/`IndexedDB` de forma transparente sin arrojar errores.
   - **Adaptabilidad (Desktop-First + Mobile Responsive):**
     - Prioridad #1: Pantalla panorámica de **Computadora (PC/Laptop)** con interfaz tipo dashboard de aventura, controles por clic y atajos de teclado (`1, 2, 3`, `Espacio`, `Enter`).
     - Prioridad #2: Totalmente adaptable (`Responsive`) para pantallas táctiles de **Celulares y Tabletas** mediante CSS Grid y Flexbox fluidos.

---

## 2. SISTEMA DE DISEÑO: 100% MODO CLARO ("SOLAR LIQUID GLASS") Y COMPONENTES PROPIOS

1. **PROHIBIDO EL MODO OSCURO Y PROHIBIDO `shadcn/ui`:**
   - **100% Modo Claro (Light Mode exclusivo):** No uses fondos oscuros (`slate-900`, `zinc-950`, `black`) ni clases `dark:`. Los niños con TDAH requieren claridad visual, calidez diurna y baja sobreestimulación sensorial (*Low-Arousal UI*).
   - **Cero librerías de componentes prefabricadas:** No uses `shadcn/ui`, ni Material UI, ni Chakra. Construye tus propios componentes atómicos en Preact (`GlassCard`, `GlassButton`, `GlassModal`, `GlassProgressBar`, `GlassBadge`, `IconButton`).
   - **PROHIBIDO USAR EMOJIS:** No incluyas ni un solo emoji Unicode en todo el código. Usa exclusivamente iconos vectoriales limpios de **`lucide-preact`**.

2. **Estética Apple "Solar Liquid Glass" (Cristal Luminoso Diurno):**
   - **Fondo Ambiental Diurno:** Gradiente orgánico luminoso (`bg-gradient-to-br from-sky-100 via-amber-50/60 to-emerald-100`) con formas suaves translúcidas en el fondo que transmitan calma y seguridad.
   - **Superficies de Cristal (`GlassCard`):** `bg-white/75 backdrop-blur-2xl border-2 border-white/90 shadow-[0_12px_40px_rgba(14,116,144,0.08),inset_0_2px_2px_rgba(255,255,255,1)] rounded-3xl`.
   - **Botones Táctiles de Cristal (`GlassButton`):** Bordes muy redondeados (`rounded-2xl`), sombras suaves, estados `hover:bg-white/90 active:scale-95 transition-all duration-200`, con iconos grandes de `lucide-preact` acompañados de etiquetas cortas y directas en color `slate-800`.
   - **Paleta Semántica Amigable para TDAH:**
     - Acción principal / Enfoque: Azul cielo profundo (`sky-600` / `sky-500`).
     - Matemáticas / Ingeniería: Ámbar cálido (`amber-500` / `orange-500`).
     - Lectura Comprensiva / Sabiduría: Esmeralda natural (`emerald-600` / `teal-500`).
     - Tutor Socrático Local: Índigo suave (`indigo-600`).
     - Alerta suave (nunca agresiva): Coral cálido (`rose-500`).

---

## 3. FUNDAMENTACIÓN CLÍNICA Y PEDAGÓGICA (EL CORAZÓN DEL VIDEOJUEGO)

El juego está diseñado específicamente para **niños de 8 a 10 años (3.º y 4.º de primaria) con TDAH** que viven una interrupción escolar por lluvias, inundaciones o sismos en zonas rurales (ej. Veraguas o comarcas en Panamá).

### A. ¿Por qué SOLO 2 Materias Clave (Matemáticas y Lectura Comprensiva)?
Para evitar la saturación de la memoria de trabajo (*Cognitive Load Theory* de Sweller) y el bloqueo ejecutivo por cambio de tarea (*task-switching*) en el TDAH, el juego se concentra exclusivamente en las 2 competencias con mayor comorbilidad clínica en TDAH y mayor pérdida en emergencias:
1. **Matemáticas Aplicadas a la Emergencia (Icono: `Calculator` / `Compass`):** Resolución visual de problemas, fracciones, cálculo de litros de agua potable, reparto equitativo de suministros en el albergue y equilibrio de estructuras.
2. **Lectura Comprensiva y Pensamiento Crítico (Icono: `BookOpen` / `ShieldCheck`):** Lectura fragmentada en bloques cortos (máximo 3 líneas por tarjeta para evitar muros de texto), comprensión de instrucciones de seguridad, identificación de la idea principal y detección de rumores falsos sobre desastres (Método SIFT).

*(Nota: Ciencias Naturales, Geografía y Vocabulario Bilingüe/Originario no son materias separadas en el menú; son el **escenario narrativo** donde ocurren las misiones de Matemáticas y Lectura).*

### B. Los 5 Candados Clínicos Anti-Adicción (Obligatorios en la Interfaz)
Los niños con TDAH son vulnerables a la adicción a pantallas. La interfaz debe mostrar y ejecutar estos 5 mecanismos éticos:
1. **Dosificador Clínico de Sesión (Máximo 3 Misiones por Día / ~20 min):** Una barra superior de "Energía Solar del Campamento" con 3 soles (`Sun` icon). Al completar las 3 misiones del día, el campamento pasa a modo "Descanso y Misión en el Mundo Real", evitando el uso compulsivo infinito (*Stopping Cue* clínico estilo *EndeavorRx*).
2. **Puente al Mundo Real (*Off-Screen Mission*):** Al terminar una misión digital, el juego propone un reto físico corto fuera de la pantalla (ej. *"Busca 3 objetos seguros en tu casa o albergue y cuéntaselos a un familiar o compañero"* + ejercicio de respiración guiada con animación suave de 15 segundos).
3. **Cero Recompensas Aleatorias (*No Loot Boxes*):** Prohibido usar ruletas o premios al azar. Toda insignia ganada corresponde directamente al esfuerzo cognitivo demostrado.
4. **Progreso Personal Sin Rankings Competitivos ni Castigo de Rachas:** El niño gana insignias de habilidades (Resiliencia, Ingenio Matemático, Detective de la Verdad, Trabajo en Equipo), pero jamás compite en una tabla que humille a quien no pudo jugar por falta de batería o emergencia.
5. **División de Tareas en Micro-Pasos Visuales (*Chunking* para TDAH):** Ninguna misión muestra un problema largo de golpe. Cada misión se divide en **3 micro-pasos interactivos** con feedback inmediato dopaminérgico sano.

---

## 4. MECÁNICA JUGABLE DE LA ETAPA BETA (MAPA DE SUPERVIVENCIA + 4 MISIONES COMPLETAS)

Al abrir el juego (sin necesidad de login con internet; usa un selector visual de perfil local con seudónimo y avatar de icono cumpliendo privacidad de menores), el jugador entra al **"Valle Resiliente"**: un mapa visual interactivo en SVG/Canvas en Modo Claro donde una tormenta y un sismo afectaron a la comunidad rural y la escuela cerró temporalmente.

El estudiante (solo o en **Modo Dúo Compartido en la misma pantalla** con otro compañero de casa/albergue) debe ayudar a restaurar 4 estaciones del mapa completando **4 Misiones Jugables Completas**:

### Misión 1 (Matemáticas + Laboratorio Interactivo - Retos 14, 15, 17): "La Planta Potabilizadora del Río"
- **Historia corta (2 líneas con botón de lectura por voz):** El río creció por la lluvia y el albergue necesita agua limpia para 24 familias.
- **Mecánica Interactiva (No es un simple quiz de texto):** Un simulador visual en pantalla con tanques de agua, válvulas y filtros donde el niño debe arrastrar o pulsar botones (`+` / `-`) para calcular:
  - Micro-paso 1: Si cada filtro limpia 6 litros por hora, ¿cuántos filtros debemos activar para conseguir 24 litros en una hora? (Interacción visual llenando los tanques).
  - Micro-paso 2: Proporción de purificación y reparto justo entre 3 sectores del albergue (fracciones visuales).
  - Micro-paso 3: Equilibrar la presión de la tubería en el mini-laboratorio.

### Misión 2 (Lectura Comprensiva + Detector de Desinformación SIFT - Retos 03, 15, 16): "El Rumor de la Quebrada"
- **Historia corta:** Llegaron tres mensajes distintos al pueblo sobre el puente y la lluvia. Hay que leer con atención para saber cuál es seguro y cuál es un rumor falso.
- **Mecánica Interactiva:**
  - Micro-paso 1 (Lectura por bloques con resaltador de palabras clave para TDAH): El niño lee un aviso corto de protección civil y selecciona qué acción indica el texto.
  - Micro-paso 2 (Detector SIFT interactivo): Aparecen 2 tarjetas de mensajes ("Mensaje A: Cadena alarmista sin fuente" vs "Mensaje B: Comunicado de SINAPROC/Escuela"). El niño usa la "Lupa de Verificación" (`Search` icon) para inspeccionar quién lo escribió y descartar el bulo.
  - Micro-paso 3: Ordenar los 3 pasos del plan de seguridad familiar leyendo pictogramas + frases cortas.

### Misión 3 (Matemáticas + Ingeniería del Puente en Modo Cooperativo - Retos 08, 11, 14, 15): "El Puente de la Escuela"
- **Historia corta:** El camino hacia la escuela temporal tiene tablas sueltas. Hay que calcular el peso y las medidas para cruzar seguros.
- **Mecánica Interactiva (Incluye interruptor de "Modo Dúo: 2 Jugadores en Pantalla"):**
  - Si activa Modo Dúo, la pantalla muestra "Turno Explorador A (Medidas)" y "Turno Explorador B (Resistencia)" para que dos niños en un albergue o casa jueguen juntos en la misma computadora o celular.
  - Resuelven geometría visual (perímetro y longitud de vigas) viendo cómo el puente SVG se construye pieza por pieza en tiempo real al acertar.

### Misión 4 (Lectura Comprensiva + Saberes de la Comunidad e Idioma - Retos 06, 15, 20): "La Bitácora del Bosque y la Abuela"
- **Historia corta:** Los abuelos de la comarca conocen las señales del clima en la naturaleza. Leamos su bitácora para proteger los cultivos escolares.
- **Mecánica Interactiva:**
  - Comprensión de causa y efecto en un cuento corto ilustrado con iconos.
  - Incluye cápsulas interactivas de vocabulario local/originario (ngäbere/emberá e inglés básico de emergencia) con pronunciación auditiva local para que la escuela hable el idioma del niño.

---

## 5. INTEGRACIÓN DE LOS SISTEMAS TRANSVERSALES (LOS 20 RETOS EN UNA SOLA INTERFAZ)

Integra de forma fluida en la barra superior e inferior de cristal estos 5 módulos funcionales:

1. **El Tutor Socrático Offline con Ética Visible (Retos 04 y 07):**
   - En cualquier misión, si el niño se equivoca o toca el botón `"Pedir Pista al Guía"` (Icono `Compass` / `Lightbulb`), se despliega un panel lateral Liquid Glass.
   - **Regla Socrática:** JAMÁS da la respuesta directa. Primero hace una pregunta guía sencilla, luego muestra una pista visual (dibujo de bloques/grupos) y finalmente ofrece un ejemplo análogo más fácil.
   - **Etiqueta de Transparencia Ética Obligatoria:** Muestra un badge visible en el panel: `"Motor Local Offline Activo (Sin Internet) · Confianza: Reglas Verificadas por tu Maestro · Recuerda: Soy un guía digital y no reemplazo a tu maestro"`.

2. **Check-in Emocional y de Seguridad en 1 Clic (Retos 15 y 18):**
   - Al iniciar o desde la barra superior, el niño puede tocar cómo se siente hoy mediante 3 botones grandes con iconos (`Smile`: "Estoy tranquilo y listo", `CloudRain`: "Me siento inquieto / Me cuesta concentrarme", `LifeBuoy`: "Estoy en albergue / Necesito hablar con mi maestro").
   - Si elige *"Me siento inquieto"*, el juego reduce aún más los estímulos visuales, activa un ejercicio de respiración guiada de 10 segundos con un círculo expansivo suave y divide el texto en frases aún más cortas. La IA jamás diagnostica emociones; solo adapta el entorno y guarda el aviso para el maestro.

3. **Pasaporte Educativo Portátil en Código QR Offline (Retos 02, 09, 15 y 20):**
   - Un botón `"Mi Pasaporte Escolar"` (`QrCode` icon) abre una tarjeta de cristal que muestra no solo los aciertos en Matemáticas y Lectura, sino un **Mapa de Talentos Más Allá de las Notas** (Perseverancia, Pensamiento Crítico, Colaboración en Dúo, Calma en Emergencias).
   - Genera en pantalla un **Código QR SVG 100% offline** (codificando el JSON comprimido y firmado localmente del progreso del niño) para que, cuando regrese a la escuela o llegue a otro albergue, el maestro lo escanee sin haber necesitado internet jamás.

4. **Panel del Maestro Offline + Copiloto Docente + Semáforo de 48h (Retos 01, 03, 05, 10, 12, 13 y 19):**
   - Desde la barra superior se puede alternar en 1 clic entre `"Vista Estudiante (Juego)"` y `"Vista Maestro (Centro Docente Offline)"` para que el jurado pueda probar ambas en vivo:
     - **Semáforo de Seguimiento y Alerta Temprana (Retos 05, 10, 13):** Tabla visual con datos de ejemplo de un aula rural (incluyendo al jugador actual en tiempo real) que clasifica con reglas transparentes: Verde (Activo), Ámbar (+24h sin actividad o bloqueo en lectura/matemáticas) y Rojo (+48h sin señal o marcó el botón `LifeBuoy`), indicando qué ruta de segunda oportunidad (Reto 11) activar al volver a clases.
     - **Importador de Pasaporte Estudiante:** Un campo/escáner donde el maestro puede cargar el código de progreso de un alumno offline y ver cómo se actualiza su expediente al instante.
     - **Copiloto Docente Local y Generador de Misiones / Guías Imprimibles (Retos 01, 03, 12, 19):** Permite al maestro crear una nueva misión personalizada de Matemáticas o Lectura en 30 segundos, ofreciéndole consejos pedagógicos en vivo para niños con TDAH (*"Entrenador invisible del docente"*) y un botón `"Imprimir Misión para Niños sin Dispositivo"` (`Printer` icon) que formatea la misión en una hoja limpia lista para imprimir en papel (`window.print()`).

---

## 6. ESTRUCTURA DE ARCHIVOS Y ENTREGABLES QUE DEBES GENERAR AHORA

Construye el proyecto completo, limpio y sin placeholders vacíos para que funcione a la primera:

1. **Configuración Base y Tauri:**
   - `package.json` con dependencias exactas (`astro`, `@astrojs/preact`, `preact`, `tailwindcss`, `lucide-preact`).
   - `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` y `src-tauri/src/main.rs` (con comandos en Rust `save_offline_progress`, `load_offline_progress` y `export_signed_passport`).
2. **Datos Curriculares y Motor Pedagógico Offline (`src/data/missionsData.ts`):**
   - Las 4 misiones completas de Matemáticas y Lectura Comprensiva para 8-10 años (TDAH), con sus micro-pasos interactivos, pistas graduadas del Tutor Socrático, vocabulario local y consejos para el maestro.
3. **Sistema de Componentes Propios "Solar Liquid Glass" (`src/components/ui/`):**
   - Componentes propios en Modo Claro (`GlassCard.tsx`, `GlassButton.tsx`, `GlassBadge.tsx`, `BreathingModal.tsx`, `QrGeneratorSvg.tsx` — generador visual de matriz QR en SVG puro sin librerías externas que fallen).
4. **Aplicación Principal Jugable (`src/components/GameApp.tsx`):**
   - Barra Superior Solar Liquid Glass (Selector Estudiante/Maestro, Indicador `"100% OFFLINE NATIVO"`, Check-in Emocional TDAH, Contador de 3 Soles Anti-Adicción, Botón de Voz Local).
   - Mapa Interactivo del Valle Resiliente (SVG diurno animado con las 4 estaciones).
   - Motor de Misiones Interactivo (Simulador de tanques de agua, Detector SIFT con lupa, Constructor del puente con Modo Dúo en pantalla compartida y Bitácora del bosque).
   - Panel Lateral del Tutor Socrático con Etiqueta de Transparencia Ética.
   - Modal del Pasaporte Escolar con Mapa de Talentos y QR Offline.
   - Vista Completa del Maestro (Semáforo de 48h, Copiloto de creación de misiones para TDAH y Vista de Impresión en Papel).

Escribe todo el código completo y funcional archivo por archivo. Asegúrate de que no exista ni un solo emoji, que todo sea Modo Claro luminoso estilo Apple Liquid Glass y que todas las misiones se puedan jugar de principio a fin sin conexión a internet.