import { useState } from 'react';
import { X, Trash2, ArrowRight, Edit, Loader2 } from 'lucide-react';
import api from '../configs/api';
import toast from 'react-hot-toast';

const BulkActionsBar = ({
  selectedTasks = [],
  onClearSelection,
  onTasksUpdated,
  projects = [],
  sprints = [],
  teamMembers = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [updateData, setUpdateData] = useState({
    status: '',
    priority: '',
    assigneeId: '',
    sprintId: '',
  });

  if (selectedTasks.length === 0) return null;

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/tasks/delete', { taskIds: selectedTasks });
      toast.success(`${selectedTasks.length} tasks deleted`);
      onClearSelection();
      onTasksUpdated?.();
    } catch (error) {
      toast.error('Failed to delete tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    const updates = {};
    if (updateData.status) updates.status = updateData.status;
    if (updateData.priority) updates.priority = updateData.priority;
    if (updateData.assigneeId) updates.assigneeId = updateData.assigneeId;
    if (updateData.sprintId) updates.sprintId = updateData.sprintId;

    if (Object.keys(updates).length === 0) {
      toast.error('No updates selected');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tasks/bulk/update', {
        taskIds: selectedTasks,
        updates,
      });
      toast.success(`${selectedTasks.length} tasks updated`);
      setShowUpdateDialog(false);
      onClearSelection();
      onTasksUpdated?.();
    } catch (error) {
      toast.error('Failed to update tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMove = async () => {
    if (!targetProjectId) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tasks/bulk/move', {
        taskIds: selectedTasks,
        targetProjectId,
      });
      toast.success(`${selectedTasks.length} tasks moved`);
      setShowMoveDialog(false);
      onClearSelection();
      onTasksUpdated?.();
    } catch (error) {
      toast.error('Failed to move tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-3 bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-3 rounded-lg shadow-xl border border-zinc-700">
          <span className="text-sm font-medium">
            {selectedTasks.length} selected
          </span>

          <div className="h-5 w-px bg-zinc-600" />

          <button
            onClick={() => setShowUpdateDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-zinc-700 rounded transition"
          >
            <Edit className="size-4" />
            Update
          </button>

          <button
            onClick={() => setShowMoveDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-zinc-700 rounded transition"
          >
            <ArrowRight className="size-4" />
            Move
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30 rounded transition"
          >
            <Trash2 className="size-4" />
            Delete
          </button>

          <div className="h-5 w-px bg-zinc-600" />

          <button
            onClick={onClearSelection}
            className="p-1.5 hover:bg-zinc-700 rounded transition"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Update Dialog */}
      {showUpdateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Update {selectedTasks.length} Tasks
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                >
                  <option value="">No change</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Priority
                </label>
                <select
                  value={updateData.priority}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                >
                  <option value="">No change</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Assignee
                </label>
                <select
                  value={updateData.assigneeId}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, assigneeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                >
                  <option value="">No change</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUpdateDialog(false)}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Move {selectedTasks.length} Tasks
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Target Project
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMoveDialog(false)}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMove}
                disabled={loading || !targetProjectId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsBar;
