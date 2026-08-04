import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { getErrorMessage } from '#/lib/errors';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

/**
 * Page/section-level failed-to-load state — mirrors the visual weight of the
 * existing "No X yet" empty states (same icon size/opacity/spacing
 * convention) but in red, with a retry action, so a failed fetch reads as
 * distinctly different from a genuinely empty result.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <AlertTriangleIcon size={40} className="mx-auto mb-3 text-red-500" />
      <p className="text-gray-700 dark:text-gray-300">{getErrorMessage(error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          aria-label="Try again"
          className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-blue-600 hover:underline"
        >
          <RefreshCwIcon size={14} /> <span className="hidden sm:inline">Try again</span>
        </button>
      )}
    </div>
  );
}
