/**
 * soundService.ts
 * Generador de efectos de sonido y síntesis de voz 100% LOCAL Y OFFLINE.
 * Utiliza WebAudio API y SpeechSynthesis nativa del dispositivo.
 * Cero descargas, cero latencia, cero uso de red.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Sonido de acierto suave y cálido (Acorde mayor ascendente C5-E5-G5)
 * Diseñado para bajo nivel de excitación sensorial (Low-Arousal UI para TDAH)
 */
export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.001, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.36);
  });
}

/**
 * Sonido sutil de pulsación táctil (Pop suave de burbuja)
 */
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.07);
}

/**
 * Sonido de micro-paso completado
 */
export function playStepCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 554.37]; // A4, C#5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);

    gain.gain.setValueAtTime(0.001, now + idx * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.26);
  });
}

/**
 * Tono socrático suave (campana de reflexión)
 */
export function playHintSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, now); // D5

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.65);
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
let enabled = true;
let listenHook: (() => void) | null = null;

try {
  enabled = localStorage.getItem('sendero_voz') !== 'off';
} catch {}

export const isVoiceEnabled = () => enabled;
export function setVoiceEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem('sendero_voz', on ? 'on' : 'off');
  } catch {}
  if (!on) stopSpeaking();
}
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
  if (!enabled && !opts.user) return;
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
