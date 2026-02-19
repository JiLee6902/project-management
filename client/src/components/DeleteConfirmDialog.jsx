import { AlertTriangle, Loader2, X } from "lucide-react";

const DeleteConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    message = "Are you sure you want to delete this item? This action cannot be undone.",
    itemCount = 1,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl animate-modal-enter w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        <X className="size-5 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        {message}
                    </p>

                    {itemCount > 1 && (
                        <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                <span className="font-semibold text-red-600 dark:text-red-400">{itemCount}</span> items will be permanently deleted.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>Delete{itemCount > 1 ? ` (${itemCount})` : ""}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmDialog;
