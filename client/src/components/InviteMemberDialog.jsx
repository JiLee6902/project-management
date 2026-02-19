import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import api from "../configs/api";
import { fetchWorkspaces } from "../features/workspaceSlice";

const InviteMemberDialog = ({ isDialogOpen, setIsDialogOpen }) => {

    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        role: "MEMBER",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.post(`/workspaces/${currentWorkspace.id}/members`, {
                email: formData.email,
                role: formData.role
            });
            toast.success("Member added successfully");
            dispatch(fetchWorkspaces());
            setIsDialogOpen(false);
            setFormData({ email: "", role: "MEMBER" });
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl animate-modal-enter p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="size-5 text-zinc-900 dark:text-zinc-200" /> Invite Team Member
                    </h2>
                    {currentWorkspace && (
                        <p className="text-sm text-zinc-700 dark:text-zinc-400">
                            Inviting to workspace: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{currentWorkspace.name}</span>
                        </p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 w-4 h-4" />
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" className="pl-10 mt-1 w-full rounded-lg bg-white border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200" required />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-lg bg-white border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 py-2 px-3 mt-1 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200 text-sm" >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsDialogOpen(false)} className="px-5 py-2 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.97] transition-all duration-200" >
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || !currentWorkspace} className="px-5 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 disabled:opacity-50" >
                            {isSubmitting ? "Adding..." : "Add Member"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberDialog;
