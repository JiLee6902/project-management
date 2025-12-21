import api from '../configs/api';

export const subtaskService = {
  // Get all subtasks for a task
  getByTask: async (taskId) => {
    const { data } = await api.get(`/tasks/${taskId}/subtasks`);
    return data;
  },

  // Create a new subtask
  create: async (subtaskData) => {
    const { data } = await api.post('/tasks/subtasks', subtaskData);
    return data;
  },

  // Update a subtask
  update: async (id, subtaskData) => {
    const { data } = await api.put(`/tasks/subtasks/${id}`, subtaskData);
    return data;
  },

  // Toggle subtask completed status
  toggle: async (id) => {
    const { data } = await api.put(`/tasks/subtasks/${id}/toggle`);
    return data;
  },

  // Delete a subtask
  delete: async (id) => {
    const { data } = await api.delete(`/tasks/subtasks/${id}`);
    return data;
  },

  // Reorder subtasks
  reorder: async (taskId, subtaskIds) => {
    const { data } = await api.put(`/tasks/${taskId}/subtasks/reorder`, { subtaskIds });
    return data;
  },
};

export default subtaskService;
