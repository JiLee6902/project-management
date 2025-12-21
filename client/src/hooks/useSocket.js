import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket, SocketEvents, joinWorkspace, leaveWorkspace, joinProject, leaveProject } from '../services/socket';
import { addTask, updateTask, deleteTask, addProject, updateProject, removeProject, addProjectMember } from '../features/workspaceSlice';

export const useSocket = () => {
  const dispatch = useDispatch();
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !currentWorkspace?.id) return;

    joinWorkspace(currentWorkspace.id);

    const handleTaskCreated = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(addTask(payload.task));
      }
    };

    const handleTaskUpdated = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(updateTask(payload.task));
      }
    };

    const handleTaskDeleted = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(deleteTask(payload.taskIds));
      }
    };

    const handleProjectCreated = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(addProject(payload.project));
      }
    };

    const handleProjectUpdated = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(updateProject(payload.project));
      }
    };

    const handleProjectDeleted = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(removeProject(payload.projectId));
      }
    };

    const handleProjectMemberAdded = (payload) => {
      if (payload.workspaceId === currentWorkspace.id) {
        dispatch(addProjectMember({ projectId: payload.projectId, member: payload.member }));
      }
    };

    socket.on(SocketEvents.TASK_CREATED, handleTaskCreated);
    socket.on(SocketEvents.TASK_UPDATED, handleTaskUpdated);
    socket.on(SocketEvents.TASK_DELETED, handleTaskDeleted);
    socket.on(SocketEvents.PROJECT_CREATED, handleProjectCreated);
    socket.on(SocketEvents.PROJECT_UPDATED, handleProjectUpdated);
    socket.on(SocketEvents.PROJECT_DELETED, handleProjectDeleted);
    socket.on(SocketEvents.PROJECT_MEMBER_ADDED, handleProjectMemberAdded);

    return () => {
      socket.off(SocketEvents.TASK_CREATED, handleTaskCreated);
      socket.off(SocketEvents.TASK_UPDATED, handleTaskUpdated);
      socket.off(SocketEvents.TASK_DELETED, handleTaskDeleted);
      socket.off(SocketEvents.PROJECT_CREATED, handleProjectCreated);
      socket.off(SocketEvents.PROJECT_UPDATED, handleProjectUpdated);
      socket.off(SocketEvents.PROJECT_DELETED, handleProjectDeleted);
      socket.off(SocketEvents.PROJECT_MEMBER_ADDED, handleProjectMemberAdded);
      leaveWorkspace(currentWorkspace.id);
    };
  }, [dispatch, currentWorkspace?.id]);

  return { joinProject, leaveProject };
};

export const useProjectSocket = (projectId) => {
  const dispatch = useDispatch();

  const handleCommentAdded = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.on(SocketEvents.COMMENT_ADDED, callback);
    return () => socket.off(SocketEvents.COMMENT_ADDED, callback);
  }, []);

  const handleActivityAdded = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};

    socket.on(SocketEvents.ACTIVITY_ADDED, callback);
    return () => socket.off(SocketEvents.ACTIVITY_ADDED, callback);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    if (!socket) return;

    joinProject(projectId);

    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  return { handleCommentAdded, handleActivityAdded };
};

export default useSocket;
