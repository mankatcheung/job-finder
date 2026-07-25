import { formatKeyCombo, getKeyModifier } from '#/hooks/useHotkeys';
import { XIcon } from 'lucide-react';

interface Shortcut {
  keys: { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean };
  label: string;
}

const shortcuts: Shortcut[] = [
  { keys: { key: 'k', ctrl: true, shift: true }, label: 'Open command palette' },
  { keys: { key: 'n', ctrl: true }, label: 'New application' },
  { keys: { key: '/', ctrl: true }, label: 'Show keyboard shortcuts' },
  { keys: { key: 'Escape' }, label: 'Close modal / dialog' },
];

export function ShortcutCheatSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <XIcon size={16} />
          </button>
        </div>
        <ul className="py-2">
          {shortcuts.map((shortcut) => (
            <li
              key={shortcut.label}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300"
            >
              <span>{shortcut.label}</span>
              <kbd className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded font-mono">
                {formatKeyCombo(shortcut.keys)}
              </kbd>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          Press{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
            {getKeyModifier()} + /
          </kbd>{' '}
          to toggle this panel
        </div>
      </div>
    </div>
  );
}
