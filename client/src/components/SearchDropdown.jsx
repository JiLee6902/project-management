import { useState, useRef, useEffect } from "react";
import { SearchIcon, FileText, FolderOpen, X, Loader2, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import api from "../configs/api";

// Detect if user is on Mac
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const SearchDropdown = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ tasks: [], projects: [] });
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults({ tasks: [], projects: [] });
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                setResults(data);
            } catch (error) {
                console.error("Search failed:", error);
                setResults({ tasks: [], projects: [] });
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    const handleTaskClick = (task) => {
        setIsOpen(false);
        setQuery("");
        navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`);
    };

    const handleProjectClick = (project) => {
        setIsOpen(false);
        setQuery("");
        navigate(`/projectsDetail?id=${project.id}&tab=tasks`);
    };

    const hasResults = results.tasks.length > 0 || results.projects.length > 0;

    return (
        <div className="relative flex-1 max-w-sm" ref={dropdownRef}>
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 size-3.5" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search projects, tasks..."
                className="pl-8 pr-8 py-2 w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition"
            />
            {query ? (
                <button
                    onClick={() => {
                        setQuery("");
                        setResults({ tasks: [], projects: [] });
                        inputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <X className="size-3.5" />
                </button>
            ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                    {isMac ? <Command className="size-2.5" /> : 'Ctrl'}
                    <span>K</span>
                </kbd>
            )}

            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 flex items-center justify-center text-zinc-500">
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Searching...
                        </div>
                    ) : !hasResults ? (
                        <div className="p-4 text-center text-zinc-500">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <>
                            {results.tasks.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800">
                                        Tasks
                                    </div>
                                    {results.tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="w-full px-3 py-2 flex items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                                        >
                                            <FileText className="size-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                    {task.project?.name || "Unknown Project"} • {task.status}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.projects.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800">
                                        Projects
                                    </div>
                                    {results.projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleProjectClick(project)}
                                            className="w-full px-3 py-2 flex items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                                        >
                                            <FolderOpen className="size-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                    {project.name}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                    {project.status} • {project.progress}% complete
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchDropdown;
