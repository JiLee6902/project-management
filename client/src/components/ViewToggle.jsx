import { List, LayoutGrid } from "lucide-react";

const ViewToggle = ({ view, onChange }) => {
    return (
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
                onClick={() => onChange("list")}
                className={`p-1.5 rounded transition ${
                    view === "list"
                        ? "bg-white dark:bg-zinc-700 shadow-sm"
                        : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                title="List view"
            >
                <List className="size-4 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button
                onClick={() => onChange("board")}
                className={`p-1.5 rounded transition ${
                    view === "board"
                        ? "bg-white dark:bg-zinc-700 shadow-sm"
                        : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                title="Board view"
            >
                <LayoutGrid className="size-4 text-zinc-600 dark:text-zinc-300" />
            </button>
        </div>
    );
};

export default ViewToggle;
