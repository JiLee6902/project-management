import { io } from 'socket.io-client';

let socket = null;

export const SocketEvents = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  COMMENT_ADDED: 'comment:added',
  ACTIVITY_ADDED: 'activity:added',
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_MEMBER_ADDED: 'project:member:added',
  JOIN_WORKSPACE: 'join:workspace',
  LEAVE_WORKSPACE: 'leave:workspace',
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',
};

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  const baseUrl = import.meta.env.VITE_BASEURL?.replace('/api', '') || 'http://localhost:3000';

  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinWorkspace = (workspaceId) => {
  if (socket?.connected) {
    socket.emit(SocketEvents.JOIN_WORKSPACE, { workspaceId });
  }
};

export const leaveWorkspace = (workspaceId) => {
  if (socket?.connected) {
    socket.emit(SocketEvents.LEAVE_WORKSPACE, { workspaceId });
  }
};

export const joinProject = (projectId) => {
  if (socket?.connected) {
    socket.emit(SocketEvents.JOIN_PROJECT, { projectId });
  }
};

export const leaveProject = (projectId) => {
  if (socket?.connected) {
    socket.emit(SocketEvents.LEAVE_PROJECT, { projectId });
  }
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinWorkspace,
  leaveWorkspace,
  joinProject,
  leaveProject,
  SocketEvents,
};
