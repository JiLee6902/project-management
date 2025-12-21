import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Zap, GripVertical, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LabelBadge } from "./labels";

const typeIcons = {
    BUG: Bug,
    FEATURE: Zap,
    TASK: Square,
    IMPROVEMENT: GitCommit,
    OTHER: MessageSquare,
};

const priorityColors = {
    LOW: "border-l-zinc-400",
    MEDIUM: "border-l-zinc-500",
    HIGH: "border-l-zinc-700 dark:border-l-zinc-300",
};

const KanbanCard = ({ task }) => {
    const navigate = useNavigate();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const TypeIcon = typeIcons[task.type] || Square;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 border-l-4 ${priorityColors[task.priority] || ""} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
        >
            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="size-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {task.title}
                    </p>

                    {task.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {task.labels.slice(0, 3).map((label) => (
                                <LabelBadge key={label.id} label={label} size="xs" />
                            ))}
                            {task.labels.length > 3 && (
                                <span className="text-xs text-zinc-500">+{task.labels.length - 3}</span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                            <TypeIcon className="size-3.5 text-zinc-400" />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                                {task.type}
                            </span>
                        </div>
                        {task.subtasks?.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <CheckSquare className="size-3" />
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <CalendarIcon className="size-3" />
                                {format(new Date(task.dueDate), "dd MMM")}
                            </div>
                        )}

                        {task.assignee && (
                            <div className="size-6 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-xs">
                                {task.assignee.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KanbanCard;
