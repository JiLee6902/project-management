import api from '../configs/api';

export const aiService = {
  // Generate subtasks from task title and description
  generateSubtasks: async (taskTitle, taskDescription) => {
    const { data } = await api.post('/ai/subtasks', {
      taskTitle,
      taskDescription,
    });
    return data;
  },

  // Suggest priority based on task context
  suggestPriority: async (taskTitle, taskDescription, projectContext) => {
    const { data } = await api.post('/ai/priority', {
      taskTitle,
      taskDescription,
      projectContext,
    });
    return data;
  },

  // Estimate time for a task
  estimateTime: async (taskTitle, taskDescription, subtasks) => {
    const { data } = await api.post('/ai/estimate', {
      taskTitle,
      taskDescription,
      subtasks,
    });
    return data;
  },

  // Summarize sprint tasks
  summarizeSprint: async (tasks) => {
    const { data } = await api.post('/ai/sprint-summary', { tasks });
    return data;
  },

  // Improve task description
  improveDescription: async (taskTitle, currentDescription) => {
    const { data } = await api.post('/ai/improve-description', {
      taskTitle,
      currentDescription,
    });
    return data;
  },
};

export default aiService;
