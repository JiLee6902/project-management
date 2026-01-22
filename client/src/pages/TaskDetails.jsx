import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../configs/api";
import { CalendarIcon, FileIcon, MessageCircle, PenIcon, Trash2, UserCircle2, Tag, Edit2, Copy, Focus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useProjectSocket } from "../hooks/useSocket";
import { deleteTask, addTask } from "../features/workspaceSlice";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { LabelBadge, LabelSelector, LabelManager } from "../components/labels";
import { useLabels } from "../hooks/useLabels";
import SubtaskList from "../components/SubtaskList";
import ActivityTimeline from "../components/ActivityTimeline";
import TimeTracker from "../components/TimeTracker";
import { renderMentions } from "../utils/mention";
import EditTaskDialog from "../components/EditTaskDialog";
import FocusMode from "../components/FocusMode";
import TaskAttachments from "../components/TaskAttachments";

const TaskDetails = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const { user } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, isLoading: false });
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [taskLabels, setTaskLabels] = useState([]);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showFocusMode, setShowFocusMode] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
    const workspaceLoading = useSelector((state) => state.workspace?.loading);

    const { labels, loading: labelsLoading, createLabel, updateLabel, deleteLabel, updateTaskLabels } = useLabels();

    const { handleCommentAdded } = useProjectSocket(projectId);

    useEffect(() => {
        const unsubscribe = handleCommentAdded((payload) => {
            if (payload.taskId === taskId) {
                setComments((prev) => {
                    const exists = prev.some((c) => c.id === payload.comment.id);
                    if (exists) return prev;
                    return [...prev, payload.comment];
                });
            }
        });
        return unsubscribe;
    }, [taskId, handleCommentAdded]);

    const fetchComments = async () => {
        if (!taskId) return;
        try {
            const { data } = await api.get(`/comments/${taskId}`);
            setComments(data.comments || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const fetchTaskDetails = async () => {
        setLoading(true);
        if (!projectId || !taskId || !currentWorkspace) {
            setLoading(false);
            return;
        }

        const proj = currentWorkspace.projects?.find((p) => p.id === projectId);
        if (!proj) {
            setLoading(false);
            return;
        }

        const tsk = proj.tasks?.find((t) => t.id === taskId);
        if (!tsk) {
            setLoading(false);
            return;
        }

        setTask(tsk);
        setProject(proj);
        setLoading(false);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            toast.loading("Adding comment...");

            const { data } = await api.post(`/comments`, { taskId: task.id, content: newComment });

            // Update state immediately to show comment without refresh
            if (data.comment) {
                setComments((prev) => [...prev, data.comment]);
            }

            setNewComment("");
            toast.dismissAll();
            toast.success("Comment added.");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
            console.error(error);
        }
    };

    const handleDeleteTask = async () => {
        setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
        try {
            await api.post("/tasks/delete", { taskIds: [taskId] });
            dispatch(deleteTask([taskId]));
            setDeleteDialog({ isOpen: false, isLoading: false });
            toast.success("Task deleted");
            navigate(`/projectsDetail?id=${projectId}`);
        } catch (error) {
            setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleDuplicateTask = async () => {
        setIsDuplicating(true);
        try {
            const { data } = await api.post(`/tasks/${taskId}/duplicate`);
            dispatch(addTask(data.task));
            toast.success("Task duplicated successfully");
            navigate(`/taskDetails?projectId=${projectId}&taskId=${data.task.id}`);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to duplicate task");
        } finally {
            setIsDuplicating(false);
        }
    };

    const handleFocusModeStatusChange = async (taskId, newStatus) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            toast.success("Task completed!");
            setShowFocusMode(false);
            fetchTaskDetails();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update status");
        }
    };

    useEffect(() => { fetchTaskDetails(); }, [taskId, currentWorkspace]);

    useEffect(() => {
        if (task?.labels) {
            setTaskLabels(task.labels);
        }
    }, [task?.labels]);

    const handleSelectLabel = async (label) => {
        const newLabels = [...taskLabels, label];
        setTaskLabels(newLabels);
        await updateTaskLabels(taskId, newLabels.map(l => l.id));
    };

    const handleDeselectLabel = async (labelId) => {
        const newLabels = taskLabels.filter(l => l.id !== labelId);
        setTaskLabels(newLabels);
        await updateTaskLabels(taskId, newLabels.map(l => l.id));
    };

    useEffect(() => {
        if (taskId && task) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, task]);

    if (loading || workspaceLoading) return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading task details...</div>;
    if (!currentWorkspace) return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading workspace...</div>;
    if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            <div className="w-full lg:w-2/3">
                <div className="p-5 rounded-md  border border-gray-300 dark:border-zinc-800  flex flex-col lg:h-[80vh]">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                        <MessageCircle className="size-5" /> Task Discussion ({comments.length})
                    </h2>

                    <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6 mr-2">
                                {comments.map((comment) => (
                                    <div key={comment.id} className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${comment.user?.id === user?.id ? "ml-auto" : "mr-auto"}`} >
                                        <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                                            <div className="size-5 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-xs">
                                                {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{comment.user?.name || 'Unknown'}</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-600">
                                                • {comment.createdAt ? format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm") : ''}
                                            </span>
                                        </div>
                                        <p
                                            className="text-sm text-gray-900 dark:text-zinc-200"
                                            dangerouslySetInnerHTML={{ __html: renderMentions(comment.content) }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">No comments yet. Be the first!</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            rows={3}
                        />
                        <button onClick={handleAddComment} className="bg-gradient-to-l from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 transition-colors text-white text-sm px-5 py-2 rounded " >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 ">
                    <div className="mb-3">
                        <div className="flex items-start justify-between gap-2">
                            <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setShowFocusMode(true)}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                                    title="Focus mode"
                                >
                                    <Focus className="size-5" />
                                </button>
                                <button
                                    onClick={handleDuplicateTask}
                                    disabled={isDuplicating}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50"
                                    title="Duplicate task"
                                >
                                    <Copy className="size-5" />
                                </button>
                                <button
                                    onClick={() => setShowEditDialog(true)}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                    title="Edit task"
                                >
                                    <Edit2 className="size-5" />
                                </button>
                                <button
                                    onClick={() => setDeleteDialog({ isOpen: true, isLoading: false })}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    title="Delete task"
                                >
                                    <Trash2 className="size-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs">
                                {task.status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs">
                                {task.priority}
                            </span>
                        </div>

                        {taskLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {taskLabels.map((label) => (
                                    <LabelBadge key={label.id} label={label} size="sm" />
                                ))}
                            </div>
                        )}
                    </div>

                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>
                    )}

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-xs">
                                {task.assignee?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {task.assignee?.name || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                            Due : {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "-"}
                        </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />
                    <LabelSelector
                        labels={labels}
                        selectedLabels={taskLabels}
                        onSelect={handleSelectLabel}
                        onDeselect={handleDeselectLabel}
                        onCreateNew={() => setShowLabelManager(true)}
                        loading={labelsLoading}
                    />

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />
                    <SubtaskList taskId={taskId} />

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />
                    <TaskAttachments taskId={taskId} projectId={projectId} />

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />
                    <TimeTracker taskId={taskId} />

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />
                    <ActivityTimeline taskId={taskId} limit={10} />
                </div>

                {project && (
                    <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800 ">
                        <p className="text-xl font-medium mb-4">Project Details</p>
                        <h2 className="text-gray-900 dark:text-zinc-100 flex items-center gap-2"> <PenIcon className="size-4" /> {project.name}</h2>
                        <p className="text-xs mt-3">Project Start Date: {project.start_date ? format(new Date(project.start_date), "dd MMM yyyy") : "-"}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-3">
                            <span>Status: {project.status}</span>
                            <span>Priority: {project.priority}</span>
                            <span>Progress: {project.progress}%</span>
                        </div>
                    </div>
                )}
            </div>

            <LabelManager
                isOpen={showLabelManager}
                onClose={() => setShowLabelManager(false)}
                labels={labels}
                onCreateLabel={createLabel}
                onUpdateLabel={updateLabel}
                onDeleteLabel={deleteLabel}
                loading={labelsLoading}
            />

            <DeleteConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, isLoading: false })}
                onConfirm={handleDeleteTask}
                title="Delete Task"
                message="Are you sure you want to delete this task? All comments will also be deleted. This action cannot be undone."
                isLoading={deleteDialog.isLoading}
            />

            <EditTaskDialog
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                task={task}
                projectId={projectId}
            />

            {showFocusMode && (
                <FocusMode
                    task={{ ...task, project }}
                    onClose={() => setShowFocusMode(false)}
                    onStatusChange={handleFocusModeStatusChange}
                />
            )}
        </div>
    );
};

export default TaskDetails;
