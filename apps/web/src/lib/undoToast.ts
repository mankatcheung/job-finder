import { toast } from 'sonner';
import i18next from 'i18next';

type UndoToastOptions = {
  message: string;
  duration?: number;
  onExecute: () => void;
  onUndo: () => void;
};

type UndoableActionToastOptions = {
  message: string;
  duration?: number;
  onUndo: () => void;
};

/**
 * Defers an irreversible operation until the undo window closes.
 *
 * Only for operations the server cannot reverse — deleting a note, a contact,
 * an interview round, a document. For those, "undo" can only mean "never send
 * it", so the request has to wait.
 *
 * The pending call lives in a `setTimeout`, which means it does not survive
 * the page: a refresh or a closed tab inside the window drops the operation
 * after the UI has already reported it as done. Prefer
 * `showUndoableActionToast` wherever a real reversing operation exists —
 * see JEF-190.
 */
export function showUndoToast({ message, duration = 5000, onExecute, onUndo }: UndoToastOptions) {
  const timer = setTimeout(() => {
    onExecute();
  }, duration);

  toast(message, {
    duration,
    action: {
      label: i18next.t('common.undo'),
      onClick: () => {
        clearTimeout(timer);
        onUndo();
      },
    },
  });
}

/**
 * Offers to reverse an operation that has **already happened**.
 *
 * Nothing is deferred: the caller performs the operation up front, so the UI
 * can settle immediately, and `onUndo` issues a real compensating request
 * (restore, re-create) rather than cancelling a timer.
 *
 * Because no pending work is held in memory, closing the tab cannot lose it,
 * and the undo window is a courtesy rather than a deadline — an application
 * missed here is still recoverable from Trash for thirty days.
 */
export function showUndoableActionToast({
  message,
  duration = 5000,
  onUndo,
}: UndoableActionToastOptions) {
  toast(message, {
    duration,
    action: { label: i18next.t('common.undo'), onClick: onUndo },
  });
}
