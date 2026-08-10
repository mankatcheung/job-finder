import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  const classes = [
    'w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 disabled:opacity-60 focus:outline-none focus:ring-2',
    invalid
      ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <input aria-invalid={invalid || undefined} className={classes} {...rest} />;
}
