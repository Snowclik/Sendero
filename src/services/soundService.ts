/**
 * soundService.ts
 * Generador de efectos de sonido y síntesis de voz 100% LOCAL Y OFFLINE.
 * Utiliza WebAudio API y SpeechSynthesis nativa del dispositivo.
 * Cero descargas, cero latencia, cero uso de red.
 */

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    // Volumen general + compresor: se escucha claro en bocinas de celular sin saturar
    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    comp.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

// Android y iOS dejan el audio "dormido" hasta el primer toque: lo despertamos en ese toque
// para que el primer efecto no se pierda.
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      const b = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.connect(ctx.destination);
      src.start(0);
    }
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

/**
 * Un tono con ataque suave. Frecuencias entre ~600 y 2000 Hz: es lo que una bocina de celular
 * reproduce bien (los graves casi no se oyen). Un armónico suave le da presencia sin sonar estridente.
 */
function tone(freq: number, delay: number, dur: number, vol: number, opts: { type?: OscillatorType; glideTo?: number } = {}) {
  const ctx = getAudioContext();
  if (!ctx || !master) return;
  const t = ctx.currentTime + 0.02 + delay;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  gain.connect(master);
  for (const [mult, part] of [[1, 1], [2, 0.25]] as const) {
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq * mult, t);
    if (opts.glideTo) osc.frequency.exponentialRampToValueAtTime(opts.glideTo * mult, t + dur);
    const g = ctx.createGain();
    g.gain.value = part;
    osc.connect(g);
    g.connect(gain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

/** Acierto: acorde mayor ascendente (Do-Mi-Sol-Do), cálido. */
export function playSuccessSound() {
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, i * 0.09, 0.42, 0.32));
}

/** Toque: "pop" corto de burbuja. */
export function playClickSound() {
  tone(1200, 0, 0.09, 0.3, { glideTo: 700 });
}

/** Paso completado: dos notas que suben. */
export function playStepCompleteSound() {
  tone(880, 0, 0.22, 0.3, { type: 'triangle' });
  tone(1318.5, 0.09, 0.3, 0.3, { type: 'triangle' });
}

/** Pista: campanita suave. */
export function playHintSound() {
  tone(1174.7, 0, 0.7, 0.26);
  tone(1760, 0.05, 0.5, 0.12);
}

// ============================================================================
// VOZ DE CHISPA: audios pregrabados con una voz neuronal (Piper), 100% offline.
// Las frases con números se arman uniendo fragmentos ("Cada filtro da" + "6" + "litros").
// Si falta algún audio se usa la voz del sistema como respaldo.
// ============================================================================
import { speechParts, cleanFragment, type Params } from '../game/problems';

let manifest: Record<string, string> | null = null;
let manifestLoading: Promise<void> | null = null;
let current: HTMLAudioElement | null = null;
let token = 0;
let listenHook: (() => void) | null = null;
/** Se llama cuando el niño pide escuchar algo (para el logro "Buen oído"). */
export const onListen = (fn: () => void) => (listenHook = fn);

function loadManifest() {
  if (manifest || manifestLoading || typeof window === 'undefined') return manifestLoading;
  manifestLoading = fetch('voz/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => {
      manifest = m;
    })
    .catch(() => {
      manifest = {};
    });
  return manifestLoading;
}
loadManifest();

const keyOf = (part: string | number) => cleanFragment(String(part)).replace(/\s+/g, ' ');

function playUrl(url: string, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (my !== token) return resolve();
    const a = new Audio(url);
    current = a;
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}

/**
 * Dice una frase hecha de fragmentos. opts.user = el niño lo pidió (cuenta para logros);
 * opts.force = suena aunque la narración automática esté apagada.
 */
export async function say(parts: (string | number)[], opts: { user?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  if (!opts.user) return; // la voz SOLO suena cuando el niño toca un botón de altavoz
  if (opts.user) listenHook?.();
  stopSpeaking();
  const my = ++token;
  await loadManifest();
  if (my !== token) return;
  const files = parts.map((p) => manifest?.[keyOf(p)]);
  if (files.every(Boolean)) {
    for (const f of files) {
      if (my !== token) return;
      await playUrl(`voz/${f}`, my);
      await new Promise((r) => setTimeout(r, 70)); // micro pausa natural entre fragmentos
    }
    return;
  }
  if (import.meta.env.DEV) console.warn('Faltan audios para:', parts.filter((p, i) => !files[i]));
  fallbackSpeech(parts.join(' '));
}

/** Atajos: frase fija o plantilla con parámetros. */
export const sayText = (text: string, opts?: { user?: boolean }) => say([text], opts);
export const sayTpl = (tpl: string, params: Params, opts?: { user?: boolean }) => say(speechParts(tpl, params), opts);

function fallbackSpeech(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-MX';
  u.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((x) => x.lang.startsWith('es') && x.localService) || voices.find((x) => x.lang.startsWith('es'));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

/** Detener cualquier narración activa. */
export function stopSpeaking() {
  token++;
  if (current) {
    current.pause();
    current = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
