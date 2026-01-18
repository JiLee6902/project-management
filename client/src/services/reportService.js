import api from '../configs/api';

export const reportService = {
  // Get dashboard overview for a project
  getDashboardOverview: async (projectId) => {
    const { data } = await api.get(`/reports/dashboard/${projectId}`);
    return data;
  },

  // Get sprint burndown chart data
  getSprintBurndown: async (sprintId) => {
    const { data } = await api.get(`/reports/burndown/${sprintId}`);
    return data;
  },

  // Get member productivity report for a project
  getMemberProductivity: async (projectId) => {
    const { data } = await api.get(`/reports/productivity/${projectId}`);
    return data;
  },

  // Get time tracking summary
  getTimeTrackingSummary: async (projectId, period = 'WEEK', startDate = null, endDate = null) => {
    const params = { projectId, period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await api.get('/reports/time-tracking', { params });
    return data;
  },

  // Get task trends over time
  getTaskTrends: async (projectId, period = 'WEEK', startDate = null, endDate = null) => {
    const params = { projectId, period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await api.get('/reports/trends', { params });
    return data;
  },

  // Get full project report
  getFullProjectReport: async (projectId, period = 'WEEK', startDate = null, endDate = null) => {
    const params = { period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await api.get(`/reports/full/${projectId}`, { params });
    return data;
  },
};

export default reportService;
