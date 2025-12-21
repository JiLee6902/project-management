import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Target,
  ChevronDown,
  ChevronRight,
  Loader2,
  MoreVertical,
  Trash2,
  Edit2
} from "lucide-react";
import api from "../configs/api";
import toast from "react-hot-toast";

const SprintBoard = ({ projectId }) => {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (projectId) {
      fetchSprints();
    }
  }, [projectId]);

  const fetchSprints = async () => {
    try {
      const { data } = await api.get(`/sprints/project/${projectId}`);
      setSprints(data.sprints || []);
      // Expand active sprint by default
      const activeSprint = data.sprints?.find(s => s.status === "ACTIVE");
      if (activeSprint) {
        setExpandedSprints({ [activeSprint.id]: true });
      }
    } catch (error) {
      toast.error("Failed to load sprints");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) {
      toast.error("Sprint name is required");
      return;
    }

    try {
      const { data } = await api.post("/sprints", {
        ...newSprint,
        projectId,
      });
      setSprints(prev => [data.sprint, ...prev]);
      setShowCreateDialog(false);
      setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
      toast.success("Sprint created successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create sprint");
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      await api.put(`/sprints/${sprintId}/start`);
      fetchSprints();
      toast.success("Sprint started");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId) => {
    try {
      await api.put(`/sprints/${sprintId}/complete`);
      fetchSprints();
      toast.success("Sprint completed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to complete sprint");
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!confirm("Are you sure you want to delete this sprint?")) return;

    try {
      await api.delete(`/sprints/${sprintId}`);
      setSprints(prev => prev.filter(s => s.id !== sprintId));
      toast.success("Sprint deleted");
    } catch (error) {
      toast.error("Failed to delete sprint");
    }
  };

  const toggleExpand = (sprintId) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId],
    }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      PLANNING: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300",
      ACTIVE: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      COMPLETED: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    };
    return styles[status] || styles.PLANNING;
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Target className="size-5" /> Sprints
        </h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          <Plus className="size-4" /> New Sprint
        </button>
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          <Target className="size-12 mx-auto mb-3 opacity-50" />
          <p>No sprints yet</p>
          <p className="text-sm">Create your first sprint to organize tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
            >
              <div
                className="p-4 bg-white dark:bg-zinc-800/50 cursor-pointer"
                onClick={() => toggleExpand(sprint.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSprints[sprint.id] ? (
                      <ChevronDown className="size-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="size-4 text-zinc-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-900 dark:text-white">
                          {sprint.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(sprint.status)}`}>
                          {sprint.status}
                        </span>
                      </div>
                      {sprint.goal && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          {sprint.goal}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {sprint.completedTasks}/{sprint.totalTasks}
                      </span>{" "}
                      tasks
                    </div>

                    {sprint.totalPoints > 0 && (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {sprint.completedPoints}/{sprint.totalPoints}
                        </span>{" "}
                        points
                      </div>
                    )}

                    {sprint.status === "PLANNING" && (
                      <button
                        onClick={() => handleStartSprint(sprint.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Play className="size-3" /> Start
                      </button>
                    )}

                    {sprint.status === "ACTIVE" && (
                      <button
                        onClick={() => handleCompleteSprint(sprint.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <CheckCircle2 className="size-3" /> Complete
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteSprint(sprint.id)}
                      className="p-1 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {(sprint.startDate || sprint.endDate) && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Calendar className="size-3" />
                    {sprint.startDate && format(new Date(sprint.startDate), "MMM d")}
                    {sprint.startDate && sprint.endDate && " - "}
                    {sprint.endDate && format(new Date(sprint.endDate), "MMM d, yyyy")}
                  </div>
                )}

                {sprint.totalTasks > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(sprint.completedTasks / sprint.totalTasks) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {expandedSprints[sprint.id] && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Sprint tasks will appear here. Drag tasks from backlog to add them.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Sprint Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Create New Sprint
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Sprint Name *
                </label>
                <input
                  type="text"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  placeholder="Sprint 1"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Sprint Goal
                </label>
                <textarea
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  placeholder="What do you want to achieve?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSprint}
                className="px-4 py-2 text-sm bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                Create Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintBoard;
