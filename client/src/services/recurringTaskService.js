import api from '../configs/api';

const recurringTaskService = {
  // Get all recurring tasks for a project
  getByProject: async (projectId) => {
    const response = await api.get(`/recurring-tasks/project/${projectId}`);
    return response.data;
  },

  // Get single recurring task
  getById: async (id) => {
    const response = await api.get(`/recurring-tasks/${id}`);
    return response.data;
  },

  // Create new recurring task
  create: async (data) => {
    const response = await api.post('/recurring-tasks', data);
    return response.data;
  },

  // Update recurring task
  update: async (id, data) => {
    const response = await api.patch(`/recurring-tasks/${id}`, data);
    return response.data;
  },

  // Delete recurring task
  delete: async (id) => {
    const response = await api.delete(`/recurring-tasks/${id}`);
    return response.data;
  },

  // Pause recurring task
  pause: async (id) => {
    const response = await api.post(`/recurring-tasks/${id}/pause`);
    return response.data;
  },

  // Resume recurring task
  resume: async (id) => {
    const response = await api.post(`/recurring-tasks/${id}/resume`);
    return response.data;
  },

  // Generate next task immediately
  generateNow: async (id) => {
    const response = await api.post(`/recurring-tasks/${id}/generate`);
    return response.data;
  },
};

export default recurringTaskService;
