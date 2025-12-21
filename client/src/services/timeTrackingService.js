import api from '../configs/api';

export const timeTrackingService = {
  getTaskTimeEntries: async (taskId) => {
    const { data } = await api.get(`/time-tracking/task/${taskId}`);
    return data;
  },

  getUserTimeEntries: async (limit = 50) => {
    const { data } = await api.get('/time-tracking/user', { params: { limit } });
    return data;
  },

  createTimeEntry: async (entryData) => {
    const { data } = await api.post('/time-tracking', entryData);
    return data;
  },

  updateTimeEntry: async (id, entryData) => {
    const { data } = await api.put(`/time-tracking/${id}`, entryData);
    return data;
  },

  deleteTimeEntry: async (id) => {
    const { data } = await api.delete(`/time-tracking/${id}`);
    return data;
  },

  startTimer: async (taskId, description) => {
    const { data } = await api.post(`/time-tracking/start/${taskId}`, { description });
    return data;
  },

  stopTimer: async (entryId) => {
    const { data } = await api.post(`/time-tracking/stop/${entryId}`);
    return data;
  },
};

export default timeTrackingService;
