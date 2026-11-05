import type { ComponentChildren, FunctionalComponent } from 'preact';
import { playClickSound } from '../../services/soundService';

interface GlassButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'amber' | 'emerald' | 'rose' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

/** Botón "chunky" de juego: relieve inferior que se hunde al tocarlo (feedback táctil claro). */
export const GlassButton: FunctionalComponent<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ariaLabel,
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-xl',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-2xl',
    lg: 'px-6 py-3 text-base gap-2.5 rounded-2xl',
    xl: 'px-8 py-4 text-lg gap-3 rounded-[20px]',
  };
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-400 text-white shadow-[0_5px_0_#0369a1] active:shadow-[0_2px_0_#0369a1]',
    emerald: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_5px_0_#047857] active:shadow-[0_2px_0_#047857]',
    amber: 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-[0_5px_0_#b45309] active:shadow-[0_2px_0_#b45309]',
    rose: 'bg-rose-400 hover:bg-rose-300 text-white shadow-[0_5px_0_#be123c] active:shadow-[0_2px_0_#be123c]',
    secondary: 'bg-white hover:bg-[#fffdf6] text-slate-700 border-2 border-[#f1e4c6] shadow-[0_5px_0_#e6d3ab] active:shadow-[0_2px_0_#e6d3ab]',
    ghost: 'bg-transparent hover:bg-white/50 text-slate-600',
  };
  return (
    <button
      type={type}
      onClick={() => {
        if (disabled) return;
        playClickSound();
        onClick?.();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-extrabold select-none transition-all duration-100 active:translate-y-[3px] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
