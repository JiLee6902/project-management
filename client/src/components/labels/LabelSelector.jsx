import { useState, useRef, useEffect } from 'react';
import { Check, Plus, Tag, Search, Loader2 } from 'lucide-react';
import LabelBadge from './LabelBadge';

const LabelSelector = ({
  labels = [],
  selectedLabels = [],
  onSelect,
  onDeselect,
  onCreateNew,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedIds = selectedLabels.map((l) => l.id);

  const handleToggle = (label) => {
    if (selectedIds.includes(label.id)) {
      onDeselect?.(label.id);
    } else {
      onSelect?.(label);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <Tag className="w-4 h-4" />
        <span>Labels</span>
        {selectedLabels.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded-full">
            {selectedLabels.length}
          </span>
        )}
      </button>

      {/* Selected Labels Preview */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((label) => (
            <LabelBadge
              key={label.id}
              label={label}
              size="xs"
              onRemove={onDeselect}
            />
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search labels..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Labels List */}
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
              </div>
            ) : filteredLabels.length === 0 ? (
              <div className="py-4 text-center text-sm text-zinc-500">
                No labels found
              </div>
            ) : (
              filteredLabels.map((label) => {
                const isSelected = selectedIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggle(label)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 text-left text-sm text-zinc-700 dark:text-zinc-300 truncate">
                      {label.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Create New */}
          {onCreateNew && (
            <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create new label
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabelSelector;
