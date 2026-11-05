import { useEffect, useState } from 'preact/hooks';

const Q = '(max-height: 560px)';
const match = () => typeof window !== 'undefined' && !!window.matchMedia?.(Q).matches;

/** true en pantallas bajitas (celular en horizontal, pantalla exterior del Flip). Se actualiza al girar. */
export function useShort() {
  const [short, setShort] = useState(match);
  useEffect(() => {
    const m = window.matchMedia?.(Q);
    if (!m) return;
    const on = () => setShort(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return short;
}
