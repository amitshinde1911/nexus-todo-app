import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { Task } from '../types';
import { useToast } from '../components/ToastProvider';

const PRIORITY_SCORES: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
};

export const useTasks = (userId: string | undefined, includeDeleted: boolean = false) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast() || {};

  // Instant Local Cache Recovery
  useEffect(() => {
    if (userId) {
      const cached = localStorage.getItem(`tasks_${userId}`);
      if (cached) {
        setTasks(JSON.parse(cached));
        setLoading(false);
      }
    }
  }, [userId]);

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

      // Generate Recurring Tasks
      const todayStr = new Date().toISOString().split('T')[0];
      const todayNum = new Date().getDay();
      
      const processRecurring = async () => {
          for (const task of fetchedTasks) {
              if (task.isRecurring && !task.deleted && task.lastGeneratedDate !== todayStr) {
                  let shouldGen = false;
                  if (task.recurrenceType === 'DAILY') shouldGen = true;
                  else if (task.recurrenceType === 'WEEKLY' && task.recurrenceDays?.includes(todayNum)) shouldGen = true;
                  else if (task.recurrenceType === 'CUSTOM' && task.recurrenceDays?.includes(todayNum)) shouldGen = true;
  
                  if (shouldGen) {
                      try {
                          // Update template immediately to prevent loops
                          await taskService.updateTask(userId, task.id, { lastGeneratedDate: todayStr });
                          // Create today's instance
                          const newTaskData: Partial<Task> = {
                              title: task.title,
                              priority: task.priority,
                              category: task.category,
                              dueDate: todayStr,
                              dueTime: task.dueTime ?? null,
                              isRecurring: false,
                              repeat: 'NONE',
                              isRitual: task.isRitual,
                              subtasksJson: task.subtasksJson,
                              notes: task.notes
                          };
                          
                          if (task.estimatedMins !== undefined) newTaskData.estimatedMins = task.estimatedMins;
                          if (task.notes !== undefined) newTaskData.notes = task.notes;
                          if (task.subtasksJson !== undefined) newTaskData.subtasksJson = task.subtasksJson;

                          await taskService.createTask(userId, newTaskData);
                      } catch (err) {
                          console.error("Failed to spawn recurring task", err);
                      }
                  }
              }
          }
      };
      
      processRecurring();

      processRecurring();

      setTasks(fetchedTasks);
      setLoading(false);
      if (userId) {
          localStorage.setItem(`tasks_${userId}`, JSON.stringify(fetchedTasks));
      }
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
      const finalUpdates = { ...updates };
      if (finalUpdates.completed === true && !finalUpdates.completedAt) {
          finalUpdates.completedAt = new Date().toISOString();
      } else if (finalUpdates.completed === false) {
          finalUpdates.completedAt = null;
      }
      await taskService.updateTask(userId, taskId, finalUpdates);
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
      
      // Auto-unlock next execution phase task
      if (task.isExecutionMode) {
          const nextOrder = (task.executionOrder || 0) + 1;
          const nextTask = tasks.find(t => t.isExecutionMode && t.executionOrder === nextOrder && !t.deleted && !t.completed);
          if (nextTask) {
              await updateTask(nextTask.id, { isLocked: false });
              success?.("Objective completed. Next execution phase unlocked.");
          } else {
              success?.("Execution Mode Protocol complete! All targets neutralized.");
          }
      } else {
          success?.("Objective completed. Productivity logged.");
      }
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

  const startExecutionSession = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.deleted && !t.completed && !t.isRecurring);
      
      if (todayTasks.length === 0) {
          showError?.("No pending objectives to execute.");
          return;
      }

      const sortedTasks = [...todayTasks].sort((a, b) => {
          const scoreA = PRIORITY_SCORES[a.priority] || 0;
          const scoreB = PRIORITY_SCORES[b.priority] || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          
          if (a.dueTime && !b.dueTime) return -1;
          if (!a.dueTime && b.dueTime) return 1;
          if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
          return 0;
      });

      await Promise.all(sortedTasks.map((t, i) => updateTask(t.id, {
          isExecutionMode: true,
          executionOrder: i,
          isLocked: i !== 0
      })));
      
      success?.("Execution Mode Engaged. Proceed directly to the target.");
  };

  const exitExecutionSession = async () => {
      const execTasks = tasks.filter(t => !t.deleted && t.isExecutionMode && !t.completed);
      await Promise.all(execTasks.map(t => updateTask(t.id, {
          isExecutionMode: false,
          executionOrder: null as any, // Firebase handles null properly. Cast to any if strict typing complains since it expects number | undefined.
          isLocked: false
      })));
      success?.("Execution Mode manually overridden.");
  };

  const initializeMorningRitual = async () => {
      if (!userId) return;
      try {
          // Prevent duplicates
          const existing = tasks.find(t => t.title === "Morning SAVERS Ritual" && t.isRecurring && !t.deleted);
          if (existing) {
              success?.("Morning Ritual template already exists.");
              return;
          }

          // Hal Elrod SAVERS customization
          const saversSteps = [
              { id: "1", title: "Wash & Drink Sabja Water", completed: false, duration: 5 },
              { id: "2", title: "Brush Teeth", completed: false, duration: 3 },
              { id: "3", title: "Exercise (Walk)", completed: false, duration: 20 },
              { id: "4", title: "Silence (Meditate)", completed: false, duration: 10 },
              { id: "5", title: "Read a Book", completed: false, duration: 15 }
          ];

          const ritualData = {
              title: "Morning SAVERS Ritual",
              priority: 'URGENT' as any, // Top priority morning routine
              category: 'Habit' as any,
              dueDate: '', // No due date for template
              dueTime: '06:00',
              repeat: 'DAILY' as any,
              isRecurring: true,
              recurrenceType: 'DAILY' as any,
              isRitual: true,
              subtasksJson: JSON.stringify(saversSteps),
              notes: "My perfect guided morning sequence."
          };

          await addTask(ritualData);
          success?.("Morning Ritual initialized. A daily instance will spawn automatically.");
      } catch(err) {
          showError?.("Failed to generate ritual template.");
      }
  };

  const executeProtocol = async (templateId: string, setTab: (t: string) => void) => {
      if (!userId) return;
      const todayStr = new Date().toISOString().split('T')[0];
      
      const template = tasks.find(t => t.id === templateId && !t.deleted);
      if (!template) return;

      // 1. Find if today's ritual FOR THIS TEMPLATE already exists
      let todaysRitual = tasks.find(t => t.isRitual && t.dueDate === todayStr && !t.deleted && t.title === template.title);
      
      if (!todaysRitual) {
          const ritualData = {
              title: template.title,
              priority: 'URGENT' as any,
              category: 'Habit' as any,
              dueDate: todayStr,
              dueTime: '06:00',
              repeat: 'NONE' as any,
              isRecurring: false,
              isRitual: true,
              subtasksJson: template.subtasksJson,
              notes: template.notes
          };
          
          try {
              setLoading(true);
              const newId = await taskService.createTask(userId, ritualData as any);
              await taskService.updateTask(userId, newId, { status: 'IN_PROGRESS', startTime: new Date().toISOString() });
              await new Promise(r => setTimeout(r, 500)); 
          } catch (e) {
              showError?.("Failed to start protocol.");
              setLoading(false);
              return;
          }
      } else {
          if (todaysRitual.status !== 'IN_PROGRESS') {
              await updateTask(todaysRitual.id, { status: 'IN_PROGRESS' });
          }
      }
      
      setTab('FOCUS');
  };

  return { 
    tasks: tasks.filter(t => !t.isRecurring && !t.isRitual),
    rituals: tasks.filter(t => !t.isRecurring && t.isRitual),
    templates: tasks.filter(t => t.isRecurring),
    loading, addTask, updateTask, deleteTask, startTask, pauseTask, stopTask, 
    restoreTask, purgeTask, startExecutionSession, exitExecutionSession, initializeMorningRitual, executeProtocol
  };
};
