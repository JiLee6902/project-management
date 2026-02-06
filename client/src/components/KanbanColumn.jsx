import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";

const columnConfig = {
    TODO: { title: "To Do", bgColor: "bg-zinc-100 dark:bg-zinc-800/50" },
    IN_PROGRESS: { title: "In Progress", bgColor: "bg-zinc-100 dark:bg-zinc-800/50" },
    DONE: { title: "Done", bgColor: "bg-zinc-100 dark:bg-zinc-800/50" },
    CLOSED: { title: "Closed", bgColor: "bg-zinc-100 dark:bg-zinc-800/50" },
    REOPEN: { title: "Reopen", bgColor: "bg-zinc-100 dark:bg-zinc-800/50" },
};

const KanbanColumn = ({ status, tasks }) => {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const config = columnConfig[status] || { title: status, bgColor: "bg-zinc-100 dark:bg-zinc-800/50" };

    return (
        <div className="flex-1 min-w-[280px] max-w-[350px] flex flex-col">
            <div className={`rounded-lg ${config.bgColor} p-3 flex flex-col flex-1`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {config.title}
                    </h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>

                <div
                    ref={setNodeRef}
                    className={`space-y-2 min-h-[200px] flex-1 transition-colors rounded-lg p-1 pb-8 ${
                        isOver ? "bg-zinc-200 dark:bg-zinc-700" : ""
                    }`}
                >
                    <SortableContext
                        items={tasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.map((task) => (
                            <KanbanCard key={task.id} task={task} />
                        ))}
                    </SortableContext>

                    {tasks.length === 0 && (
                        <div className="text-center text-zinc-400 dark:text-zinc-500 text-sm py-8">
                            No tasks
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanColumn;
