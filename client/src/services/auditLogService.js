import api from '../configs/api';

const auditLogService = {
  // Query audit logs with filters
  query: async (params) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  // Get audit log by ID
  getById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },

  // Get audit history for an entity
  getEntityHistory: async (entityType, entityId) => {
    const response = await api.get(`/audit-logs/entity/${entityType}/${entityId}`);
    return response.data;
  },

  // Get user activity
  getUserActivity: async (userId, limit = 50) => {
    const response = await api.get(`/audit-logs/user/${userId}/activity`, {
      params: { limit },
    });
    return response.data;
  },

  // Get workspace statistics
  getStatistics: async (workspaceId, startDate, endDate) => {
    const response = await api.get(`/audit-logs/workspace/${workspaceId}/statistics`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default auditLogService;
