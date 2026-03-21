import { SURFACE_BG, SURFACE_BG_HOVER, createHoverBackgroundHandlers } from './styleHelpers';

export function SurfaceActionButton({
  onClick,
  children,
  className = 'w-full py-4 rounded-xl font-semibold',
  baseColor = SURFACE_BG,
  hoverColor = SURFACE_BG_HOVER,
  style = {},
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={{ background: baseColor, ...style }}
      {...createHoverBackgroundHandlers(baseColor, hoverColor)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PrimaryActionButton({
  onClick,
  children,
  className = 'w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95',
  style = {},
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
