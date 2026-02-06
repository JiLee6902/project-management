import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { Crown, Plus, Save, Trash2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWorkspaces } from "../features/workspaceSlice";
import api from "../configs/api";
import toast from "react-hot-toast";
import AddProjectMember from "./AddProjectMember";

export default function ProjectSettings({ project }) {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const workspaceMembers = currentWorkspace?.members || [];

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        progress: 0,
        team_lead: "",
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const handleDeleteProject = async () => {
        if (deleteConfirmText !== project.name) {
            toast.error("Please type the project name to confirm");
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/projects/${project.id}`);
            toast.success("Project deleted successfully");
            dispatch(fetchWorkspaces());
            navigate("/projects");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        toast.loading("Saving...");
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                progress: formData.progress,
            };
            // Only add dates if they have valid values
            if (formData.start_date) {
                try {
                    payload.startDate = new Date(formData.start_date).toISOString();
                } catch (e) { /* ignore invalid date */ }
            }
            if (formData.end_date) {
                try {
                    payload.endDate = new Date(formData.end_date).toISOString();
                } catch (e) { /* ignore invalid date */ }
            }
            payload.teamLead = formData.team_lead || null;

            const { data } = await api.put(`/projects/${project.id}`, payload);
            dispatch(fetchWorkspaces());
            toast.dismissAll();
            toast.success(data.message);
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || "",
                description: project.description || "",
                status: project.status || "PLANNING",
                priority: project.priority || "MEDIUM",
                start_date: project.startDate || project.start_date || "",
                end_date: project.endDate || project.end_date || "",
                progress: project.progress || 0,
                team_lead: project.teamLead || project.team_lead || "",
            });
        }
    }, [project]);

    const inputClasses = "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300";

    const cardClasses = "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";

    const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

    if (!project) {
        return <div className="text-zinc-500 dark:text-zinc-400">Loading project settings...</div>;
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className={cardClasses}>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">Project Details</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Project Name</label>
                        <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClasses} required />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClasses + " h-24"} />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClasses} >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="CLOSED">Closed</option>
                                <option value="REOPEN">Reopen</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={inputClasses} >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Team Lead */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Team Lead</label>
                        <select value={formData.team_lead} onChange={(e) => setFormData({ ...formData, team_lead: e.target.value })} className={inputClasses} >
                            <option value="">Select Team Lead</option>
                            {workspaceMembers.map((member) => (
                                <option key={member?.user?.id} value={member?.user?.id}>
                                    {member?.user?.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Start Date</label>
                            <input type="date" value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd") : ""} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={inputClasses} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>End Date</label>
                            <input type="date" value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd") : ""} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className={inputClasses} />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Progress: {formData.progress}%</label>
                        <input type="range" min="0" max="100" step="5" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })} className="w-full accent-zinc-500 dark:accent-zinc-400" />
                    </div>

                    {/* Save Button */}
                    <button type="submit" disabled={isSubmitting} className="ml-auto flex items-center text-sm justify-center gap-2 bg-gradient-to-br from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white px-4 py-2 rounded disabled:opacity-50" >
                        <Save className="size-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Team Members */}
            <div className="space-y-6">
                <div className={cardClasses}>
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
                            Team Members <span className="text-sm text-zinc-600 dark:text-zinc-400">({project?.members?.length || 0})</span>
                        </h2>
                        <button type="button" onClick={() => setIsDialogOpen(true)} className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800" >
                            <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
                        </button>
                        <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>

                    {/* Member List */}
                    {project?.members?.length > 0 && (
                        <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                            {project.members.map((member, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300" >
                                    <span> {member?.user?.email || "Unknown"} </span>
                                    {(project.teamLead || project.team_lead) === member?.user?.id && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                            <Crown className="size-3" /> Team Lead
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="rounded-lg border border-red-300 dark:border-red-900/50 p-6 bg-red-50 dark:bg-red-950/20">
                    <h2 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="size-5" /> Danger Zone
                    </h2>
                    <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
                        Once you delete a project, there is no going back. All tasks and data will be permanently removed.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                    >
                        <Trash2 className="size-4" /> Delete Project
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Delete Project</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            This action cannot be undone. Please type <strong className="text-zinc-900 dark:text-white">{project.name}</strong> to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type project name to confirm"
                            className="w-full px-3 py-2 rounded border text-sm dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText("");
                                }}
                                className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteProject}
                                disabled={isDeleting || deleteConfirmText !== project.name}
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? "Deleting..." : "Delete Project"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
