import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../features/themeSlice';
import {
  Search,
  Home,
  FolderKanban,
  Users,
  Settings,
  Plus,
  Sun,
  Moon,
  LogOut,
  FileText,
  CheckSquare,
  Command,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CommandPalette = ({ isOpen, setIsOpen }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const { theme } = useSelector((state) => state.theme);
  const { projects } = useSelector((state) => state.workspace);

  // Define all commands
  const commands = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'View your dashboard',
      icon: Home,
      category: 'Navigation',
      action: () => navigate('/'),
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      description: 'View all projects',
      icon: FolderKanban,
      category: 'Navigation',
      action: () => navigate('/projects'),
      keywords: ['project', 'list', 'all'],
    },
    {
      id: 'nav-team',
      title: 'Go to Team',
      description: 'View team members',
      icon: Users,
      category: 'Navigation',
      action: () => navigate('/team'),
      keywords: ['members', 'people', 'users'],
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      description: 'Manage your settings',
      icon: Settings,
      category: 'Navigation',
      action: () => navigate('/settings'),
      keywords: ['preferences', 'config', 'account'],
    },

    // Actions
    {
      id: 'action-create-project',
      title: 'Create New Project',
      description: 'Start a new project',
      icon: Plus,
      category: 'Actions',
      action: () => {
        navigate('/projects');
        // Trigger create project dialog via custom event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-create-project'));
        }, 100);
      },
      keywords: ['new', 'add', 'project'],
    },
    {
      id: 'action-create-task',
      title: 'Create New Task',
      description: 'Add a new task',
      icon: CheckSquare,
      category: 'Actions',
      action: () => {
        window.dispatchEvent(new CustomEvent('open-create-task'));
      },
      keywords: ['new', 'add', 'task', 'todo'],
    },

    // Theme
    {
      id: 'theme-toggle',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle between dark and light theme',
      icon: theme === 'dark' ? Sun : Moon,
      category: 'Theme',
      action: () => dispatch(toggleTheme()),
      keywords: ['dark', 'light', 'mode', 'theme', 'appearance'],
    },

    // Account
    {
      id: 'account-logout',
      title: 'Log Out',
      description: 'Sign out of your account',
      icon: LogOut,
      category: 'Account',
      action: () => {
        logout();
        navigate('/login');
      },
      keywords: ['sign out', 'exit', 'leave'],
    },

    // Dynamic project navigation
    ...(projects || []).slice(0, 5).map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      description: 'Open project',
      icon: FileText,
      category: 'Recent Projects',
      action: () => navigate(`/projectsDetail?id=${project.id}`),
      keywords: [project.name.toLowerCase()],
    })),
  ], [navigate, dispatch, logout, theme, projects]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchDescription = cmd.description.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some((k) => k.includes(lowerQuery));
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
      return matchTitle || matchDescription || matchKeywords || matchCategory;
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, setIsOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = (command) => {
    setIsOpen(false);
    command.action();
  };

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div
          className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <Search className="w-5 h-5 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 outline-none text-base"
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {category}
                  </div>
                  {cmds.map((cmd) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        data-index={flatIndex}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-zinc-100 dark:bg-zinc-800'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {cmd.title}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {cmd.description}
                          </div>
                        </div>
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">↵</kbd>
                to select
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Command className="w-3 h-3" />
              <span>K to open</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
