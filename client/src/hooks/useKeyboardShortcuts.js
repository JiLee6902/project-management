import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = {
  // Navigation
  'g h': { description: 'Go to Dashboard', action: 'navigate', path: '/' },
  'g p': { description: 'Go to Projects', action: 'navigate', path: '/projects' },
  'g t': { description: 'Go to My Tasks', action: 'navigate', path: '/my-tasks' },
  'g m': { description: 'Go to Team', action: 'navigate', path: '/team' },
  'g s': { description: 'Go to Settings', action: 'navigate', path: '/settings' },

  // Actions
  'c': { description: 'Open Command Palette', action: 'command_palette' },
  'n t': { description: 'New Task', action: 'new_task' },
  'n p': { description: 'New Project', action: 'new_project' },
  '/': { description: 'Focus Search', action: 'focus_search' },
  '?': { description: 'Show Shortcuts', action: 'show_shortcuts' },
  'Escape': { description: 'Close Modal / Cancel', action: 'escape' },
};

export const useKeyboardShortcuts = (handlers = {}) => {
  const navigate = useNavigate();
  const [keySequence, setKeySequence] = useState('');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const resetSequence = useCallback(() => {
    setKeySequence('');
  }, []);

  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable
    ) {
      if (event.key === 'Escape') {
        event.target.blur();
      }
      return;
    }

    const key = event.key.toLowerCase();

    // Build key sequence
    const newSequence = keySequence ? `${keySequence} ${key}` : key;

    // Check for exact match
    const shortcut = SHORTCUTS[newSequence];

    if (shortcut) {
      event.preventDefault();
      resetSequence();

      switch (shortcut.action) {
        case 'navigate':
          navigate(shortcut.path);
          break;
        case 'command_palette':
          handlers.openCommandPalette?.();
          break;
        case 'new_task':
          handlers.openNewTask?.();
          break;
        case 'new_project':
          handlers.openNewProject?.();
          break;
        case 'focus_search':
          handlers.focusSearch?.();
          break;
        case 'show_shortcuts':
          setShowShortcutsHelp(true);
          break;
        case 'escape':
          handlers.onEscape?.();
          setShowShortcutsHelp(false);
          break;
        default:
          break;
      }
    } else if (Object.keys(SHORTCUTS).some(s => s.startsWith(newSequence))) {
      // Partial match - keep building sequence
      setKeySequence(newSequence);

      // Reset after 1.5 seconds
      setTimeout(resetSequence, 1500);
    } else {
      resetSequence();
    }
  }, [keySequence, navigate, handlers, resetSequence]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showShortcutsHelp,
    setShowShortcutsHelp,
    shortcuts: SHORTCUTS,
    currentSequence: keySequence,
  };
};

export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const groupedShortcuts = {
    Navigation: Object.entries(SHORTCUTS).filter(([_, v]) => v.action === 'navigate'),
    Actions: Object.entries(SHORTCUTS).filter(([_, v]) => v.action !== 'navigate'),
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {Object.entries(groupedShortcuts).map(([group, shortcuts]) => (
            <div key={group} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                {group}
              </h3>
              <div className="space-y-2">
                {shortcuts.map(([keys, config]) => (
                  <div key={keys} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-zinc-300">
                      {config.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {keys.split(' ').map((key, idx) => (
                        <span key={idx}>
                          <kbd className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs rounded border border-gray-200 dark:border-zinc-700 font-mono">
                            {key === ' ' ? 'Space' : key.toUpperCase()}
                          </kbd>
                          {idx < keys.split(' ').length - 1 && (
                            <span className="mx-1 text-gray-400">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-zinc-700 text-center">
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs">?</kbd> to show this help
          </p>
        </div>
      </div>
    </div>
  );
};

export default useKeyboardShortcuts;
