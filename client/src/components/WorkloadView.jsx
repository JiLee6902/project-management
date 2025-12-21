import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import api from "../configs/api";
import toast from "react-hot-toast";

const WorkloadView = () => {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkload();
    }
  }, [currentWorkspace?.id]);

  const fetchWorkload = async () => {
    try {
      const { data } = await api.get(`/tasks/workload/${currentWorkspace.id}`);
      setWorkload(data.workload || []);
    } catch (error) {
      toast.error("Failed to load workload data");
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadLevel = (taskCount, storyPoints) => {
    if (taskCount === 0) return { label: "Available", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" };
    if (taskCount <= 3 || storyPoints <= 8) return { label: "Light", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" };
    if (taskCount <= 6 || storyPoints <= 15) return { label: "Moderate", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" };
    return { label: "Heavy", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="size-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
        <Users className="size-5" /> Team Workload
      </h2>

      {workload.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
          No team members found
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workload.map((member) => {
            const level = getWorkloadLevel(member.taskCount, member.totalStoryPoints);

            return (
              <div
                key={member.user.id}
                className="p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white font-medium">
                    {member.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-900 dark:text-white truncate">
                      {member.user.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {member.user.email}
                    </p>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${level.bg} ${level.color}`}>
                    {level.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center p-2 bg-zinc-50 dark:bg-zinc-900 rounded">
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {member.taskCount}
                    </p>
                    <p className="text-xs text-zinc-500">Tasks</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {member.totalStoryPoints}
                    </p>
                    <p className="text-xs text-zinc-500">Points</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {member.overdueTasks}
                    </p>
                    <p className="text-xs text-zinc-500">Overdue</p>
                  </div>
                </div>

                {member.overdueTasks > 0 && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="size-3" />
                    {member.overdueTasks} overdue task{member.overdueTasks > 1 ? "s" : ""}
                  </div>
                )}

                {member.tasks?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 mb-2">Current tasks:</p>
                    <div className="space-y-1">
                      {member.tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex items-center gap-1"
                        >
                          {task.status === "IN_PROGRESS" ? (
                            <Clock className="size-3 text-blue-500" />
                          ) : (
                            <CheckCircle2 className="size-3 text-zinc-400" />
                          )}
                          {task.title}
                        </div>
                      ))}
                      {member.tasks.length > 3 && (
                        <p className="text-xs text-zinc-400">
                          +{member.tasks.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkloadView;
