import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";

function WorkspaceDropdown() {

    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const dropdownRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSelectWorkspace = (workspaceId) => {
        dispatch(setCurrentWorkspace(workspaceId))
        setIsOpen(false);
        navigate('/')
    }

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative m-4" ref={dropdownRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded shadow bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white font-medium">
                        {currentWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-800 dark:text-white text-sm truncate">
                            {currentWorkspace?.name || "Select Workspace"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg top-full left-0">
                    <div className="p-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">
                            Workspaces
                        </p>
                        {workspaces.map((workspace) => (
                            <div key={workspace.id} onClick={() => onSelectWorkspace(workspace.id)} className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" >
                                <div className="w-6 h-6 rounded bg-zinc-600 dark:bg-zinc-500 flex items-center justify-center text-white text-xs font-medium">
                                    {workspace.name?.charAt(0)?.toUpperCase() || 'W'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-white truncate">
                                        {workspace.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                        {workspace.members?.length || 0} members
                                    </p>
                                </div>
                                {currentWorkspace?.id === workspace.id && (
                                    <Check className="w-4 h-4 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-700" />

                    <div onClick={() => { setShowCreateDialog(true); setIsOpen(false); }} className="p-2 cursor-pointer rounded group hover:bg-zinc-100 dark:hover:bg-zinc-800" >
                        <p className="flex items-center text-xs gap-2 my-1 w-full text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                            <Plus className="w-4 h-4" /> Create Workspace
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkspaceDropdown;
