import api from '../configs/api';

export const labelService = {
  // Get all labels for a workspace
  getByWorkspace: async (workspaceId) => {
    const { data } = await api.get(`/labels/workspace/${workspaceId}`);
    return data;
  },

  // Get a single label
  getById: async (id) => {
    const { data } = await api.get(`/labels/${id}`);
    return data;
  },

  // Create a new label
  create: async (labelData) => {
    const { data } = await api.post('/labels', labelData);
    return data;
  },

  // Update a label
  update: async (id, labelData) => {
    const { data } = await api.put(`/labels/${id}`, labelData);
    return data;
  },

  // Delete a label
  delete: async (id) => {
    const { data } = await api.delete(`/labels/${id}`);
    return data;
  },

  // Update task labels
  updateTaskLabels: async (taskId, labelIds) => {
    const { data } = await api.put(`/tasks/${taskId}/labels`, { labelIds });
    return data;
  },
};

export default labelService;
