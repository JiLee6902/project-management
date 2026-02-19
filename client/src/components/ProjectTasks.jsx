import api from "../configs/api";
import toast from "react-hot-toast";
import { useState, useMemo } from "react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { useDispatch } from "react-redux";
import { deleteTask, updateTask } from "../features/workspaceSlice";
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Trash, Trash2, XIcon, Zap, AlertCircle, Clock, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ViewToggle from "./ViewToggle";
import KanbanBoard from "./KanbanBoard";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { LabelBadge } from "./labels";

const typeIcons = {
    BUG: { icon: Bug, color: "text-zinc-600 dark:text-zinc-400" },
    FEATURE: { icon: Zap, color: "text-zinc-600 dark:text-zinc-400" },
    TASK: { icon: Square, color: "text-zinc-600 dark:text-zinc-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-zinc-600 dark:text-zinc-400" },
    OTHER: { icon: MessageSquare, color: "text-zinc-600 dark:text-zinc-400" },
};

const priorityTexts = {
    LOW: { background: "bg-zinc-100 dark:bg-zinc-800", prioritycolor: "text-zinc-600 dark:text-zinc-400" },
    MEDIUM: { background: "bg-zinc-200 dark:bg-zinc-700", prioritycolor: "text-zinc-700 dark:text-zinc-300" },
    HIGH: { background: "bg-zinc-300 dark:bg-zinc-600", prioritycolor: "text-zinc-800 dark:text-zinc-200" },
};

const getDueDateStatus = (dueDate, status) => {
    if (!dueDate || status === "DONE" || status === "CLOSED") return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
        return { label: "Overdue", color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle };
    }
    if (isToday(date)) {
        return { label: "Due Today", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Clock };
    }
    if (isTomorrow(date)) {
        return { label: "Due Tomorrow", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock };
    }
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil <= 3) {
        return { label: `${daysUntil}d left`, color: "text-zinc-600 dark:text-zinc-400", bg: "", icon: null };
    }
    return null;
};

const ProjectTasks = ({ tasks = [] }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [view, setView] = useState("list");
    const [filters, setFilters] = useState({
        status: "",
        type: "",
        priority: "",
        assignee: "",
    });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, taskIds: [], isLoading: false });

    const assigneeList = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))),
        [tasks]
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const { status, type, priority, assignee } = filters;
            return (
                (!status || task.status === status) &&
                (!type || task.type === type) &&
                (!priority || task.priority === priority) &&
                (!assignee || task.assignee?.name === assignee)
            );
        });
    }, [filters, tasks]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            toast.loading("Updating status...");

            await api.put(`/tasks/${taskId}`, { status: newStatus });

            let updatedTask = structuredClone(tasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            dispatch(updateTask(updatedTask));

            toast.dismissAll();
            toast.success("Task status updated successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const openDeleteDialog = (taskIds) => {
        setDeleteDialog({ isOpen: true, taskIds, isLoading: false });
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, taskIds: [], isLoading: false });
    };

    const handleDelete = async () => {
        const taskIds = deleteDialog.taskIds;
        if (taskIds.length === 0) return;

        setDeleteDialog((prev) => ({ ...prev, isLoading: true }));

        try {
            await api.post("/tasks/delete", { taskIds });
            dispatch(deleteTask(taskIds));
            setSelectedTasks((prev) => prev.filter((id) => !taskIds.includes(id)));
            closeDeleteDialog();
            toast.success(taskIds.length > 1 ? `${taskIds.length} tasks deleted` : "Task deleted");
        } catch (error) {
            setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    return (
        <div>
            {/* Filters and View Toggle */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <ViewToggle view={view} onChange={setView} />
                {["status", "type", "priority", "assignee"].map((name) => {
                    const options = {
                        status: [
                            { label: "All Statuses", value: "" },
                            { label: "To Do", value: "TODO" },
                            { label: "In Progress", value: "IN_PROGRESS" },
                            { label: "Done", value: "DONE" },
                            { label: "Closed", value: "CLOSED" },
                            { label: "Reopen", value: "REOPEN" },
                        ],
                        type: [
                            { label: "All Types", value: "" },
                            { label: "Task", value: "TASK" },
                            { label: "Bug", value: "BUG" },
                            { label: "Feature", value: "FEATURE" },
                            { label: "Improvement", value: "IMPROVEMENT" },
                            { label: "Other", value: "OTHER" },
                        ],
                        priority: [
                            { label: "All Priorities", value: "" },
                            { label: "Low", value: "LOW" },
                            { label: "Medium", value: "MEDIUM" },
                            { label: "High", value: "HIGH" },
                        ],
                        assignee: [
                            { label: "All Assignees", value: "" },
                            ...assigneeList.map((n) => ({ label: n, value: n })),
                        ],
                    };
                    return (
                        <select
                            key={name}
                            name={name}
                            onChange={handleFilterChange}
                            className="border not-dark:bg-white border-zinc-200 dark:border-zinc-800 outline-none px-3 py-1 rounded-lg text-sm text-zinc-900 dark:text-zinc-200 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200"
                        >
                            {options[name].map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    );
                })}

                {/* Reset filters */}
                {(filters.status || filters.type || filters.priority || filters.assignee) && (
                    <button
                        type="button"
                        onClick={() => setFilters({ status: "", type: "", priority: "", assignee: "" })}
                        className="px-3 py-1 flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200"
                    >
                        <XIcon className="size-3" /> Reset
                    </button>
                )}

                {selectedTasks.length > 0 && (
                    <button type="button" onClick={() => openDeleteDialog(selectedTasks)} className="px-3 py-1 flex items-center gap-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors" >
                        <Trash className="size-3" /> Delete ({selectedTasks.length})
                    </button>
                )}
            </div>

            {view === "board" ? (
                <KanbanBoard tasks={filteredTasks} />
            ) : (
            <div className="overflow-auto rounded-xl lg:border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                <div className="w-full">
                    {/* Desktop/Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full text-sm text-left not-dark:bg-white text-zinc-900 dark:text-zinc-300">
                            <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400 ">
                                <tr>
                                    <th className="pl-2 pr-1">
                                        <input
                                            onChange={() => selectedTasks.length > 1 ? setSelectedTasks([]) : setSelectedTasks(tasks.map((t) => t.id))}
                                            checked={selectedTasks.length === tasks.length}
                                            type="checkbox"
                                            className="size-3 accent-zinc-600 dark:accent-zinc-500"
                                        />
                                    </th>
                                    <th className="px-4 pl-0 py-3">Title</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Assignee</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length > 0 ? (
                                    filteredTasks.map((task) => {
                                        const { icon: Icon, color } = typeIcons[task.type] || {};
                                        const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                        return (
                                            <tr
                                                key={task.id}
                                                onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                                className=" border-t border-zinc-200 dark:border-zinc-800 group hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                                            >
                                                <td onClick={e => e.stopPropagation()} className="pl-2 pr-1">
                                                    <input
                                                        type="checkbox"
                                                        className="size-3 accent-zinc-600 dark:accent-zinc-500"
                                                        onChange={() =>
                                                            selectedTasks.includes(task.id)
                                                                ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id))
                                                                : setSelectedTasks((prev) => [...prev, task.id])
                                                        }
                                                        checked={selectedTasks.includes(task.id)}
                                                    />
                                                </td>
                                                <td className="px-4 pl-0 py-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{task.title}</span>
                                                        {task.labels?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {task.labels.slice(0, 3).map((label) => (
                                                                    <LabelBadge key={label.id} label={label} size="xs" />
                                                                ))}
                                                                {task.labels.length > 3 && (
                                                                    <span className="text-xs text-zinc-500">+{task.labels.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {task.subtasks?.length > 0 && (
                                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                                <CheckSquare className="size-3" />
                                                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {Icon && <Icon className={`size-4 ${color}`} />}
                                                        <span className={`uppercase text-xs ${color}`}>{task.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-2">
                                                    <select
                                                        name="status"
                                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                        value={task.status}
                                                        className="group-hover:ring ring-zinc-100 outline-none px-2 pr-4 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200 cursor-pointer"
                                                    >
                                                        <option value="TODO">To Do</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="DONE">Done</option>
                                                        <option value="CLOSED">Closed</option>
                                                        <option value="REOPEN">Reopen</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-5 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-xs">
                                                            {task.assignee?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        {task.assignee?.name || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {(() => {
                                                        const dueDateStatus = getDueDateStatus(task.dueDate, task.status);
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                                                    <CalendarIcon className="size-4" />
                                                                    {task.dueDate ? format(new Date(task.dueDate), "dd MMMM") : "-"}
                                                                </div>
                                                                {dueDateStatus && (
                                                                    <span className={`text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 w-fit ${dueDateStatus.bg} ${dueDateStatus.color}`}>
                                                                        {dueDateStatus.icon && <dueDateStatus.icon className="size-3" />}
                                                                        {dueDateStatus.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-2">
                                                    <button
                                                        onClick={() => openDeleteDialog([task.id])}
                                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Delete task"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-zinc-500 dark:text-zinc-400 py-6">
                                            No tasks found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile/Card View */}
                    <div className="lg:hidden flex flex-col gap-4">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => {
                                const { icon: Icon, color } = typeIcons[task.type] || {};
                                const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                return (
                                    <div key={task.id} className=" dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-zinc-900 dark:text-zinc-200 text-sm font-semibold">{task.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openDeleteDialog([task.id])}
                                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                    title="Delete task"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                                <input
                                                    type="checkbox"
                                                    className="size-4 accent-zinc-600 dark:accent-zinc-500"
                                                    onChange={() =>
                                                        selectedTasks.includes(task.id)
                                                            ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id))
                                                            : setSelectedTasks((prev) => [...prev, task.id])
                                                    }
                                                    checked={selectedTasks.includes(task.id)}
                                                />
                                            </div>
                                        </div>

                                        {task.labels?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {task.labels.slice(0, 3).map((label) => (
                                                    <LabelBadge key={label.id} label={label} size="xs" />
                                                ))}
                                                {task.labels.length > 3 && (
                                                    <span className="text-xs text-zinc-500">+{task.labels.length - 3}</span>
                                                )}
                                            </div>
                                        )}

                                        {task.subtasks?.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                <CheckSquare className="size-3" />
                                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                                            </div>
                                        )}

                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                            {Icon && <Icon className={`size-4 ${color}`} />}
                                            <span className={`${color} uppercase`}>{task.type}</span>
                                        </div>

                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="text-zinc-600 dark:text-zinc-400 text-xs">Status</label>
                                            <select
                                                name="status"
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                value={task.status}
                                                className="w-full mt-1 bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700 outline-none px-2 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200"
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                                <option value="CLOSED">Closed</option>
                                                <option value="REOPEN">Reopen</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            <div className="size-5 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-xs">
                                                {task.assignee?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            {task.assignee?.name || "-"}
                                        </div>

                                        {(() => {
                                            const dueDateStatus = getDueDateStatus(task.dueDate, task.status);
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                        <CalendarIcon className="size-4" />
                                                        {task.dueDate ? format(new Date(task.dueDate), "dd MMMM") : "-"}
                                                    </div>
                                                    {dueDateStatus && (
                                                        <span className={`text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 w-fit ${dueDateStatus.bg} ${dueDateStatus.color}`}>
                                                            {dueDateStatus.icon && <dueDateStatus.icon className="size-3" />}
                                                            {dueDateStatus.label}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">
                                No tasks found for the selected filters.
                            </p>
                        )}
                    </div>
                </div>
            </div>
            )}

            <DeleteConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={closeDeleteDialog}
                onConfirm={handleDelete}
                title="Delete Task"
                message={
                    deleteDialog.taskIds.length > 1
                        ? "Are you sure you want to delete these tasks? This action cannot be undone."
                        : "Are you sure you want to delete this task? This action cannot be undone."
                }
                itemCount={deleteDialog.taskIds.length}
                isLoading={deleteDialog.isLoading}
            />
        </div>
    );
};

export default ProjectTasks;
