import { formatKeyCombo, getKeyModifier } from '#/hooks/useHotkeys';
import { Modal } from '@trakwyn/ui';

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
  return (
    <Modal open={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="sm">
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
    </Modal>
  );
}
