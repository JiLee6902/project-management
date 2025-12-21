import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, Zap, Clock, Inbox } from 'lucide-react';

const QUADRANTS = {
  urgent_important: {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    icon: Zap,
    color: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-900/10',
    iconColor: 'text-red-500',
  },
  not_urgent_important: {
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    icon: Target,
    color: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    iconColor: 'text-blue-500',
  },
  urgent_not_important: {
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    icon: Clock,
    color: 'border-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    iconColor: 'text-yellow-500',
  },
  not_urgent_not_important: {
    title: 'Eliminate',
    subtitle: 'Not Urgent, Not Important',
    icon: Inbox,
    color: 'border-gray-400',
    bg: 'bg-gray-50 dark:bg-zinc-800/50',
    iconColor: 'text-gray-400',
  },
};

const PriorityMatrix = ({ tasks = [], projectId }) => {
  const categorizedTasks = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const result = {
      urgent_important: [],
      not_urgent_important: [],
      urgent_not_important: [],
      not_urgent_not_important: [],
    };

    tasks.forEach(task => {
      if (task.status === 'DONE') return;

      const isUrgent = task.dueDate && new Date(task.dueDate) <= threeDaysFromNow;
      const isImportant = task.priority === 'HIGH' || task.priority === 'CRITICAL';

      if (isUrgent && isImportant) {
        result.urgent_important.push(task);
      } else if (!isUrgent && isImportant) {
        result.not_urgent_important.push(task);
      } else if (isUrgent && !isImportant) {
        result.urgent_not_important.push(task);
      } else {
        result.not_urgent_not_important.push(task);
      }
    });

    return result;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="size-5" /> Priority Matrix (Eisenhower)
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Tasks due within 3 days = Urgent | High/Critical priority = Important
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(QUADRANTS).map(([key, config]) => {
          const Icon = config.icon;
          const quadrantTasks = categorizedTasks[key];

          return (
            <div
              key={key}
              className={`border-l-4 ${config.color} ${config.bg} rounded-lg p-4 min-h-[200px]`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`size-5 ${config.iconColor}`} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {config.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {config.subtitle}
                  </p>
                </div>
                <span className="ml-auto bg-white dark:bg-zinc-800 px-2 py-0.5 rounded text-sm font-medium">
                  {quadrantTasks.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {quadrantTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">
                    No tasks
                  </p>
                ) : (
                  quadrantTasks.map(task => (
                    <Link
                      key={task.id}
                      to={`/taskDetails?projectId=${projectId || task.projectId}&taskId=${task.id}`}
                      className="block p-2 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          task.priority === 'HIGH' || task.priority === 'CRITICAL'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                            : task.priority === 'MEDIUM'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                        }`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityMatrix;
