import type { ComponentChildren, FunctionalComponent } from 'preact';

interface GlassCardProps {
  children: ComponentChildren;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: FunctionalComponent<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/80 backdrop-blur-2xl
        border-2 border-white/90
        shadow-[0_12px_40px_rgba(14,116,144,0.08),inset_0_2px_2px_rgba(255,255,255,1)]
        rounded-3xl
        ${hoverEffect ? 'hover:shadow-[0_16px_48px_rgba(14,116,144,0.14)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

