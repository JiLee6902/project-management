import { useState, useEffect } from 'react';
import { Eye, EyeOff, Users, Loader2 } from 'lucide-react';
import api from '../configs/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TaskWatchers = ({ taskId }) => {
  const { user } = useAuth();
  const [watchers, setWatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const isWatching = watchers.some(w => w.userId === user?.id);

  useEffect(() => {
    if (taskId) {
      fetchWatchers();
    }
  }, [taskId]);

  const fetchWatchers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks/${taskId}/watchers`);
      setWatchers(data.watchers || []);
    } catch (error) {
      console.error('Failed to fetch watchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatch = async () => {
    setToggling(true);
    try {
      if (isWatching) {
        await api.delete(`/tasks/${taskId}/watchers`);
        setWatchers(prev => prev.filter(w => w.userId !== user?.id));
        toast.success('Stopped watching task');
      } else {
        const { data } = await api.post(`/tasks/${taskId}/watchers`);
        setWatchers(prev => [...prev, data.watcher]);
        toast.success('Now watching task');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update watch status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleWatch}
        disabled={toggling || loading}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition ${
          isWatching
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
        }`}
      >
        {toggling ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isWatching ? (
          <Eye className="size-4" />
        ) : (
          <EyeOff className="size-4" />
        )}
        {isWatching ? 'Watching' : 'Watch'}
      </button>

      {watchers.length > 0 && (
        <div className="flex items-center gap-1">
          <Users className="size-4 text-gray-400" />
          <div className="flex -space-x-2">
            {watchers.slice(0, 5).map((watcher) => (
              <div
                key={watcher.id}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-zinc-900"
                title={watcher.user?.name}
              >
                {watcher.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
            {watchers.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-zinc-600 flex items-center justify-center text-gray-600 dark:text-zinc-300 text-xs font-medium border-2 border-white dark:border-zinc-900">
                +{watchers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskWatchers;
