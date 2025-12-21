import { useState, useMemo } from "react";
import { format, differenceInDays, addDays, startOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const GanttChart = ({ tasks = [] }) => {
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date()));
  const [daysToShow, setDaysToShow] = useState(14);

  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, daysToShow - 1),
    });
  }, [startDate, daysToShow]);

  const navigateWeek = (direction) => {
    setStartDate((prev) => addDays(prev, direction * 7));
  };

  const getTaskPosition = (task) => {
    if (!task.dueDate) return null;

    const dueDate = new Date(task.dueDate);
    const createdDate = new Date(task.createdAt);

    // Calculate start and end positions
    const taskStart = differenceInDays(createdDate, startDate);
    const taskEnd = differenceInDays(dueDate, startDate);

    // Check if task is within visible range
    if (taskEnd < 0 || taskStart > daysToShow) return null;

    const left = Math.max(0, taskStart);
    const width = Math.min(daysToShow - 1, taskEnd) - left + 1;

    return {
      left: (left / daysToShow) * 100,
      width: (width / daysToShow) * 100,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DONE":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      default:
        return "bg-zinc-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "border-l-red-500";
      case "MEDIUM":
        return "border-l-amber-500";
      default:
        return "border-l-zinc-400";
    }
  };

  const tasksWithDates = tasks.filter((t) => t.dueDate);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="size-5" /> Timeline View
        </h3>

        <div className="flex items-center gap-2">
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
            <option value={7}>1 Week</option>
            <option value={14}>2 Weeks</option>
            <option value={30}>1 Month</option>
          </select>

          <div className="flex items-center">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              <ChevronLeft className="size-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={() => setStartDate(startOfWeek(new Date()))}
              className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              <ChevronRight className="size-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        {/* Date Headers */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="w-48 flex-shrink-0 p-2 border-r border-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Task</span>
          </div>
          <div className="flex-1 flex">
            {dates.map((date, index) => {
              const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={index}
                  className={`flex-1 p-2 text-center border-r border-zinc-200 dark:border-zinc-700 last:border-r-0 ${
                    isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  } ${isWeekend ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                >
                  <div className="text-xs text-zinc-500">{format(date, "EEE")}</div>
                  <div className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-zinc-900 dark:text-white"}`}>
                    {format(date, "d")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Rows */}
        {tasksWithDates.length > 0 ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {tasksWithDates.map((task) => {
              const position = getTaskPosition(task);

              return (
                <div key={task.id} className="flex min-h-[48px]">
                  <div className="w-48 flex-shrink-0 p-2 border-r border-zinc-200 dark:border-zinc-700 flex items-center">
                    <span className="text-sm text-zinc-900 dark:text-white truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex-1 relative p-2">
                    {position && (
                      <div
                        className={`absolute top-2 h-8 rounded ${getStatusColor(task.status)} border-l-4 ${getPriorityColor(task.priority)} flex items-center px-2 cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{
                          left: `${position.left}%`,
                          width: `${Math.max(position.width, 5)}%`,
                        }}
                        title={`${task.title} - Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`}
                      >
                        <span className="text-xs text-white truncate font-medium">
                          {task.title}
                        </span>
                      </div>
                    )}

                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {dates.map((date, index) => {
                        const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                        return (
                          <div
                            key={index}
                            className={`flex-1 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 ${
                              isToday ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            No tasks with due dates to display
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-zinc-400" />
          <span className="text-zinc-600 dark:text-zinc-400">To Do</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-zinc-600 dark:text-zinc-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-zinc-600 dark:text-zinc-400">Done</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
