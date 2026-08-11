import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Native `<select>` dropdown — same bordered/rounded style, `invalid` state,
 * and focus ring as `Input`. Pass `<option>` elements as children.
 *
 * @category Forms
 */
export function Select({ invalid = false, className, children, ...rest }: SelectProps) {
  const classes = [
    'w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-60 focus:outline-none focus:ring-2',
    invalid
      ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <select aria-invalid={invalid || undefined} className={classes} {...rest}>
      {children}
    </select>
  );
}
