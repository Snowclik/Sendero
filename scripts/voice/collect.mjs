// Junta todas las frases que el juego puede decir en voz alta -> scripts/voice/phrases.json
// Uso: node --experimental-strip-types scripts/voice/collect.mjs
import { writeFileSync } from 'node:fs';
import { MISSIONS } from '../../src/data/missionsData.ts';
import { LINES } from '../../src/data/lines.ts';
import { ACHIEVEMENTS } from '../../src/data/achievements.ts';
import { templateFragments } from '../../src/game/problems.ts';

const set = new Set();
const add = (s) => s && templateFragments(s).forEach((f) => set.add(f));

for (const m of MISSIONS) {
  [m.stationName, m.squirrelCall, ...m.shortStory, m.offScreenChallenge.actionPrompt, m.offScreenChallenge.companionPrompt].forEach(add);
  Object.values(m.duoRoles ?? {}).forEach(add);
  for (const s of m.steps) {
    add(s.instruction);
    Object.values(s.socraticHints).forEach(add);
    const d = s.data;
    if (s.type === 'read') {
      d.options.forEach((o) => add(o.text));
      Object.values(d.why ?? {}).forEach(add);
      d.variants.forEach((v) => { add(v.question); add(v.explain); v.blocks.forEach((b) => add(b.text)); });
    }
    if (s.type === 'sift') d.pairs.forEach((p) => { add(p.rumor.content); add(p.reliable.content); });
    if (s.type === 'order') d.items.forEach((i) => add(i.text));
  }
}
for (const v of Object.values(LINES)) (Array.isArray(v) ? v : [v]).forEach(add);
ACHIEVEMENTS.forEach((a) => add(a.name));
for (let n = 0; n <= 200; n++) set.add(String(n));

const phrases = [...set].sort();
writeFileSync(new URL('./phrases.json', import.meta.url), JSON.stringify(phrases, null, 1));
console.log(`${phrases.length} frases`);
