import { useState, useEffect } from 'react';
import { Link2, X, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../configs/api';
import toast from 'react-hot-toast';

const DEPENDENCY_TYPES = {
  blocked_by: { label: 'Blocked by', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20' },
  blocks: { label: 'Blocks', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/20' },
  relates_to: { label: 'Related to', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  duplicates: { label: 'Duplicates', color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-900/20' },
};

const TaskDependencies = ({ taskId, projectTasks = [] }) => {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedType, setSelectedType] = useState('blocked_by');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchDependencies();
    }
  }, [taskId]);

  const fetchDependencies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks/${taskId}/dependencies`);
      setDependencies(data.dependencies || []);
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDependency = async () => {
    if (!selectedTask) {
      toast.error('Please select a task');
      return;
    }

    setAdding(true);
    try {
      const { data } = await api.post(`/tasks/${taskId}/dependencies`, {
        dependsOnTaskId: selectedTask,
        type: selectedType,
      });
      setDependencies(prev => [...prev, data.dependency]);
      setShowAddDialog(false);
      setSelectedTask('');
      toast.success('Dependency added');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add dependency');
    } finally {
      setAdding(false);
    }
  };

  const removeDependency = async (dependencyId) => {
    try {
      await api.delete(`/tasks/dependencies/${dependencyId}`);
      setDependencies(prev => prev.filter(d => d.id !== dependencyId));
      toast.success('Dependency removed');
    } catch (error) {
      toast.error('Failed to remove dependency');
    }
  };

  const availableTasks = projectTasks.filter(
    t => t.id !== taskId && !dependencies.some(d => d.dependsOnTaskId === t.id || d.taskId === t.id)
  );

  const blockedByTasks = dependencies.filter(d => d.taskId === taskId && d.type === 'blocked_by');
  const blocksTasks = dependencies.filter(d => d.dependsOnTaskId === taskId && d.type === 'blocked_by');
  const relatedTasks = dependencies.filter(d => d.type === 'relates_to' || d.type === 'duplicates');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-zinc-500 dark:text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Dependencies
          </h3>
          {dependencies.length > 0 && (
            <span className="text-xs text-zinc-500">({dependencies.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-zinc-400" />
        </div>
      ) : dependencies.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center py-2">
          No dependencies
        </p>
      ) : (
        <div className="space-y-3">
          {blockedByTasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                <AlertCircle className="size-3" /> Blocked by
              </p>
              {blockedByTasks.map(dep => (
                <DependencyItem
                  key={dep.id}
                  dependency={dep}
                  task={dep.dependsOnTask}
                  taskId={taskId}
                  onRemove={() => removeDependency(dep.id)}
                />
              ))}
            </div>
          )}

          {blocksTasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-500 mb-1">Blocks</p>
              {blocksTasks.map(dep => (
                <DependencyItem
                  key={dep.id}
                  dependency={dep}
                  task={dep.task}
                  taskId={taskId}
                  onRemove={() => removeDependency(dep.id)}
                />
              ))}
            </div>
          )}

          {relatedTasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-500 mb-1">Related</p>
              {relatedTasks.map(dep => (
                <DependencyItem
                  key={dep.id}
                  dependency={dep}
                  task={dep.taskId === taskId ? dep.dependsOnTask : dep.task}
                  taskId={taskId}
                  onRemove={() => removeDependency(dep.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Add Dependency
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {Object.entries(DEPENDENCY_TYPES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">Select a task...</option>
                  {availableTasks.map(task => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addDependency}
                disabled={adding || !selectedTask}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {adding && <Loader2 className="size-4 animate-spin" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DependencyItem = ({ dependency, task, taskId, onRemove }) => {
  const typeConfig = DEPENDENCY_TYPES[dependency.type] || DEPENDENCY_TYPES.relates_to;

  return (
    <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded group">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs px-2 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color}`}>
          {task?.status}
        </span>
        <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {task?.title}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default TaskDependencies;
