import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import reportService from "../services/reportService";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const PERIOD_OPTIONS = [
  { value: "TODAY", label: "Today" },
  { value: "WEEK", label: "This Week" },
  { value: "MONTH", label: "This Month" },
  { value: "QUARTER", label: "This Quarter" },
  { value: "YEAR", label: "This Year" },
];

export default function AdvancedReports({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("WEEK");
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const cardClasses = "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";

  useEffect(() => {
    fetchReport();
  }, [projectId, period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getFullProjectReport(projectId, period);
      setReport(data);
    } catch (error) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="size-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-zinc-500 dark:text-zinc-400">No report data available</div>;
  }

  const { overview, memberProductivity, taskTrends, timeTracking } = report;

  // Prepare chart data
  const statusData = [
    { name: "To Do", value: overview.tasksByStatus.TODO, color: "#6b7280" },
    { name: "In Progress", value: overview.tasksByStatus.IN_PROGRESS, color: "#3b82f6" },
    { name: "Done", value: overview.tasksByStatus.DONE, color: "#10b981" },
  ];

  const priorityData = [
    { name: "Low", value: overview.tasksByPriority.LOW, color: "#6b7280" },
    { name: "Medium", value: overview.tasksByPriority.MEDIUM, color: "#f59e0b" },
    { name: "High", value: overview.tasksByPriority.HIGH, color: "#ef4444" },
  ];

  const typeData = Object.entries(overview.tasksByType)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 flex items-center gap-2">
            <TrendingUp className="size-5" /> Advanced Reports
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            Detailed analytics and insights for your project
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={fetchReport}
            className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="size-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {["overview", "productivity", "trends", "time"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab
                ? "border-zinc-900 dark:border-zinc-300 text-zinc-900 dark:text-zinc-300"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cardClasses}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{overview.totalTasks}</p>
                  <p className="text-xs text-zinc-500">Total Tasks</p>
                </div>
              </div>
            </div>
            <div className={cardClasses}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{overview.completionRate.toFixed(1)}%</p>
                  <p className="text-xs text-zinc-500">Completion Rate</p>
                </div>
              </div>
            </div>
            <div className={cardClasses}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{overview.overdueTasks}</p>
                  <p className="text-xs text-zinc-500">Overdue</p>
                </div>
              </div>
            </div>
            <div className={cardClasses}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="size-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{overview.averageCompletionTime.toFixed(1)}h</p>
                  <p className="text-xs text-zinc-500">Avg. Completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tasks by Status */}
            <div className={cardClasses}>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-4">Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks by Priority */}
            <div className={cardClasses}>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-4">Tasks by Priority</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Productivity Tab */}
      {activeTab === "productivity" && (
        <div className={cardClasses}>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-4 flex items-center gap-2">
            <Users className="size-4" /> Team Productivity
          </h3>
          {memberProductivity.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No productivity data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">Member</th>
                    <th className="text-center py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">Assigned</th>
                    <th className="text-center py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">Completed</th>
                    <th className="text-center py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">In Progress</th>
                    <th className="text-center py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">Completion %</th>
                    <th className="text-center py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">Story Points</th>
                  </tr>
                </thead>
                <tbody>
                  {memberProductivity.map((member) => (
                    <tr key={member.userId} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-300">{member.userName}</p>
                          <p className="text-xs text-zinc-500">{member.userEmail}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-zinc-700 dark:text-zinc-300">{member.tasksAssigned}</td>
                      <td className="text-center py-3 px-4 text-green-600 dark:text-green-400">{member.tasksCompleted}</td>
                      <td className="text-center py-3 px-4 text-blue-600 dark:text-blue-400">{member.tasksInProgress}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.completionRate >= 70
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : member.completionRate >= 40
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}>
                          {member.completionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-zinc-700 dark:text-zinc-300">{member.storyPointsCompleted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className={cardClasses}>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-4 flex items-center gap-2">
            <Calendar className="size-4" /> Task Trends
          </h3>
          {taskTrends.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No trend data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} dot={{ fill: '#10b981' }} />
                <Line type="monotone" dataKey="cumulative" stroke="#f59e0b" name="Cumulative Open" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Time Tracking Tab */}
      {activeTab === "time" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className={cardClasses}>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Logged</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {Math.floor(timeTracking.totalLoggedTime / 60)}h {timeTracking.totalLoggedTime % 60}m
              </p>
            </div>
            <div className={cardClasses}>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Estimated</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {Math.floor(timeTracking.totalEstimatedTime / 60)}h {timeTracking.totalEstimatedTime % 60}m
              </p>
            </div>
            <div className={cardClasses}>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Efficiency</p>
              <p className={`text-2xl font-bold mt-1 ${
                timeTracking.efficiency <= 100
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {timeTracking.efficiency.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Time by User */}
          <div className={cardClasses}>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-4">Time by Team Member</h3>
            {Object.keys(timeTracking.timeByUser).length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No time tracking data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(timeTracking.timeByUser).map(([user, minutes]) => (
                  <div key={user} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{user}</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {Math.floor(minutes / 60)}h {minutes % 60}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
