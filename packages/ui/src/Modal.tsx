import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { IconButton } from './IconButton';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalSize = 'sm' | 'md' | 'lg';
/**
 * Where the panel sits. `bottom` is the mobile sheet: same dialog, same focus
 * trap and Escape handling, different geometry — full width, anchored to the
 * bottom edge, rounded on top only.
 */
export type ModalPosition = 'center' | 'bottom';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /**
   * Accessible name for a dialog with no visible title — a bottom sheet whose
   * header is a grab handle, say. Ignored when `title` is a string, which
   * already names the dialog.
   */
  ariaLabel?: string;
  size?: ModalSize;
  position?: ModalPosition;
  children: ReactNode;
}

/**
 * Centered overlay dialog with a backdrop, Escape-to-close, and focus
 * trapping. Renders via a portal to `document.body`.
 *
 * @category Overlay
 */
export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  size = 'md',
  position = 'center',
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? panel)?.focus();

    return () => {
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center ${
        position === 'bottom' ? 'items-end p-0' : 'items-center p-4'
      }`}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : ariaLabel}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`relative bg-white dark:bg-gray-800 shadow-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 ${
          position === 'bottom'
            ? 'rounded-t-2xl border-b-0 pb-[env(safe-area-inset-bottom)]'
            : `rounded-xl ${SIZE_CLASSES[size]}`
        }`}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h2>
            <IconButton label="Close" icon={<XIcon size={16} />} size="sm" onClick={onClose} />
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
