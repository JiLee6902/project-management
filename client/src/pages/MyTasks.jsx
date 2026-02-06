import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Loader2
} from "lucide-react";
import api from "../configs/api";
import toast from "react-hot-toast";
import { LabelBadge } from "../components/labels";

const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [grouped, setGrouped] = useState({ todo: [], inProgress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    todo: true,
    inProgress: true,
    done: false,
  });

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const { data } = await api.get("/tasks/my/assigned");
      setTasks(data.tasks || []);
      setGrouped(data.grouped || { todo: [], inProgress: [], done: [] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getDueDateInfo = (dueDate, status) => {
    if (!dueDate || status === "DONE" || status === "CLOSED") return null;
    const date = new Date(dueDate);

    if (isPast(date) && !isToday(date)) {
      return { label: "Overdue", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
    }
    if (isToday(date)) {
      return { label: "Due Today", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" };
    }
    if (isTomorrow(date)) {
      return { label: "Due Tomorrow", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" };
    }
    return null;
  };

  const TaskCard = ({ task }) => {
    const dueDateInfo = getDueDateInfo(task.dueDate, task.status);

    return (
      <div
        onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
        className="p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {task.status === "DONE" || task.status === "CLOSED" ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : task.status === "IN_PROGRESS" ? (
              <Clock className="size-5 text-blue-500" />
            ) : (
              <Circle className="size-5 text-zinc-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${task.status === "DONE" || task.status === "CLOSED" ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>
              {task.title}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {task.project?.name}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.labels?.slice(0, 2).map(label => (
                <LabelBadge key={label.id} label={label} size="xs" />
              ))}

              {task.dueDate && (
                <span className={`text-xs flex items-center gap-1 ${dueDateInfo?.color || "text-zinc-500"}`}>
                  <Calendar className="size-3" />
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}

              {dueDateInfo && (
                <span className={`text-xs px-2 py-0.5 rounded ${dueDateInfo.bg} ${dueDateInfo.color}`}>
                  {dueDateInfo.label}
                </span>
              )}

              {task.storyPoints && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  {task.storyPoints} pts
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TaskSection = ({ title, tasks, icon: Icon, color, sectionKey }) => (
    <div className="mb-6">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        {expandedSections[sectionKey] ? (
          <ChevronDown className="size-4 text-zinc-500" />
        ) : (
          <ChevronRight className="size-4 text-zinc-500" />
        )}
        <Icon className={`size-5 ${color}`} />
        <span className="font-medium text-zinc-900 dark:text-white">{title}</span>
        <span className="text-sm text-zinc-500">({tasks.length})</span>
      </button>

      {expandedSections[sectionKey] && (
        <div className="space-y-2 ml-6">
          {tasks.length > 0 ? (
            tasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">No tasks</p>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const overdueTasks = tasks.filter(t =>
    t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "DONE"
  );

  const todayTasks = tasks.filter(t =>
    t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "DONE"
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <ListTodo className="size-7" /> My Tasks
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          All tasks assigned to you across all projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{tasks.length}</p>
          <p className="text-sm text-zinc-500">Total Tasks</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{grouped.inProgress.length}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">In Progress</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{todayTasks.length}</p>
          <p className="text-sm text-amber-600 dark:text-amber-400">Due Today</p>
        </div>
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</p>
          <p className="text-sm text-red-600 dark:text-red-400">Overdue</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-2">
            <AlertCircle className="size-5" />
            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {overdueTasks.slice(0, 3).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Task Sections */}
      <TaskSection
        title="To Do"
        tasks={grouped.todo}
        icon={Circle}
        color="text-zinc-500"
        sectionKey="todo"
      />

      <TaskSection
        title="In Progress"
        tasks={grouped.inProgress}
        icon={Clock}
        color="text-blue-500"
        sectionKey="inProgress"
      />

      <TaskSection
        title="Done"
        tasks={grouped.done}
        icon={CheckCircle2}
        color="text-green-500"
        sectionKey="done"
      />
    </div>
  );
};

export default MyTasks;
