import { useEffect, useState } from "react";
import { UserIcon, Shield, Save, LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetWorkspaceState } from "../features/workspaceSlice";
import toast from "react-hot-toast";
import api from "../configs/api";

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [profileData, setProfileData] = useState({ name: "" });
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await api.put("/auth/profile", { name: profileData.name });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name || "" });
        }
    }, [user]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            dispatch(resetWorkspaceState());
            navigate("/login");
        } finally {
            setIsLoggingOut(false);
            setShowLogoutConfirm(false);
        }
    };

    return user && (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
                <div className="inline-flex gap-2 bg-gray-100 dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-1">
                    {[
                        { key: "profile", icon: <UserIcon className="w-4 h-4" />, label: "Profile" },
                        { key: "account", icon: <Shield className="w-4 h-4" />, label: "Account" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${activeTab === tab.key
                                    ? "bg-gray-300 dark:bg-zinc-800 text-gray-900 dark:text-white"
                                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="bg-gray-100 dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6 space-y-6">
                        <h2 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Profile Information</h2>
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-2xl font-medium">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                                <p className="text-gray-500 dark:text-zinc-400">{user?.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="block text-sm text-gray-700 dark:text-zinc-300">Full Name</label>
                                <input
                                    id="fullName"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full sm:max-w-md p-2 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm text-gray-700 dark:text-zinc-300">Email Address</label>
                                <input
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="w-full p-2 rounded-md bg-gray-200 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-400"
                                />
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Email cannot be changed. Contact support if you need to update it.
                                </p>
                            </div>

                            {user.name !== profileData.name && (
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex items-center text-sm gap-2 px-5 py-2 rounded bg-gradient-to-br from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isUpdating ? "Saving..." : "Save Changes"}
                                </button>
                            )}
                        </form>
                    </div>
                )}

                {/* Account Tab */}
                {activeTab === "account" && (
                    <div className="bg-gray-100 dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6 space-y-6">
                        <h2 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Account Settings</h2>
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Account Type</h4>
                            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-3">
                                Standard user account
                            </p>
                        </div>

                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg">
                            <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Sign Out</h4>
                            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
                                Log out of your account
                            </p>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-600 hover:bg-zinc-700 text-white"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Sign Out</h3>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                            Are you sure you want to sign out? You will need to log in again to access your workspace.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                <LogOut className="size-4" />
                                {isLoggingOut ? "Signing out..." : "Sign Out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
