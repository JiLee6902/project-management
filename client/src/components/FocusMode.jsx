import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Focus,
  X,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX
} from "lucide-react";
import { LabelBadge } from "./labels";

const FocusMode = ({ task, onClose, onStatusChange }) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    // Add keyboard shortcut to exit
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleComplete = () => {
    if (soundEnabled) {
      // Play completion sound (optional)
      const audio = new Audio("/complete.mp3");
      audio.play().catch(() => {});
    }
    onStatusChange(task.id, "DONE");
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400">
          <Focus className="size-5" />
          <span className="text-sm">Focus Mode</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-zinc-400 hover:text-white transition"
          >
            {soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Task Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 mb-4">
              <span className="text-sm">{task.project?.name}</span>
              <ChevronRight className="size-4" />
              <span className="text-sm">{task.type}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {task.title}
            </h1>

            {task.description && (
              <p className="text-lg text-zinc-400 max-w-xl mx-auto">
                {task.description}
              </p>
            )}

            {task.labels?.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {task.labels.map((label) => (
                  <LabelBadge key={label.id} label={label} size="sm" />
                ))}
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="bg-zinc-800/50 rounded-2xl p-8 text-center">
            <p className="text-sm text-zinc-500 mb-2">Time Elapsed</p>
            <p className="text-6xl md:text-7xl font-mono font-bold text-white mb-6">
              {formatTime(elapsedTime)}
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition ${
                  isTimerRunning
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="size-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-5" /> {elapsedTime > 0 ? "Resume" : "Start"}
                  </>
                )}
              </button>

              {elapsedTime > 0 && (
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setElapsedTime(0);
                  }}
                  className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition"
                >
                  <RotateCcw className="size-5" />
                </button>
              )}
            </div>
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Status</p>
              <p className="text-white font-medium">{task.status.replace("_", " ")}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Priority</p>
              <p className="text-white font-medium">{task.priority}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Due Date</p>
              <p className="text-white font-medium">
                {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "-"}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-500 mb-1">Story Points</p>
              <p className="text-white font-medium">{task.storyPoints || "-"}</p>
            </div>
          </div>

          {/* Subtasks */}
          {task.subtasks?.length > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-6">
              <h3 className="text-sm text-zinc-500 mb-4">
                Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </h3>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`flex items-center gap-3 p-2 rounded ${
                      subtask.completed ? "text-zinc-500" : "text-white"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        subtask.completed
                          ? "bg-green-600 border-green-600"
                          : "border-zinc-600"
                      }`}
                    >
                      {subtask.completed && <CheckCircle2 className="size-4" />}
                    </div>
                    <span className={subtask.completed ? "line-through" : ""}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Button */}
          {task.status !== "DONE" && (
            <div className="text-center">
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full text-lg font-medium mx-auto transition"
              >
                <CheckCircle2 className="size-6" />
                Mark as Complete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 text-center text-sm text-zinc-500">
        Press <kbd className="px-2 py-1 bg-zinc-800 rounded">Esc</kbd> to exit focus mode
      </div>
    </div>
  );
};

export default FocusMode;
