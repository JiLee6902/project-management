import api from '../configs/api';

export const webhookService = {
  // Get all webhooks for a project
  getByProject: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/webhooks`);
    return data;
  },

  // Get single webhook details
  getById: async (projectId, webhookId) => {
    const { data } = await api.get(`/projects/${projectId}/webhooks/${webhookId}`);
    return data;
  },

  // Create a new webhook
  create: async (projectId, webhookData) => {
    const { data } = await api.post(`/projects/${projectId}/webhooks`, webhookData);
    return data;
  },

  // Update webhook
  update: async (projectId, webhookId, webhookData) => {
    const { data } = await api.put(`/projects/${projectId}/webhooks/${webhookId}`, webhookData);
    return data;
  },

  // Delete webhook
  delete: async (projectId, webhookId) => {
    await api.delete(`/projects/${projectId}/webhooks/${webhookId}`);
  },

  // Test webhook delivery
  test: async (projectId, webhookId) => {
    const { data } = await api.post(`/projects/${projectId}/webhooks/${webhookId}/test`);
    return data;
  },

  // Get webhook delivery logs
  getLogs: async (projectId, webhookId, limit = 50, offset = 0) => {
    const { data } = await api.get(`/projects/${projectId}/webhooks/${webhookId}/logs`, {
      params: { limit, offset },
    });
    return data;
  },
};

// Webhook event types (for reference in UI)
export const WebhookEvents = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_ASSIGNED: 'task.assigned',
  COMMENT_ADDED: 'comment.added',
  SPRINT_STARTED: 'sprint.started',
  SPRINT_COMPLETED: 'sprint.completed',
  PROJECT_MEMBER_ADDED: 'project.member_added',
  PROJECT_MEMBER_REMOVED: 'project.member_removed',
};

// Webhook status types
export const WebhookStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  FAILED: 'FAILED',
};

export default webhookService;
