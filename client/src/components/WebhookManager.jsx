import { useState, useEffect } from "react";
import {
  Webhook,
  Plus,
  Trash2,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import webhookService, { WebhookEvents, WebhookStatus } from "../services/webhookService";

const eventLabels = {
  [WebhookEvents.TASK_CREATED]: "Task Created",
  [WebhookEvents.TASK_UPDATED]: "Task Updated",
  [WebhookEvents.TASK_DELETED]: "Task Deleted",
  [WebhookEvents.TASK_STATUS_CHANGED]: "Task Status Changed",
  [WebhookEvents.TASK_ASSIGNED]: "Task Assigned",
  [WebhookEvents.COMMENT_ADDED]: "Comment Added",
  [WebhookEvents.SPRINT_STARTED]: "Sprint Started",
  [WebhookEvents.SPRINT_COMPLETED]: "Sprint Completed",
  [WebhookEvents.PROJECT_MEMBER_ADDED]: "Member Added",
  [WebhookEvents.PROJECT_MEMBER_REMOVED]: "Member Removed",
};

export default function WebhookManager({ projectId }) {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    secret: "",
    events: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(null);

  const cardClasses = "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";
  const inputClasses = "w-full px-3 py-2 rounded mt-1 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300";
  const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

  useEffect(() => {
    fetchWebhooks();
  }, [projectId]);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const data = await webhookService.getByProject(projectId);
      setWebhooks(data);
    } catch (error) {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.events.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    setIsSubmitting(true);
    try {
      await webhookService.create(projectId, formData);
      toast.success("Webhook created successfully");
      setShowCreateModal(false);
      setFormData({ name: "", url: "", secret: "", events: [] });
      fetchWebhooks();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (webhookId) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      await webhookService.delete(projectId, webhookId);
      toast.success("Webhook deleted");
      fetchWebhooks();
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTest = async (webhookId) => {
    setIsTesting(webhookId);
    try {
      const result = await webhookService.test(projectId, webhookId);
      if (result.success) {
        toast.success(`Test successful! Response: ${result.statusCode} (${result.responseTime}ms)`);
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error("Failed to test webhook");
    } finally {
      setIsTesting(null);
    }
  };

  const handleToggleStatus = async (webhook) => {
    try {
      const newStatus = webhook.status === WebhookStatus.ACTIVE ? WebhookStatus.INACTIVE : WebhookStatus.ACTIVE;
      await webhookService.update(projectId, webhook.id, { status: newStatus });
      toast.success(`Webhook ${newStatus === WebhookStatus.ACTIVE ? "activated" : "deactivated"}`);
      fetchWebhooks();
    } catch (error) {
      toast.error("Failed to update webhook status");
    }
  };

  const handleViewLogs = async (webhook) => {
    setSelectedWebhook(webhook);
    try {
      const data = await webhookService.getLogs(projectId, webhook.id);
      setLogs(data.logs || []);
      setShowLogsModal(true);
    } catch (error) {
      toast.error("Failed to load webhook logs");
    }
  };

  const toggleEvent = (event) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case WebhookStatus.ACTIVE:
        return <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"><CheckCircle className="size-3" /> Active</span>;
      case WebhookStatus.INACTIVE:
        return <span className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"><XCircle className="size-3" /> Inactive</span>;
      case WebhookStatus.FAILED:
        return <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded"><AlertTriangle className="size-3" /> Failed</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-zinc-500 dark:text-zinc-400">Loading webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 flex items-center gap-2">
            <Webhook className="size-5" /> Webhooks
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            Send real-time notifications to external services
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-br from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white rounded"
        >
          <Plus className="size-4" /> Add Webhook
        </button>
      </div>

      {/* Webhook List */}
      {webhooks.length === 0 ? (
        <div className={cardClasses}>
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <Webhook className="size-12 mx-auto mb-4 opacity-50" />
            <p>No webhooks configured</p>
            <p className="text-sm mt-1">Create a webhook to send notifications to external services</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className={cardClasses}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-300">{webhook.name}</h3>
                    {getStatusBadge(webhook.status)}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1 flex items-center gap-1">
                    <ExternalLink className="size-3" /> {webhook.url}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                        {eventLabels[event] || event}
                      </span>
                    ))}
                  </div>
                  {webhook.lastTriggeredAt && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 flex items-center gap-1">
                      <Clock className="size-3" /> Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                    </p>
                  )}
                  {webhook.failureCount > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {webhook.failureCount} consecutive failures
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(webhook.id)}
                    disabled={isTesting === webhook.id}
                    className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    title="Test webhook"
                  >
                    {isTesting === webhook.id ? (
                      <RefreshCw className="size-4 text-zinc-600 dark:text-zinc-400 animate-spin" />
                    ) : (
                      <Play className="size-4 text-zinc-600 dark:text-zinc-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleViewLogs(webhook)}
                    className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="View logs"
                  >
                    <Clock className="size-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(webhook)}
                    className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title={webhook.status === WebhookStatus.ACTIVE ? "Deactivate" : "Activate"}
                  >
                    {webhook.status === WebhookStatus.ACTIVE ? (
                      <EyeOff className="size-4 text-zinc-600 dark:text-zinc-400" />
                    ) : (
                      <Eye className="size-4 text-zinc-600 dark:text-zinc-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 rounded-lg border border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Delete webhook"
                  >
                    <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Create Webhook</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelClasses}>Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Slack Notification"
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  className={inputClasses}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Secret (optional)</label>
                <input
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="For HMAC signature verification"
                  className={inputClasses}
                />
                <p className="text-xs text-zinc-500 mt-1">Used to sign webhook payloads</p>
              </div>
              <div>
                <label className={labelClasses}>Events</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(eventLabels).map(([event, label]) => (
                    <label key={event} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-zinc-300 dark:border-zinc-700"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-gradient-to-br from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white rounded disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Delivery Logs - {selectedWebhook.name}
              </h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <XCircle className="size-5 text-zinc-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">No delivery logs yet</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {eventLabels[log.event] || log.event}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        log.status === "SUCCESS"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : log.status === "FAILED"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      {log.responseStatus && <span>HTTP {log.responseStatus}</span>}
                      {log.durationMs && <span>{log.durationMs}ms</span>}
                      <span>Attempt {log.attemptCount}</span>
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{log.errorMessage}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
