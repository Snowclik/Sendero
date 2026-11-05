"""
Graba con Piper (voz neuronal offline) todas las frases de phrases.json -> public/voz/*.mp3 + manifest.json

Requisitos (solo en la PC del desarrollador, el juego no los necesita):
  pip install piper-tts==1.8.0
  python -m piper.download_voices es_MX-claude-high
  ffmpeg en el PATH
Uso:
  python scripts/voice/generate.py --model ruta/es_MX-claude-high.onnx
Solo regenera las frases nuevas (las que ya están en manifest.json se reutilizan).
"""
import argparse, hashlib, json, os, subprocess, tempfile, wave
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'voz')
PHRASES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'phrases.json')

ap = argparse.ArgumentParser()
ap.add_argument('--model', required=True)
ap.add_argument('--speed', type=float, default=1.05, help='length_scale: >1 más lento y claro')
args = ap.parse_args()

os.makedirs(OUT, exist_ok=True)
manifest_path = os.path.join(OUT, 'manifest.json')
manifest = json.load(open(manifest_path, encoding='utf8')) if os.path.exists(manifest_path) else {}
phrases = json.load(open(PHRASES, encoding='utf8'))
voice = PiperVoice.load(args.model)
cfg = SynthesisConfig(length_scale=args.speed, noise_scale=0.6, noise_w_scale=0.7)

# Recorta silencio al inicio y al final para que los fragmentos se unan con naturalidad
TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'

new = 0
for text in phrases:
    name = hashlib.sha1(text.encode('utf8')).hexdigest()[:12] + '.mp3'
    if manifest.get(text) == name and os.path.exists(os.path.join(OUT, name)):
        continue
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        wav_path = tmp.name
    with wave.open(wav_path, 'wb') as wf:
        voice.synthesize_wav(text, wf, syn_config=cfg)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-af', TRIM, '-ac', '1', '-codec:a', 'libmp3lame', '-q:a', '6', os.path.join(OUT, name)], check=True)
    os.remove(wav_path)
    manifest[text] = name
    new += 1

# Quitar audios de frases que ya no existen
keep = set(phrases)
for text in list(manifest):
    if text not in keep:
        try: os.remove(os.path.join(OUT, manifest[text]))
        except FileNotFoundError: pass
        del manifest[text]

json.dump(manifest, open(manifest_path, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print(f'{new} audios nuevos, {len(manifest)} en total')
