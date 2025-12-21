import { useState, useEffect } from 'react';
import {
  Filter,
  Save,
  Star,
  StarOff,
  Trash2,
  ChevronDown,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { savedFilterService } from '../services/savedFilterService';
import toast from 'react-hot-toast';

const SavedFilters = ({
  projectId,
  currentFilters,
  onApplyFilter,
  onClearFilter,
}) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchFilters();
    }
  }, [projectId]);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const filters = await savedFilterService.getFilters(projectId);
      setSavedFilters(filters);

      // Check for default filter
      const defaultFilter = filters.find(f => f.isDefault);
      if (defaultFilter && !activeFilter) {
        setActiveFilter(defaultFilter);
        onApplyFilter(defaultFilter.filters);
      }
    } catch (error) {
      console.error('Failed to fetch saved filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilter = async () => {
    if (!newFilterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }

    // Check if there are any active filters
    const hasActiveFilters = Object.values(currentFilters || {}).some(
      (value) => value && (Array.isArray(value) ? value.length > 0 : true)
    );

    if (!hasActiveFilters) {
      toast.error('No active filters to save');
      return;
    }

    setSaving(true);
    try {
      const filter = await savedFilterService.create({
        name: newFilterName,
        projectId,
        filters: currentFilters,
        isDefault: false,
      });
      setSavedFilters(prev => [filter, ...prev]);
      setNewFilterName('');
      setShowSaveDialog(false);
      toast.success('Filter saved successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save filter');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyFilter = (filter) => {
    setActiveFilter(filter);
    onApplyFilter(filter.filters);
    setShowDropdown(false);
  };

  const handleClearFilter = () => {
    setActiveFilter(null);
    onClearFilter();
    setShowDropdown(false);
  };

  const handleSetDefault = async (filter, e) => {
    e.stopPropagation();
    try {
      await savedFilterService.setAsDefault(filter.id);
      setSavedFilters(prev =>
        prev.map(f => ({
          ...f,
          isDefault: f.id === filter.id,
        }))
      );
      toast.success('Default filter updated');
    } catch (error) {
      toast.error('Failed to set default filter');
    }
  };

  const handleDeleteFilter = async (filter, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this filter?')) return;

    try {
      await savedFilterService.delete(filter.id);
      setSavedFilters(prev => prev.filter(f => f.id !== filter.id));
      if (activeFilter?.id === filter.id) {
        setActiveFilter(null);
        onClearFilter();
      }
      toast.success('Filter deleted');
    } catch (error) {
      toast.error('Failed to delete filter');
    }
  };

  const getActiveFilterCount = () => {
    if (!currentFilters) return 0;
    return Object.values(currentFilters).filter(
      (value) => value && (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="relative">
      {/* Filter Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition ${
            activeFilter || activeFilterCount > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
          }`}
        >
          <Filter className="size-4" />
          {activeFilter ? (
            <span>{activeFilter.name}</span>
          ) : (
            <span>Filters</span>
          )}
          {activeFilterCount > 0 && !activeFilter && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className="size-4" />
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
          >
            <Save className="size-4" />
            Save
          </button>
        )}

        {(activeFilter || activeFilterCount > 0) && (
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="size-4" />
            Clear
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-20 mt-2 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200 dark:border-zinc-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Saved Filters
            </h4>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : savedFilters.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-zinc-500">
              No saved filters yet
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  onClick={() => handleApplyFilter(filter)}
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 group ${
                    activeFilter?.id === filter.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {filter.isDefault && (
                      <Star className="size-4 text-yellow-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-zinc-100 truncate">
                      {filter.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleSetDefault(filter, e)}
                      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 ${
                        filter.isDefault
                          ? 'text-yellow-500'
                          : 'text-gray-400 dark:text-zinc-500'
                      }`}
                      title={filter.isDefault ? 'Remove default' : 'Set as default'}
                    >
                      {filter.isDefault ? (
                        <StarOff className="size-4" />
                      ) : (
                        <Star className="size-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteFilter(filter, e)}
                      className="p-1.5 rounded text-gray-400 dark:text-zinc-500 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      title="Delete filter"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 border-t border-gray-200 dark:border-zinc-700">
            <button
              onClick={() => {
                setShowDropdown(false);
                setShowSaveDialog(true);
              }}
              disabled={activeFilterCount === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-4" />
              Save Current Filter
            </button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Filter
            </h3>
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Filter name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewFilterName('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={saving || !newFilterName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default SavedFilters;
