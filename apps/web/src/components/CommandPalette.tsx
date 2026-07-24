import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  SearchIcon,
  BriefcaseIcon,
  LayoutDashboardIcon,
  BarChart2Icon,
  UserIcon,
  PlusIcon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Go to Dashboard',
        icon: <LayoutDashboardIcon size={16} />,
        action: () => navigate({ to: '/dashboard' }),
      },
      {
        id: 'applications',
        label: 'Go to Applications',
        icon: <BriefcaseIcon size={16} />,
        action: () => navigate({ to: '/applications' }),
      },
      {
        id: 'new-application',
        label: 'New Application',
        shortcut: '⌘N',
        icon: <PlusIcon size={16} />,
        action: () => navigate({ to: '/applications/new' }),
      },
      {
        id: 'analytics',
        label: 'Go to Analytics',
        icon: <BarChart2Icon size={16} />,
        action: () => navigate({ to: '/analytics' }),
      },
      {
        id: 'account',
        label: 'Go to Account',
        icon: <UserIcon size={16} />,
        action: () => navigate({ to: '/account' }),
      },
    ],
    [navigate],
  );

  const filtered = useMemo(() => {
    if (!query) return commands;
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()));
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <SearchIcon size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded">
            ESC
          </kbd>
        </div>
        <ul className="max-h-64 overflow-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No results</li>
          )}
          {filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm ${
                i === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => {
                cmd.action();
                setIsOpen(false);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="text-gray-400">{cmd.icon}</span>
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  {cmd.shortcut}
                </kbd>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
