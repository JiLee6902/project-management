import { useState } from "react";
import { XIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { addWorkspace, fetchWorkspaces } from "../features/workspaceSlice";
import toast from "react-hot-toast";
import api from "../configs/api";

const CreateWorkspaceDialog = ({ isOpen, setIsOpen }) => {
    const dispatch = useDispatch();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Generate slug from name (lowercase, alphanumeric with hyphens)
    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')          // Replace spaces with hyphens
            .replace(/-+/g, '-')           // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            return toast.error("Workspace name is required");
        }

        const slug = generateSlug(name);
        if (!slug) {
            return toast.error("Workspace name must contain alphanumeric characters");
        }

        setIsSubmitting(true);
        try {
            const { data } = await api.post("/workspaces", { name, slug, description });
            dispatch(addWorkspace(data));
            dispatch(fetchWorkspaces());
            toast.success("Workspace created successfully");
            setIsOpen(false);
            setName("");
            setDescription("");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl animate-modal-enter p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200 relative">
                <button
                    className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    onClick={() => setIsOpen(false)}
                >
                    <XIcon className="size-5" />
                </button>

                <h2 className="text-xl font-medium mb-4">Create New Workspace</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Workspace Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter workspace name"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your workspace"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200 h-20"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 text-sm">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.97] transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Workspace"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspaceDialog;
