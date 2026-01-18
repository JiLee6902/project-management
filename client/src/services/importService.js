import api from '../configs/api';

const importService = {
  // Preview import file
  previewFile: async (file, source) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/import/preview?source=${source}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Import tasks from file
  importTasks: async (file, config) => {
    const formData = new FormData();
    formData.append('file', file);

    // Append config fields
    Object.keys(config).forEach(key => {
      if (config[key] !== undefined) {
        if (typeof config[key] === 'object') {
          formData.append(key, JSON.stringify(config[key]));
        } else {
          formData.append(key, config[key]);
        }
      }
    });

    const response = await api.post('/import/tasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Import from Trello
  importFromTrello: async (workspaceId, boardData, importArchived = false) => {
    const response = await api.post('/import/trello', {
      workspaceId,
      boardData,
      importArchived,
    });
    return response.data;
  },

  // Download import template
  downloadTemplate: async (entity) => {
    const response = await api.get(`/import/template?entity=${entity}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${entity}-template.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default importService;
