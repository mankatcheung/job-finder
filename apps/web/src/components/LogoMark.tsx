interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Trakwyn's mark: two chevrons, the leading one solid and the trailing one a
 * hairline of the same shape — a position and the position it came from, which
 * is what the board tracks.
 *
 * The weights are deliberately unequal. Two chevrons at the same weight read as
 * a media control ("fast forward"); a thing and its shadow do not, and the
 * difference survives being shrunk.
 *
 * Fixed brand blue (not `currentColor`) so it reads consistently in both
 * themes, same as the tile favicon/app-icon it's derived from.
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
      <path
        d="M11.5 13 L23.5 24 L11.5 35"
        stroke="#1d4ed8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M24.5 13 L36.5 24 L24.5 35"
        stroke="#1d4ed8"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
