import { useState, useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../configs/api";
import { updateTask } from "../features/workspaceSlice";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CLOSED", "REOPEN"];

const KanbanBoard = ({ tasks = [] }) => {
    const dispatch = useDispatch();
    const [activeTask, setActiveTask] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const tasksByStatus = useMemo(() => {
        return STATUSES.reduce((acc, status) => {
            acc[status] = tasks.filter((task) => task.status === status);
            return acc;
        }, {});
    }, [tasks]);

    const handleDragStart = (event) => {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        if (!STATUSES.includes(newStatus)) return;

        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status === newStatus) return;

        try {
            toast.loading("Updating status...");
            await api.put(`/tasks/${taskId}`, { status: newStatus });

            const updatedTask = { ...task, status: newStatus };
            dispatch(updateTask(updatedTask));

            toast.dismissAll();
            toast.success("Task status updated");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUSES.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={tasksByStatus[status] || []}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask && <KanbanCard task={activeTask} />}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
