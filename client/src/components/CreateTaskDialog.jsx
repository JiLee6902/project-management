import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addTask } from "../features/workspaceSlice";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../configs/api";

export default function CreateTaskDialog({ showCreateTask, setShowCreateTask, projectId }) {
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const project = currentWorkspace?.projects.find((p) => p.id === projectId);
    // Use workspace members for assignee dropdown (project members can also be used as fallback)
    const teamMembers = currentWorkspace?.members || project?.members || [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        due_date: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Build payload, excluding empty optional fields
            const payload = {
                title: formData.title,
                type: formData.type,
                status: formData.status,
                priority: formData.priority,
                workspaceId: currentWorkspace.id,
                projectId,
            };

            // Only add optional fields if they have values
            if (formData.description) payload.description = formData.description;
            if (formData.assigneeId) payload.assigneeId = formData.assigneeId;
            if (formData.due_date) payload.dueDate = new Date(formData.due_date).toISOString();

            const { data } = await api.post("/tasks", payload);

            setShowCreateTask(false);
            setFormData({
                title: "",
                description: "",
                type: "TASK",
                status: "TODO",
                priority: "MEDIUM",
                assigneeId: "",
                due_date: "",
            });

            toast.success(data.message);
            dispatch(addTask(data.task));
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return showCreateTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl animate-modal-enter w-full max-w-md p-6 text-zinc-900 dark:text-white">
                <h2 className="text-xl font-bold mb-4">Create New Task</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                        <label htmlFor="title" className="text-sm font-medium">Title</label>
                        <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-400" required />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the task" className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200 h-24 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                    </div>

                    {/* Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200" >
                                <option value="BUG">Bug</option>
                                <option value="FEATURE">Feature</option>
                                <option value="TASK">Task</option>
                                <option value="IMPROVEMENT">Improvement</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200"                             >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Assignee</label>
                            <select value={formData.assigneeId} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200" >
                                <option value="">Unassigned</option>
                                {teamMembers.map((member) => (
                                    <option key={member?.user.id} value={member?.user.id}>
                                        {member?.user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200" >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                                <option value="CLOSED">Closed</option>
                                <option value="REOPEN">Reopen</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Due Date</label>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200" />
                        </div>
                        {formData.due_date && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {format(new Date(formData.due_date), "PPP")}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowCreateTask(false)} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.97] transition-all duration-200" >
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50" >
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
}
