import api from '../configs/api';

export const exportService = {
  exportProjectTasksCsv: async (projectId) => {
    const response = await api.get(`/export/project/${projectId}/tasks?format=csv`, {
      responseType: 'blob',
    });
    return response;
  },

  exportProjectTasksJson: async (projectId) => {
    const { data } = await api.get(`/export/project/${projectId}/tasks?format=json`);
    return data;
  },

  getProjectSummary: async (projectId) => {
    const { data } = await api.get(`/export/project/${projectId}/summary`);
    return data;
  },

  downloadCsv: async (projectId, projectName) => {
    try {
      const response = await api.get(`/export/project/${projectId}/tasks?format=csv`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_tasks_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  downloadJson: async (projectId, projectName) => {
    try {
      const { data } = await api.get(`/export/project/${projectId}/tasks?format=json`);

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_tasks_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

export default exportService;
