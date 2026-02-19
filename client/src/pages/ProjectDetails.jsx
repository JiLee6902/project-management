import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, SettingsIcon, BarChart3Icon, CalendarIcon, FileStackIcon, ZapIcon } from "lucide-react";
import { fetchWorkspaces } from "../features/workspaceSlice";
import api from "../configs/api";
import toast from "react-hot-toast";
import ProjectAnalytics from "../components/ProjectAnalytics";
import ProjectSettings from "../components/ProjectSettings";
import CreateTaskDialog from "../components/CreateTaskDialog";
import ProjectCalendar from "../components/ProjectCalendar";
import ProjectTasks from "../components/ProjectTasks";
import ExportButton from "../components/ExportButton";

export default function ProjectDetail() {

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab');
    const id = searchParams.get('id');

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [activeTab, setActiveTab] = useState(tab || "tasks");

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [tab]);

    useEffect(() => {
        if (projects && projects.length > 0) {
            const proj = projects.find((p) => p.id === id);
            setProject(proj);
            setTasks(proj?.tasks || []);
        }
    }, [id, projects]);

    const statusColors = {
        PLANNING: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
        ACTIVE: "bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
        ON_HOLD: "bg-zinc-400 text-zinc-900 dark:bg-zinc-500 dark:text-zinc-100",
        COMPLETED: "bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900",
        CANCELLED: "bg-zinc-600 text-white dark:bg-zinc-300 dark:text-zinc-800",
        CLOSED: "bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900",
        REOPEN: "bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
    };

    if (!project) {
        return (
            <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
                <p className="text-3xl md:text-5xl mt-40 mb-10">Project not found</p>
                <button
                    onClick={() => navigate('/projects')}
                    className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white">
            {/* Header */}
            <div className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between max-w-6xl">
                <div className="flex items-center gap-4">
                    <button className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400" onClick={() => navigate('/projects')}>
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-medium">{project.name}</h1>
                        <select
                            value={project.status}
                            onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                    toast.loading("Updating status...");
                                    await api.put(`/projects/${project.id}`, { status: newStatus });
                                    dispatch(fetchWorkspaces());
                                    toast.dismissAll();
                                    toast.success("Project status updated");
                                } catch (error) {
                                    toast.dismissAll();
                                    toast.error(error?.response?.data?.message || error.message);
                                }
                            }}
                            className={`px-2 py-1 rounded text-xs capitalize cursor-pointer border-none outline-none ${statusColors[project.status]}`}
                        >
                            <option value="PLANNING">Planning</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="CLOSED">Closed</option>
                            <option value="REOPEN">Reopen</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton projectId={project.id} projectName={project.name} />
                    <button
                        onClick={() => setShowCreateTask(true)}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200"
                    >
                        <PlusIcon className="size-4" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:flex flex-wrap gap-6">
                {[
                    { label: "Total Tasks", value: tasks.length, color: "text-zinc-900 dark:text-white" },
                    { label: "Completed", value: tasks.filter((t) => t.status === "DONE").length, color: "text-zinc-700 dark:text-zinc-300" },
                    { label: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO").length, color: "text-zinc-600 dark:text-zinc-400" },
                    { label: "Team Members", value: project.members?.length || 0, color: "text-zinc-700 dark:text-zinc-300" },
                ].map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 flex justify-between sm:min-w-60 p-4 py-2.5 rounded-xl transition-all duration-300 ease-out">
                        <div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">{card.label}</div>
                            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        </div>
                        <ZapIcon className={`size-4 ${card.color}`} />
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div>
                <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                    {[
                        { key: "tasks", label: "Tasks", icon: FileStackIcon },
                        { key: "calendar", label: "Calendar", icon: CalendarIcon },
                        { key: "analytics", label: "Analytics", icon: BarChart3Icon },
                        { key: "settings", label: "Settings", icon: SettingsIcon },
                    ].map((tabItem) => (
                        <button
                            key={tabItem.key}
                            onClick={() => { setActiveTab(tabItem.key); setSearchParams({ id: id, tab: tabItem.key }) }}
                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${activeTab === tabItem.key
                                ? "bg-zinc-100 dark:bg-zinc-800/80"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                }`}
                        >
                            <tabItem.icon className="size-3.5" />
                            {tabItem.label}
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    {activeTab === "tasks" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectTasks tasks={tasks} />
                        </div>
                    )}
                    {activeTab === "analytics" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectAnalytics tasks={tasks} project={project} />
                        </div>
                    )}
                    {activeTab === "calendar" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectCalendar tasks={tasks} />
                        </div>
                    )}
                    {activeTab === "settings" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectSettings project={project} />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={id} />}
        </div>
    );
}
