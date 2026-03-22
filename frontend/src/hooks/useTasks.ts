import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { Task } from '../types';
import { useToast } from '../components/ToastProvider';

export const useTasks = (userId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast() || {};

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = taskService.subscribeToTasks(userId, (fetchedTasks, fetchError) => {
      if (fetchError) {
          if (fetchError.message.includes('index')) {
              showError?.("Database Index Missing. Check console for the creation link.");
          } else {
              showError?.("Failed to synchronize tasks.");
          }
      }
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addTask = async (taskData: Partial<Task>, dueDate?: string) => {
    if (!userId) return;
    try {
      await taskService.createTask(userId, { 
        ...taskData, 
        dueDate: dueDate || new Date().toISOString().split('T')[0] 
      });
      success?.("Mission objective deployed.");
    } catch (err) {
      showError?.("Deployment failed. System offline?");
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!userId) return;
    try {
      await taskService.updateTask(userId, taskId, updates);
    } catch (err) {
      showError?.("Update sequence interrupted.");
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;
    try {
      await taskService.deleteTask(userId, taskId);
      success?.("Objective purged.");
    } catch (err) {
      showError?.("Protocol failure during purge.");
      throw err;
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
};
