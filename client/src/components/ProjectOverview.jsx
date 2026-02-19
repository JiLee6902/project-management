import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, UsersIcon, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import CreateProjectDialog from "./CreateProjectDialog";

const ProjectOverview = () => {
    const statusColors = {
        PLANNING: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
        ACTIVE: "bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
        ON_HOLD: "bg-zinc-400 text-zinc-900 dark:bg-zinc-500 dark:text-zinc-100",
        COMPLETED: "bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900",
        CANCELLED: "bg-zinc-600 text-white dark:bg-zinc-300 dark:text-zinc-800"
    };

    const priorityColors = {
        LOW: "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400",
        MEDIUM: "border-zinc-400 text-zinc-700 dark:border-zinc-500 dark:text-zinc-300",
        HIGH: "border-zinc-500 text-zinc-800 dark:border-zinc-400 dark:text-zinc-200",
    };

    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        setProjects(currentWorkspace?.projects || []);
    }, [currentWorkspace]);

    return currentWorkspace && (
        <div className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300 ease-out rounded-xl overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
                <h2 className="text-md text-zinc-800 dark:text-zinc-300">Project Overview</h2>
                <Link to={'/projects'} className="text-sm text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 flex items-center">
                    View all <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>

            <div className="p-0">
                {projects.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 rounded-2xl shadow-sm flex items-center justify-center">
                            <FolderOpen size={32} />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400">No projects yet</p>
                        <button onClick={() => setIsDialogOpen(true)} className="mt-4 px-4 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg shadow-sm hover:shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200">
                            Create your First Project
                        </button>
                        <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {projects.slice(0, 5).map((project) => (
                            <Link key={project.id} to={`/projectsDetail?id=${project.id}&tab=tasks`} className="block p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-300 mb-1">
                                            {project.name}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                            {project.description || 'No description'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className={`text-xs px-2 py-1 rounded ${statusColors[project.status]}`}>
                                            {project.status.replace('_', ' ').replaceAll(/\b\w/g, c => c.toUpperCase())}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full border-2 ${priorityColors[project.priority]}`} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 mb-3">
                                    <div className="flex items-center gap-4">
                                        {project.members?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <UsersIcon className="w-3 h-3" />
                                                {project.members.length} members
                                            </div>
                                        )}
                                        {project.end_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(project.end_date), "MMM d, yyyy")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500 dark:text-zinc-500">Progress</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{project.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                        <div className="h-2 bg-zinc-900 dark:bg-zinc-300 rounded-full transition-all duration-500 ease-out" style={{ width: `${project.progress || 0}%` }} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectOverview;
