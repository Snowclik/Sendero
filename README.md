# Sendero

Videojuego 100% offline para niños de **8 a 10 años con TDAH** que enseña **qué hacer en cada desastre natural**, practicando **Matemática** y **Español** en el camino. Proyecto para el Reto 15 de #HACK4EDU.

Después de un sismo de 7.7 en Panamá, el jugador recorre el valle con **Chispa la ardilla**. En cada estación aprende a reaccionar ante un desastre distinto:

| Nivel | Qué aprende | Matemática | Español |
|---|---|---|---|
| **Sismo** (Escuela) | Agáchate, cúbrete, agárrate; qué hacer en el aula, la calle o la cama | Litros de agua para la mochila de emergencia | Ordenar pasos |
| **Inundación** (Orilla del Río) | Subir a lo alto, desconectar la luz, nunca cruzar un río crecido | En cuántas horas llega el agua | Leer avisos y detectar rumores |
| **Tormenta eléctrica** (Campo Abierto) | Entrar a una casa, salir del agua, nunca bajo un árbol | Distancia del rayo: segundos ÷ 3 | Leer situaciones |
| **Incendio** (Cabaña del Bosque) | Salir agachado, no abrir puertas calientes, detenerse-tirarse-rodar, llamar al 9-1-1 | Repartir vecinos por las salidas | Ordenar el plan de salida |

![Menú principal](docs/evolucion/5-desastres-y-vestuario/menu.png)

## Cómo correrlo

```bash
pnpm install
pnpm dev          # navegador local: http://localhost:8742
pnpm tauri dev    # ventana nativa (Tauri + Rust)
pnpm tauri build  # instalador de escritorio
```

No necesita internet en ningún momento: sin CDN, sin fuentes externas, sin APIs. La voz de Chispa son audios pregrabados con una voz neuronal (incluidos en el juego) y los sonidos se generan con WebAudio.

## Cómo se juega

| Mecánica | Para qué (TDAH) |
|---|---|
| Vista isométrica fija; clic/toque o WASD para caminar | Cero manejo de cámara; funciona en tablets |
| Faro y flecha hacia el siguiente nivel; orden lineal | Menos decisiones, menos bloqueo ejecutivo |
| Cada misión: 3 micro-pasos con pestañas de ícono | *Chunking*: nunca un problema largo de golpe |
| Primero decides, luego se muestra el resultado (mochila, medidor del río, puertas) | Predecir obliga a pensar; nada de "subir hasta que coincida" |
| Al acertar, Chispa explica **por qué**; al elegir algo peligroso, explica el peligro | Se aprende la razón, no solo la respuesta |
| Chispa da pistas al tocarla (pregunta, luego pista visual, luego ejemplo) | Tutor socrático: nunca da la respuesta |
| Chispa narra cada paso con voz natural; textos de 1 a 10 palabras | Leer no es una barrera para entender |

### ¿Cómo se asegura que aprende y no toca botones al azar?

1. **Números nuevos en cada intento.** Si fallas, el problema cambia; tocar opciones hasta acertar no funciona.
2. **Respuestas escritas, no elegidas.** La crecida del río, la distancia del rayo y el reparto de vecinos se responden en un candado numérico, sin opciones que adivinar.
3. **Situaciones con varias versiones.** Cada lectura tiene 3 situaciones con respuestas distintas, y las opciones aparecen después de unos segundos: hay que leer o escuchar.
4. **Ronda extra.** Si necesitaste varios intentos, haces uno más con números nuevos para demostrar que entendiste (máximo 2, para no frustrar).
5. **Estrellas con evidencia.** Cada habilidad (sismos, dividir, detectar rumores…) sube solo al acertar **a la primera**. Repetir niveles es práctica real porque los problemas cambian.

**Los 5 candados anti-adicción:**

1. **3 soles por día:** al gastarlos, el campamento descansa hasta mañana.
2. **Misión fuera de la pantalla** al terminar cada estación, más respiración guiada.
3. **Cero azar:** cada insignia corresponde a un esfuerzo concreto.
4. **Sin rankings ni rachas:** el niño solo se compara consigo mismo.
5. **Micro-pasos:** cada misión se divide en 3.

**Mis logros:** 15 logros (9 escondidos, se ven como "?" con una pista) y la pestaña **Lo que aprendo**, con el avance en **Qué hacer**, **Matemática** y **Español**.

**Vestuario:** el explorador se viste como quiera (gorra, colores, tono de piel, pelo…). Algunas prendas se ganan con logros: el casco con el nivel de sismo, las botas con la inundación, la mochila de emergencia con la tormenta, el chaleco reflectivo con el incendio y el sombrero pintao con un logro secreto. Todas se ganan con esfuerzo, ninguna al azar.

Si el sistema pide reducir el movimiento, se apagan las animaciones.

## Evolución del proyecto

### Etapa 1: reconstrucción

El prototipo anterior (sendero 3D con gemas y vestuario) había perdido el hilo de la especificación: solo se podía jugar la misión 1. Se reconstruyó como mundo isométrico de bloques. Las 4 misiones salen del catálogo de datos, el QR es real y el guardado nativo funciona.

| Mapa | Misión + tutor | Puente en vivo |
|---|---|---|
| ![](docs/evolucion/1-reconstruccion/mapa.png) | ![](docs/evolucion/1-reconstruccion/tutor.png) | ![](docs/evolucion/1-reconstruccion/puente.png) |

### Etapa 2: estilo de juego y Chispa

La interfaz parecía una app educativa. Se pasó a un estilo de juego acogedor:
- **Interfaz:** paneles crema, cintas de título, casillas de inventario y botones con relieve.
- **Ilustraciones** en SVG del tanque, las válvulas y el manómetro.
- **Chispa:** el botón de "ayuda" se reemplazó por la ardilla, que sigue al jugador y es la voz del juego.

| Chispa en el mapa | Pistas de Chispa | Válvulas y manómetro |
|---|---|---|
| ![](docs/evolucion/2-estilo-juego/mapa-chispa.png) | ![](docs/evolucion/2-estilo-juego/pista-chispa.png) | ![](docs/evolucion/2-estilo-juego/valvulas.png) |

| Tarjetas de idiomas | Pasaporte con talentos |
|---|---|
| ![](docs/evolucion/2-estilo-juego/vocabulario.png) | ![](docs/evolucion/2-estilo-juego/pasaporte.png) |

### Etapa 3: menos texto

Un niño con TDAH no lee párrafos. Se recortó todo:
- **Instrucciones:** máximo unas 8 palabras.
- **Botones:** de 1 a 3 palabras.
- **Texto repetido:** eliminado.
- **Avisos para adultos:** pasaron a la Vista Maestro.

| Antes | Después |
|---|---|
| ![](docs/evolucion/2-estilo-juego/checkin.png) | ![](docs/evolucion/3-menos-texto/checkin.png) |

| Lectura | Filtros | Modo Dúo | Descanso |
|---|---|---|---|
| ![](docs/evolucion/3-menos-texto/lectura.png) | ![](docs/evolucion/3-menos-texto/filtros.png) | ![](docs/evolucion/3-menos-texto/puente-duo.png) | ![](docs/evolucion/3-menos-texto/descanso.png) |

### Etapa 4: aprender de verdad

Se podía avanzar tocando opciones al azar sin entender nada. Ahora:
- Los problemas se generan con números nuevos en cada intento.
- Las respuestas numéricas se escriben en un candado.
- Las lecturas cambian de versión si fallas.
- Hay una ronda extra cuando costó.
- Chispa narra con una voz natural pregrabada.
- La Vista Maestro y el pasaporte se quitaron. Su lugar lo ocupan **Mis logros** y **Lo que aprendo**.

| Error: números nuevos | Ronda extra | Candado numérico |
|---|---|---|
| ![](docs/evolucion/4-aprender-de-verdad/error-numeros-nuevos.png) | ![](docs/evolucion/4-aprender-de-verdad/ronda-extra.png) | ![](docs/evolucion/4-aprender-de-verdad/candado-numerico.png) |

| Logros escondidos | Lo que aprendo |
|---|---|
| ![](docs/evolucion/4-aprender-de-verdad/logros.png) | ![](docs/evolucion/4-aprender-de-verdad/lo-que-aprendo.png) |

### Etapa 5: desastres naturales y vestuario

Las estaciones del valle se convirtieron en **niveles por desastre**: sismo, inundación, tormenta eléctrica e incendio. Cada nivel enseña qué hacer, y Chispa explica por qué. Además:
- Se quitaron las palabras en otros idiomas: el juego es solo en español.
- Se quitó el check-in de ánimo.
- Llegaron un **menú de inicio** y un **vestuario** con prendas que se ganan con logros.

| Menú | Sismo | Tormenta |
|---|---|---|
| ![](docs/evolucion/5-desastres-y-vestuario/menu.png) | ![](docs/evolucion/5-desastres-y-vestuario/sismo.png) | ![](docs/evolucion/5-desastres-y-vestuario/tormenta.png) |

| Vestuario | Con casco y chaleco en el mapa | Lo que aprendo |
|---|---|---|
| ![](docs/evolucion/5-desastres-y-vestuario/vestuario.png) | ![](docs/evolucion/5-desastres-y-vestuario/mapa-con-ropa.png) | ![](docs/evolucion/5-desastres-y-vestuario/lo-que-aprendo.png) |

## Voz de Chispa

Las frases se graban una vez con [Piper](https://github.com/OHF-Voice/piper1-gpl), una voz neuronal que corre offline. La voz es `es_MX-claude-high`; su dataset es Apache-2.0. Los audios se guardan como MP3 en `public/voz/` (unos 4 MB). Las frases con números se arman uniendo fragmentos ("Cada filtro da" + "6" + "litros"). Si falta algún audio, el juego usa la voz del sistema como respaldo.

Si cambias textos en `src/data/`, regenera los audios:

```bash
pip install piper-tts==1.8.0
python -m piper.download_voices es_MX-claude-high
node --experimental-strip-types scripts/voice/collect.mjs
python scripts/voice/generate.py --model es_MX-claude-high.onnx   # requiere ffmpeg
```

## Arquitectura

```
src/
  data/missionsData.ts      Niveles en JSON: plantillas con {números}, situaciones, explicaciones, habilidades
  data/wardrobe.ts          Prendas del vestuario (y qué logro las desbloquea)
  data/achievements.ts      Logros (visibles y escondidos)
  data/lines.ts             Frases de Chispa (todas se graban con voz)
  game/problems.ts          Genera un problema nuevo en cada intento
  game/IsoWorld.ts          Motor three.js: rejilla de bloques, A*, cámara isométrica, Chispa 3D
  game/character.ts         Explorador de bloques con ropa intercambiable
  components/
    GameApp.tsx             Flujo: menú, jugador, mundo, nivel, descanso, vestuario, logros
    MainMenu.tsx            Pantalla de inicio
    Wardrobe.tsx            Vestuario con vista previa 3D
    MissionPanel.tsx        Los 6 tipos de micro-paso + Chispa como tutor socrático
    AchievementsModal.tsx   Mis logros + Lo que aprendo
    ui/Art.tsx              Ilustraciones SVG inline (Chispa, filtros, tanque, válvulas...)
  services/
    storageService.ts       Guardado (Rust en Tauri, localStorage en navegador), habilidades
    soundService.ts         Sonidos WebAudio + reproductor de la voz pregrabada
scripts/voice/              Recolecta las frases y las graba con Piper
src-tauri/src/lib.rs        Comandos Rust: guardado y carga atómicos, salir del juego
```

**Rendimiento para equipos de gama baja:**
- Todo lo estático del mapa es un solo `InstancedMesh`, unas 3 llamadas de render.
- Materiales Lambert y sin sombras en tiempo real.
- `pixelRatio` limitado a 1.5.
- Binario Rust de release optimizado por tamaño (`opt-level = "s"`, LTO, `strip`).

**Rust** se usa para lo que el navegador no garantiza: escritura atómica del progreso, para que un corte de luz no corrompa la partida. El render vive en WebGL; mover el juego a un motor Rust no lo aceleraría.

**Camino a Roblox:** las misiones son datos puros y el mapa es una rejilla de bloques, así que ambos se traducen directo a un ModuleScript de Luau y a Parts.

## Limitaciones conocidas

- **No hay capturas del prototipo original:** su código está en `legacy/`, pero ya no compila con los servicios actuales.
