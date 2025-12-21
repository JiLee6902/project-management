import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { subtaskService } from '../services/subtaskService';
import toast from 'react-hot-toast';

const SubtaskList = ({ taskId }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchSubtasks();
    }
  }, [taskId]);

  const fetchSubtasks = async () => {
    try {
      setLoading(true);
      const { subtasks: data } = await subtaskService.getByTask(taskId);
      setSubtasks(data || []);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      setAddingSubtask(true);
      const { subtask } = await subtaskService.create({
        taskId,
        title: newSubtaskTitle.trim(),
      });
      setSubtasks([...subtasks, subtask]);
      setNewSubtaskTitle('');
      toast.success('Subtask added');
    } catch (error) {
      toast.error('Failed to add subtask');
      console.error(error);
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggle = async (subtaskId) => {
    try {
      // Optimistic update
      setSubtasks(prev =>
        prev.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        )
      );
      await subtaskService.toggle(subtaskId);
    } catch (error) {
      // Revert on error
      setSubtasks(prev =>
        prev.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        )
      );
      toast.error('Failed to update subtask');
    }
  };

  const handleStartEdit = (subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = async () => {
    if (!editingTitle.trim() || !editingId) return;

    try {
      await subtaskService.update(editingId, { title: editingTitle.trim() });
      setSubtasks(prev =>
        prev.map(s =>
          s.id === editingId ? { ...s, title: editingTitle.trim() } : s
        )
      );
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      toast.error('Failed to update subtask');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = async (subtaskId) => {
    try {
      await subtaskService.delete(subtaskId);
      setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
      toast.success('Subtask deleted');
    } catch (error) {
      toast.error('Failed to delete subtask');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Calculate progress
  const completedCount = subtasks.filter(s => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading subtasks...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <CheckSquare className="size-4" />
          Checklist
          {totalCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h3>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {/* Drag handle (visual only for now) */}
            <GripVertical className="size-4 text-gray-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab" />

            {/* Checkbox */}
            <button
              onClick={() => handleToggle(subtask.id)}
              className="flex-shrink-0"
            >
              {subtask.completed ? (
                <CheckSquare className="size-5 text-green-500" />
              ) : (
                <Square className="size-5 text-gray-400 dark:text-zinc-500" />
              )}
            </button>

            {/* Title / Edit input */}
            {editingId === subtask.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 text-sm bg-transparent border-b border-zinc-400 dark:border-zinc-600 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-zinc-100"
              />
            ) : (
              <span
                onClick={() => handleStartEdit(subtask)}
                className={`flex-1 text-sm cursor-pointer ${
                  subtask.completed
                    ? 'line-through text-gray-400 dark:text-zinc-500'
                    : 'text-gray-900 dark:text-zinc-100'
                }`}
              >
                {subtask.title}
              </span>
            )}

            {/* Delete button */}
            <button
              onClick={() => handleDelete(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new subtask */}
      <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
        <Plus className="size-5 text-gray-400 dark:text-zinc-500" />
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
          disabled={addingSubtask}
        />
        {addingSubtask && (
          <Loader2 className="size-4 animate-spin text-gray-400" />
        )}
      </form>
    </div>
  );
};

export default SubtaskList;
