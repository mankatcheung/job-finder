import type { HTMLAttributes } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement>;

/**
 * Bordered, rounded container — the app's standard panel/card look.
 * Ships no default padding (call sites use everything from `p-3` to `p-6`,
 * and some are horizontal-only list rows) — pass it via `className`.
 *
 * @category Layout
 */
export function Card({ className, children, ...rest }: CardProps) {
  const classes = [
    'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
