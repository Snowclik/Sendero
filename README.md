# Sendero

Videojuego 100% offline de continuidad escolar en emergencias para niños de **8 a 10 años con TDAH**, centrado en **Matemáticas** y **Lectura Comprensiva**. Proyecto para el Reto 15 de #HACK4EDU; integra los 20 retos del torneo en una sola experiencia.

Una tormenta dañó el valle. El jugador, acompañado de **Chispa la ardilla**, restaura 4 estaciones resolviendo problemas reales: agua potable, rumores falsos, un puente y el huerto de la abuela. El niño no ve "ejercicios": ve filtros que se encienden, un tanque que se llena y un puente que se construye.

![Valle restaurado](docs/evolucion/3-menos-texto/valle-restaurado.png)

## Cómo correrlo

```bash
pnpm install
pnpm dev          # navegador local: http://localhost:8742
pnpm tauri dev    # ventana nativa (Tauri + Rust)
pnpm tauri build  # instalador de escritorio
```

No necesita internet en ningún momento: sin CDN, sin fuentes externas, sin APIs. La voz usa la síntesis del sistema y los sonidos se generan con WebAudio.

## Cómo se juega

| Mecánica | Para qué (TDAH) |
|---|---|
| Vista isométrica fija; clic/toque o WASD para caminar | Cero manejo de cámara; funciona en tablets |
| Faro y flecha hacia la siguiente estación; orden lineal | Menos decisiones, menos bloqueo ejecutivo |
| Cada misión: 3 micro-pasos con pestañas de ícono | *Chunking*: nunca un problema largo de golpe |
| El mundo reacciona en vivo (tanque, vigas, pilares, barandas) | Feedback inmediato y concreto |
| Chispa da pistas al tocarla (pregunta, luego pista visual, luego ejemplo) | Tutor socrático: nunca da la respuesta |
| Textos de 1 a 10 palabras; lectura en voz alta en todo | Baja carga de lectura y de memoria de trabajo |

**Los 5 candados anti-adicción** (`tarea.md`, sección 3B):

1. **3 soles por día:** al gastarlos, el campamento descansa hasta mañana.
2. **Misión fuera de la pantalla** al terminar cada estación, más respiración guiada.
3. **Cero azar:** cada insignia corresponde a un esfuerzo concreto.
4. **Sin rankings ni rachas:** el niño solo se compara consigo mismo.
5. **Micro-pasos:** cada misión se divide en 3.

**Check-in emocional:** si el niño elige "Inquieto", se apagan las animaciones y el texto aparece frase por frase. Si elige "Necesito ayuda", queda la alerta para el maestro.

**Vista Maestro (offline):**
- Semáforo de 48 h con las reglas visibles y una ruta de segunda oportunidad para cada alumno.
- Copiloto que revisa la redacción para TDAH mientras el maestro escribe una misión, y la imprime para niños sin dispositivo.
- Importador de pasaportes, desde el QR o desde un archivo `.txt`.

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

## Arquitectura

```
src/
  data/missionsData.ts      Catálogo de misiones en JSON puro (portable a otro motor)
  game/IsoWorld.ts          Motor three.js: rejilla de bloques, A*, cámara isométrica, Chispa 3D
  components/
    GameApp.tsx             Flujo: perfil, check-in, mundo, misión, descanso, maestro
    MissionPanel.tsx        Los 7 tipos de micro-paso + Chispa como tutor socrático
    TeacherView.tsx         Semáforo 48 h, copiloto docente, importador de pasaportes
    PassportModal.tsx       QR real + mapa de talentos
    ui/Art.tsx              Ilustraciones SVG inline (Chispa, filtros, tanque, válvulas...)
  services/
    storageService.ts       Guardado: Rust en Tauri, localStorage en navegador; pasaporte
    soundService.ts         Sonidos WebAudio + voz local
src-tauri/src/lib.rs        Comandos Rust: guardado atómico, exportar pasaporte a .txt
```

**Rendimiento para equipos de gama baja:**
- Todo lo estático del mapa es un solo `InstancedMesh`, unas 3 llamadas de render.
- Materiales Lambert y sin sombras en tiempo real.
- `pixelRatio` limitado a 1.5.
- Binario Rust de release optimizado por tamaño (`opt-level = "s"`, LTO, `strip`).

**Rust** se usa para lo que el navegador no garantiza: escritura atómica del progreso (un corte de luz no corrompe la partida) y exportar el pasaporte a Documentos para llevarlo en USB. El render vive en WebGL; mover el juego a un motor Rust no lo aceleraría.

**Camino a Roblox:** las misiones son datos puros y el mapa es una rejilla de bloques, así que ambos se traducen directo a un ModuleScript de Luau y a Parts.

## Limitaciones conocidas

- **El sello del pasaporte (FNV-1a) detecta códigos dañados, no falsificaciones.** Para una firma real: clave del maestro + Ed25519 en Rust.
- **No hay capturas del prototipo original:** su código está en `legacy/`, pero ya no compila con los servicios actuales.
