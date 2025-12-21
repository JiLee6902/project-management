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
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200 relative">
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
                            className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your workspace"
                            className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-20"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 text-sm">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded bg-gradient-to-br from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white disabled:opacity-50"
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
