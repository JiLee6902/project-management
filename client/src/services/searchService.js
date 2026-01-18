import api from '../configs/api';

const searchService = {
  // Basic search for tasks and projects
  search: async (query) => {
    const response = await api.get('/search', { params: { q: query } });
    return response.data;
  },

  // Search only tasks
  searchTasks: async (query, limit = 10) => {
    const response = await api.get('/search/tasks', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Search only projects
  searchProjects: async (query, limit = 10) => {
    const response = await api.get('/search/projects', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Search users in workspace
  searchUsers: async (query, limit = 10) => {
    const response = await api.get('/search/users', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Global search across all entities
  globalSearch: async (query, options = {}) => {
    const params = {
      q: query,
      includeComments: options.includeComments || false,
      includeUsers: options.includeUsers || false,
      limit: options.limit || 20,
    };
    const response = await api.get('/search/global', { params });
    return response.data;
  },

  // Get search suggestions
  getSuggestions: async (limit = 5) => {
    const response = await api.get('/search/suggestions', {
      params: { limit },
    });
    return response.data;
  },

  // Smart search with fuzzy fallback
  smartSearch: async (query, limit = 10) => {
    const response = await api.get('/search/smart', {
      params: { q: query, limit },
    });
    return response.data;
  },
};

export default searchService;
