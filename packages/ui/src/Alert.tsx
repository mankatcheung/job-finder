import type { HTMLAttributes } from 'react';

export type AlertTone = 'error' | 'success';

const TONE_CLASSES: Record<AlertTone, string> = {
  error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  success: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
};

export interface AlertProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: AlertTone;
}

/**
 * Inline message banner for form/page-level errors and success confirmations.
 *
 * @category Feedback
 */
export function Alert({ tone = 'error', className, children, ...rest }: AlertProps) {
  const classes = ['text-sm rounded-lg px-3 py-2', TONE_CLASSES[tone], className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <p className={classes} {...rest}>
      {children}
    </p>
  );
}
