import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { Task } from '../types';
import { useToast } from '../components/ToastProvider';

export const useTasks = (userId: string | undefined, includeDeleted: boolean = false) => {
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
    }, includeDeleted);

    return () => unsubscribe();
  }, [userId, includeDeleted]);

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

  const startTask = async (taskId: string) => {
    if (!userId) return;
    try {
      const startTime = new Date().toISOString();
      await updateTask(taskId, { 
        status: 'IN_PROGRESS', 
        startTime 
      });
      success?.("Task execution resumed.");
    } catch (err) {
      showError?.("Failed to initiate execution.");
    }
  };

  const pauseTask = async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'IN_PROGRESS' || !task.startTime) return;

    try {
      const now = new Date().toISOString();
      const start = new Date(task.startTime).getTime();
      const end = new Date(now).getTime();
      const elapsedMins = Math.round((end - start) / (1000 * 60));
      const totalMins = (task.actualMins || 0) + elapsedMins;

      await updateTask(taskId, {
        status: 'PAUSED',
        actualMins: totalMins,
        startTime: null as any
      });
      success?.("Task execution paused.");
    } catch (err) {
      showError?.("Failed to pause protocol.");
    }
  };

  const stopTask = async (taskId: string) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      let totalMins = task.actualMins || 0;
      const endTime = new Date().toISOString();

      if (task.status === 'IN_PROGRESS' && task.startTime) {
        const start = new Date(task.startTime).getTime();
        const end = new Date(endTime).getTime();
        const elapsedMins = Math.round((end - start) / (1000 * 60));
        totalMins += elapsedMins;
      }

      await updateTask(taskId, {
        status: 'COMPLETED',
        completed: true,
        actualMins: totalMins,
        endTime,
        completedAt: endTime,
        startTime: null as any
      });
      success?.("Objective completed. Productivity logged.");
    } catch (err) {
      showError?.("Failed to finalize task.");
    }
  };

  const restoreTask = async (taskId: string) => {
    if (!userId) return;
    try {
      await taskService.restoreTask(userId, taskId);
      success?.("Objective restored to active status.");
    } catch (err) {
      showError?.("Restoration failed.");
    }
  };

  const purgeTask = async (taskId: string) => {
    if (!userId) return;
    try {
      await taskService.purgeTask(userId, taskId);
      success?.("Objective permanently erased.");
    } catch (err) {
      showError?.("Erasure sequence failed.");
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask, startTask, pauseTask, stopTask, restoreTask, purgeTask };
};
