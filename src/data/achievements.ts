/**
 * Logros: cada uno corresponde a algo concreto que hizo el niño (cero azar).
 * Los escondidos se muestran como "?" con una pista hasta desbloquearlos.
 * Algunos desbloquean ropa del vestuario (ver data/wardrobe.ts).
 */
import type { StudentProfile } from '../services/storageService';

export interface Achievement {
  id: string;
  name: string;
  how: string; // qué hiciste (visible al ganarlo)
  hint: string; // pista para los escondidos
  hidden: boolean;
  icon: 'Activity' | 'Waves' | 'CloudLightning' | 'Flame' | 'Users' | 'HeartHandshake' | 'Zap' | 'Target' | 'Squirrel' | 'Wind' | 'Footprints' | 'Repeat' | 'Brain' | 'Ear' | 'Shirt';
  earned: (p: StudentProfile) => boolean;
}

const done = (p: StudentProfile, id: string) => p.completedMissions.includes(id);
const mastered = (p: StudentProfile) => Object.values(p.skills).filter((s) => s && s.mastery >= 3).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'sismo', name: 'A salvo del sismo', how: 'Aprendiste qué hacer si tiembla', hint: '', hidden: false, icon: 'Activity', earned: (p) => done(p, 'nivel-sismo') },
  { id: 'inundacion', name: 'A salvo del agua', how: 'Aprendiste qué hacer si se inunda', hint: '', hidden: false, icon: 'Waves', earned: (p) => done(p, 'nivel-inundacion') },
  { id: 'tormenta', name: 'Cazador de truenos', how: 'Aprendiste qué hacer con rayos', hint: '', hidden: false, icon: 'CloudLightning', earned: (p) => done(p, 'nivel-tormenta') },
  { id: 'incendio', name: 'Bombero junior', how: 'Aprendiste qué hacer si hay fuego', hint: '', hidden: false, icon: 'Flame', earned: (p) => done(p, 'nivel-incendio') },
  { id: 'equipo', name: 'Equipo', how: 'Jugaste en dúo', hint: '', hidden: false, icon: 'Users', earned: (p) => p.duoModeCompleted },
  { id: 'resiliencia', name: 'No me rindo', how: 'Te equivocaste y lo lograste', hint: '', hidden: false, icon: 'HeartHandshake', earned: (p) => p.resilienceEarned },
  // Escondidos
  { id: 'sinayuda', name: 'Por mi cuenta', how: 'Un nivel sin pistas', hint: '¿Y si no pides ayuda?', hidden: true, icon: 'Zap', earned: (p) => p.stats.missionsNoHint >= 1 },
  { id: 'certero', name: 'A la primera', how: 'Un nivel sin errores', hint: 'Acierta todo de una vez', hidden: true, icon: 'Target', earned: (p) => p.stats.missionsPerfect >= 1 },
  { id: 'estilo', name: 'Con estilo', how: 'Cambiaste tu ropa', hint: 'Visita el vestuario', hidden: true, icon: 'Shirt', earned: (p) => p.stats.outfits >= 1 },
  { id: 'amigochispa', name: 'Amigo de Chispa', how: 'Tocaste a Chispa 15 veces', hint: 'A Chispa le gustan los saludos', hidden: true, icon: 'Squirrel', earned: (p) => p.stats.chispaTaps >= 15 },
  { id: 'calma', name: 'Calma total', how: 'Respiraste 3 veces con Chispa', hint: 'Respira hondo...', hidden: true, icon: 'Wind', earned: (p) => p.stats.breaths >= 3 },
  { id: 'explorador', name: 'Explorador', how: 'Caminaste 1 kilómetro', hint: 'Camina mucho por el valle', hidden: true, icon: 'Footprints', earned: (p) => p.stats.meters >= 1000 },
  { id: 'repaso', name: 'Repaso', how: 'Volviste a un nivel', hint: 'Vuelve a un lugar que ya ayudaste', hidden: true, icon: 'Repeat', earned: (p) => p.stats.replays >= 1 },
  { id: 'oido', name: 'Buen oído', how: 'Escuchaste 20 frases', hint: 'Escucha a Chispa', hidden: true, icon: 'Ear', earned: (p) => p.stats.listens >= 20 },
  { id: 'maestro', name: 'Mente brillante', how: 'Dominaste 5 habilidades', hint: 'Aprende muchas cosas', hidden: true, icon: 'Brain', earned: (p) => mastered(p) >= 5 },
];

export const earnedIds = (p: StudentProfile) => ACHIEVEMENTS.filter((a) => a.earned(p)).map((a) => a.id);
