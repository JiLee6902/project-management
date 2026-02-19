import { useEffect, useState } from "react";
import { UsersIcon, Search, UserPlus, Mail, Shield, Activity } from "lucide-react";
import InviteMemberDialog from "../components/InviteMemberDialog";
import { useSelector } from "react-redux";

const Team = () => {

    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const projects = currentWorkspace?.projects || [];

    const filteredUsers = users.filter(
        (user) =>
            user?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setUsers(currentWorkspace?.members || []);
        setTasks(currentWorkspace?.projects?.reduce((acc, project) => [...acc, ...project.tasks], []) || []);
    }, [currentWorkspace]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white mb-1">Team</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Manage team members and their contributions
                    </p>
                </div>
                <button onClick={() => setIsDialogOpen(true)} className="flex items-center px-5 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200" >
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                </button>
                <InviteMemberDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
                {/* Total Members */}
                <div className="max-sm:w-full bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 rounded-xl p-6 transition-all duration-300 ease-out">
                    <div className="flex items-center justify-between gap-8 md:gap-22">
                        <div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Members</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white">{users.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-500/10">
                            <UsersIcon className="size-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                    </div>
                </div>

                {/* Active Projects */}
                <div className="max-sm:w-full bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 rounded-xl p-6 transition-all duration-300 ease-out">
                    <div className="flex items-center justify-between gap-8 md:gap-22">
                        <div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Active Projects</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white">
                                {projects.filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED").length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-500/10">
                            <Activity className="size-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                    </div>
                </div>

                {/* Total Tasks */}
                <div className="max-sm:w-full bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 rounded-xl p-6 transition-all duration-300 ease-out">
                    <div className="flex items-center justify-between gap-8 md:gap-22">
                        <div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Tasks</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white">{tasks.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-500/10">
                            <Shield className="size-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-400 size-3" />
                <input placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full text-sm rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 transition-all duration-200" />
            </div>

            {/* Team Members */}
            <div className="w-full">
                {filteredUsers.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl shadow-sm flex items-center justify-center">
                            <UsersIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                            {users.length === 0
                                ? "No team members yet"
                                : "No members match your search"}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                            {users.length === 0
                                ? "Invite team members to start collaborating"
                                : "Try adjusting your search term"}
                        </p>
                    </div>
                ) : (
                    <div className="max-w-4xl w-full">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-2.5 text-left font-medium text-sm">
                                            Name
                                        </th>
                                        <th className="px-6 py-2.5 text-left font-medium text-sm">
                                            Email
                                        </th>
                                        <th className="px-6 py-2.5 text-left font-medium text-sm">
                                            Role
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-2.5 whitespace-nowrap flex items-center gap-3">
                                                <img
                                                    src={user.user.image}
                                                    alt={user.user.name}
                                                    className="size-7 rounded-full bg-zinc-200 dark:bg-zinc-800"
                                                />
                                                <span className="text-sm text-zinc-800 dark:text-white truncate">
                                                    {user.user?.name || "Unknown User"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-2.5 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                                {user.user.email}
                                            </td>
                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-md ${user.role === "ADMIN"
                                                            ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200"
                                                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                                        }`}
                                                >
                                                    {user.role || "User"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="p-4 border border-zinc-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={user.user.image}
                                            alt={user.user.name}
                                            className="size-9 rounded-full bg-zinc-200 dark:bg-zinc-800"
                                        />
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-white">
                                                {user.user?.name || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                {user.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-md ${user.role === "ADMIN"
                                                    ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200"
                                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                                }`}
                                        >
                                            {user.role || "User"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default Team;
