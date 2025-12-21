import api from '../configs/api';

export const savedFilterService = {
  async getFilters(projectId) {
    const params = projectId ? `?projectId=${projectId}` : '';
    const { data } = await api.get(`/saved-filters${params}`);
    return data.filters || [];
  },

  async getDefault(projectId) {
    const params = projectId ? `?projectId=${projectId}` : '';
    const { data } = await api.get(`/saved-filters/default${params}`);
    return data.filter;
  },

  async create(filterData) {
    const { data } = await api.post('/saved-filters', filterData);
    return data.filter;
  },

  async update(id, filterData) {
    const { data } = await api.put(`/saved-filters/${id}`, filterData);
    return data.filter;
  },

  async delete(id) {
    await api.delete(`/saved-filters/${id}`);
  },

  async setAsDefault(id) {
    const { data } = await api.put(`/saved-filters/${id}/set-default`);
    return data.filter;
  },
};
