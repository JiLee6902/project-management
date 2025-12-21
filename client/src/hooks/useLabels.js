import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import labelService from '../services/labelService';
import toast from 'react-hot-toast';

export const useLabels = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);

  const fetchLabels = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setLoading(true);
    try {
      const { labels: data } = await labelService.getByWorkspace(currentWorkspace.id);
      setLabels(data || []);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      toast.error('Failed to load labels');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = async ({ name, color, description }) => {
    if (!currentWorkspace?.id) return null;

    try {
      const { label } = await labelService.create({
        name,
        color,
        description,
        workspaceId: currentWorkspace.id,
      });
      setLabels((prev) => [...prev, label]);
      toast.success('Label created');
      return label;
    } catch (error) {
      console.error('Failed to create label:', error);
      toast.error('Failed to create label');
      return null;
    }
  };

  const updateLabel = async (id, { name, color, description }) => {
    try {
      const { label } = await labelService.update(id, { name, color, description });
      setLabels((prev) => prev.map((l) => (l.id === id ? label : l)));
      toast.success('Label updated');
      return label;
    } catch (error) {
      console.error('Failed to update label:', error);
      toast.error('Failed to update label');
      return null;
    }
  };

  const deleteLabel = async (id) => {
    try {
      await labelService.delete(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
      toast.success('Label deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete label:', error);
      toast.error('Failed to delete label');
      return false;
    }
  };

  const updateTaskLabels = async (taskId, labelIds) => {
    try {
      const { task } = await labelService.updateTaskLabels(taskId, labelIds);
      return task;
    } catch (error) {
      console.error('Failed to update task labels:', error);
      toast.error('Failed to update labels');
      return null;
    }
  };

  return {
    labels,
    loading,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    updateTaskLabels,
  };
};

export default useLabels;
