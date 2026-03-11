import api from '../configs/api';

export const marketplaceService = {
  // Search/list templates with optional filters
  searchTemplates: async (params = {}) => {
    const { data } = await api.get('/marketplace/templates', { params });
    return data;
  },

  // Get featured templates
  getFeaturedTemplates: async () => {
    const { data } = await api.get('/marketplace/templates/featured');
    return data;
  },

  // Get a single template by ID
  getTemplateById: async (id) => {
    const { data } = await api.get(`/marketplace/templates/${id}`);
    return data;
  },

  // Publish a new template
  publishTemplate: async (templateData) => {
    const { data } = await api.post('/marketplace/templates', templateData);
    return data;
  },

  // Install a template into a workspace
  installTemplate: async (id, workspaceId) => {
    const { data } = await api.post(`/marketplace/templates/${id}/install`, { workspaceId });
    return data;
  },

  // Submit a review for a template
  reviewTemplate: async (id, reviewData) => {
    const { data } = await api.post(`/marketplace/templates/${id}/review`, reviewData);
    return data;
  },

  // Get templates published by current user
  getMyTemplates: async () => {
    const { data } = await api.get('/marketplace/my-templates');
    return data;
  },
};

export default marketplaceService;
