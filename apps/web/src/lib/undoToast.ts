import { toast } from 'sonner';
import i18next from 'i18next';

type UndoToastOptions = {
  message: string;
  duration?: number;
  onExecute: () => void;
  onUndo: () => void;
};

let activeTimers: ReturnType<typeof setTimeout>[] = [];

export function showUndoToast({ message, duration = 5000, onExecute, onUndo }: UndoToastOptions) {
  const timer = setTimeout(() => {
    onExecute();
    activeTimers = activeTimers.filter((t) => t !== timer);
  }, duration);

  activeTimers.push(timer);

  toast(message, {
    duration,
    action: {
      label: i18next.t('common.undo'),
      onClick: () => {
        clearTimeout(timer);
        activeTimers = activeTimers.filter((t) => t !== timer);
        onUndo();
      },
    },
  });
}

export function clearAllUndoTimers() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
}
