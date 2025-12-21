import api from '../configs/api';

export const attachmentService = {
  async getTaskAttachments(taskId) {
    const { data } = await api.get(`/attachments/task/${taskId}`);
    return data.attachments || [];
  },

  async uploadAttachment(taskId, projectId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(
      `/attachments/task/${taskId}?projectId=${projectId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.attachment;
  },

  async uploadMultipleAttachments(taskId, projectId, files) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await api.post(
      `/attachments/task/${taskId}/multiple?projectId=${projectId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.attachments;
  },

  async deleteAttachment(id, projectId) {
    await api.delete(`/attachments/${id}?projectId=${projectId}`);
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ppt';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'zip';
    return 'file';
  },
};
