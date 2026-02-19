import { Link } from "react-router-dom";

const statusColors = {
    PLANNING: "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
    ACTIVE: "bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200",
    ON_HOLD: "bg-zinc-400 dark:bg-zinc-500 text-zinc-900 dark:text-zinc-100",
    COMPLETED: "bg-zinc-500 dark:bg-zinc-400 text-white dark:text-zinc-900",
    CANCELLED: "bg-zinc-600 dark:bg-zinc-300 text-white dark:text-zinc-800",
};

const ProjectCard = ({ project }) => {
    return (
        <Link to={`/projectsDetail?id=${project.id}&tab=tasks`} className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 rounded-xl p-5 transition-all duration-300 ease-out group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1 truncate group-hover:text-zinc-600 dark:group-hover:text-white transition-colors">
                        {project.name}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 mb-3">
                        {project.description || "No description"}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[project.status]}`} >
                    {project.status.replace("_", " ")}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500 capitalize">
                    {project.priority} priority
                </span>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-500">Progress</span>
                    <span className="text-zinc-400 dark:text-zinc-400">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-300 transition-all duration-500 ease-out" style={{ width: `${project.progress || 0}%` }} />
                </div>
            </div>

            </Link>
    );
};

export default ProjectCard;
