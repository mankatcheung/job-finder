interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Trakwyn's mark: three cards climbing stage to stage, the last one
 * checked — the application pipeline the board itself tracks. Fixed brand
 * blue (not `currentColor`) so it reads consistently in both themes, same
 * as the tile favicon/app-icon it's derived from.
 */
export function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="29" width="9" height="9" rx="2" fill="#1d4ed8" opacity="0.35" />
      <rect x="18.5" y="19.5" width="11.5" height="11.5" rx="2.5" fill="#1d4ed8" opacity="0.65" />
      <rect x="29" y="9" width="13.5" height="13.5" rx="3" fill="#1d4ed8" />
      <path
        d="M32.3,16 l2.6,3 l6,-6.6"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
