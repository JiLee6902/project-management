import { useEffect, useCallback } from 'react';

/**
 * Hook to handle keyboard shortcuts
 * @param {Object} shortcuts - Object mapping shortcut keys to callbacks
 * Example: { 'cmd+k': () => {}, 'ctrl+shift+p': () => {} }
 */
export const useKeyboardShortcut = (shortcuts) => {
  const handleKeyDown = useCallback(
    (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey;
      const meta = event.metaKey; // Cmd key on Mac
      const shift = event.shiftKey;
      const alt = event.altKey;

      Object.entries(shortcuts).forEach(([shortcut, callback]) => {
        const parts = shortcut.toLowerCase().split('+');
        const targetKey = parts[parts.length - 1];
        const needsCmd = parts.includes('cmd') || parts.includes('meta');
        const needsCtrl = parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        // Check if the shortcut matches
        const keyMatches = key === targetKey;
        const cmdMatches = needsCmd ? meta : !meta;
        const ctrlMatches = needsCtrl ? ctrl : !needsCmd && !ctrl; // Allow Ctrl as Cmd alternative
        const shiftMatches = needsShift ? shift : !shift;
        const altMatches = needsAlt ? alt : !alt;

        // For cmd+k, also accept ctrl+k on non-Mac
        const isCmdK = needsCmd && targetKey === 'k';
        const ctrlKFallback = isCmdK && ctrl && !meta;

        if (
          keyMatches &&
          (cmdMatches || ctrlKFallback) &&
          (ctrlMatches || ctrlKFallback) &&
          shiftMatches &&
          altMatches
        ) {
          event.preventDefault();
          callback(event);
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook specifically for Command Palette (Cmd+K / Ctrl+K)
 */
export const useCommandPalette = (setIsOpen) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);
};

export default useKeyboardShortcut;
