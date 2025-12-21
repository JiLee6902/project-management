import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, Loader2 } from "lucide-react";
import api from "../configs/api";
import toast from "react-hot-toast";

const BurndownChart = ({ sprintId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sprintId) {
      fetchBurndownData();
    }
  }, [sprintId]);

  const fetchBurndownData = async () => {
    try {
      const { data } = await api.get(`/sprints/${sprintId}/burndown`);
      setData(data);
    } catch (error) {
      toast.error("Failed to load burndown data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No burndown data available
      </div>
    );
  }

  const chartData = data.idealLine?.map((point, index) => ({
    day: `Day ${point.day}`,
    ideal: point.points,
    actual: index === 0 ? data.totalPoints : (index === data.idealLine.length - 1 ? data.remainingPoints : null),
  })) || [];

  // Add actual remaining at end
  if (chartData.length > 0) {
    chartData[chartData.length - 1].actual = data.remainingPoints;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <TrendingDown className="size-5" /> Sprint Burndown
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Total: </span>
            <span className="font-medium text-zinc-900 dark:text-white">
              {data.totalPoints} pts
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Completed: </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {data.completedPoints} pts
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Remaining: </span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {data.remainingPoints} pts
            </span>
          </div>
        </div>
      </div>

      <div className="h-64 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              className="text-zinc-500"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-zinc-500"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-color, #fff)",
                border: "1px solid var(--border-color, #e5e7eb)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="linear"
              dataKey="ideal"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              name="Ideal"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Actual"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Sprint Progress</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {Math.round((data.completedPoints / data.totalPoints) * 100) || 0}%
          </span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
            style={{ width: `${(data.completedPoints / data.totalPoints) * 100 || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BurndownChart;
