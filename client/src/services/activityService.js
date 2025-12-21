import api from '../configs/api';

export const activityService = {
  // Get activities for a project
  getByProject: async (projectId, limit = 50, offset = 0) => {
    const { data } = await api.get(`/activities/project/${projectId}`, {
      params: { limit, offset },
    });
    return data;
  },

  // Get activities for a task
  getByTask: async (taskId, limit = 50, offset = 0) => {
    const { data } = await api.get(`/activities/task/${taskId}`, {
      params: { limit, offset },
    });
    return data;
  },
};

export default activityService;
