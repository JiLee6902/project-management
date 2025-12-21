import { useState } from 'react';
import { X, Loader2, Pencil, Trash2 } from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#78716c',
];

const LabelManager = ({
  isOpen,
  onClose,
  labels = [],
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  loading = false,
}) => {
  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingLabel, setEditingLabel] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setColor('#3b82f6');
    setEditingLabel(null);
    setMode('list');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreateLabel({ name: name.trim(), color });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !editingLabel) return;
    setSaving(true);
    try {
      await onUpdateLabel(editingLabel.id, { name: name.trim(), color });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (labelId) => {
    if (!confirm('Are you sure you want to delete this label?')) return;
    await onDeleteLabel(labelId);
  };

  const startEdit = (label) => {
    setEditingLabel(label);
    setName(label.name);
    setColor(label.color);
    setMode('edit');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {mode === 'list' && 'Manage Labels'}
              {mode === 'create' && 'Create Label'}
              {mode === 'edit' && 'Edit Label'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {mode === 'list' ? (
              <>
                {/* Labels List */}
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                    </div>
                  ) : labels.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500">
                      No labels yet. Create your first label!
                    </div>
                  ) : (
                    labels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {label.name}
                        </span>
                        <button
                          onClick={() => startEdit(label)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-zinc-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(label.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Create New Button */}
                <button
                  onClick={() => setMode('create')}
                  className="w-full py-2 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Create New Label
                </button>
              </>
            ) : (
              <>
                {/* Create/Edit Form */}
                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter label name"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      maxLength={50}
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-8 h-8 rounded-lg transition-transform ${
                            color === c ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Preview
                    </label>
                    <span
                      className="inline-flex px-2.5 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: color,
                        color: getContrastColor(color),
                      }}
                    >
                      {name || 'Label'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={resetForm}
                      className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={mode === 'edit' ? handleUpdate : handleCreate}
                      disabled={saving || !name.trim()}
                      className="flex-1 py-2 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                      ) : mode === 'edit' ? (
                        'Save Changes'
                      ) : (
                        'Create Label'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Helper function
const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export default LabelManager;
