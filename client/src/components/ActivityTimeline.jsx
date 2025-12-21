import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  Circle,
  MessageSquare,
  UserPlus,
  Calendar,
  Flag,
  Tag,
  ListChecks,
  FolderPlus,
  UserMinus,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { activityService } from '../services/activityService';
import { useProjectSocket } from '../hooks/useSocket';

const activityIcons = {
  task_created: { icon: Circle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  task_updated: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  task_deleted: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  task_status_changed: { icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  task_priority_changed: { icon: Flag, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  task_assignee_changed: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  task_due_date_changed: { icon: Calendar, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  comment_added: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  comment_updated: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  comment_deleted: { icon: MessageSquare, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  subtask_added: { icon: ListChecks, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  subtask_completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  subtask_uncompleted: { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  label_added: { icon: Tag, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  label_removed: { icon: Tag, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  project_created: { icon: FolderPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  project_updated: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  project_member_added: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  project_member_removed: { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
};

const ActivityItem = ({ activity }) => {
  const iconConfig = activityIcons[activity.type] || {
    icon: Activity,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900/30'
  };
  const IconComponent = iconConfig.icon;

  return (
    <div className="flex gap-3 py-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${iconConfig.bg} flex items-center justify-center`}>
        <IconComponent className={`size-4 ${iconConfig.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-900 dark:text-zinc-100">
            <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
            {' '}
            <span className="text-gray-600 dark:text-zinc-400">
              {activity.description}
            </span>
            {activity.metadata?.taskTitle && (
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {' '}"{activity.metadata.taskTitle}"
              </span>
            )}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

const ActivityTimeline = ({ projectId, taskId, limit = 20, showHeader = true }) => {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const { handleActivityAdded } = useProjectSocket(projectId);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = taskId
        ? await activityService.getByTask(taskId, limit, 0)
        : await activityService.getByProject(projectId, limit, 0);

      setActivities(data.activities || []);
      setTotal(data.total || 0);
      setOffset(limit);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Listen for real-time activity updates
  useEffect(() => {
    const unsubscribe = handleActivityAdded((payload) => {
      // If we're filtering by taskId, only update if it matches
      if (taskId && payload.taskId !== taskId) return;
      // If we're filtering by projectId, only update if it matches
      if (projectId && payload.projectId !== projectId) return;

      setActivities((prev) => {
        // Avoid duplicates
        const exists = prev.some((a) => a.id === payload.activity.id);
        if (exists) return prev;
        // Add new activity at the beginning
        return [payload.activity, ...prev];
      });
      setTotal((prev) => prev + 1);
    });

    return unsubscribe;
  }, [handleActivityAdded, projectId, taskId]);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const data = taskId
        ? await activityService.getByTask(taskId, limit, offset)
        : await activityService.getByProject(projectId, limit, offset);

      setActivities(prev => [...prev, ...(data.activities || [])]);
      setOffset(prev => prev + limit);
    } catch (error) {
      console.error('Failed to load more activities:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasMore = activities.length < total;

  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Activity className="size-5 text-gray-500 dark:text-zinc-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
            Activity
          </h3>
          {total > 0 && (
            <span className="text-xs text-gray-500 dark:text-zinc-500">
              ({total})
            </span>
          )}
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-500 py-4 text-center">
          No activity yet
        </p>
      ) : (
        <>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                'Load more'
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityTimeline;
