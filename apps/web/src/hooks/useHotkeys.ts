import { useEffect, useCallback } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type HotkeyHandler = (e: KeyboardEvent) => void;

const isMac = typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac');

export function getKeyModifier(): string {
  return isMac ? '⌘' : 'Ctrl';
}

export function formatKeyCombo(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.ctrl) parts.push(getKeyModifier());
  if (combo.meta) parts.push(getKeyModifier());
  if (combo.shift) parts.push('Shift');
  if (combo.alt) parts.push('Alt');
  parts.push(combo.key.toUpperCase());
  return parts.join(' + ');
}

export function useHotkeys(combo: KeyCombo, handler: HotkeyHandler, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
      const ctrlMatch = combo.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const metaMatch = combo.meta ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
      const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = combo.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        handler(e);
      }
    },
    [combo, handler, enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
