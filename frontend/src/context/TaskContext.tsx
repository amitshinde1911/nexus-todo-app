import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { taskService } from '../services/taskService';
import { Task, ProtocolStep } from '../types';
import { useToast } from '../components/ToastProvider';

interface TaskContextType {
    tasks: Task[];
    rituals: Task[];
    staples: Task[];
    templates: Task[];
    allData: Task[];
    loading: boolean;
    dailyMetrics: any;
    addTask: (taskData: Partial<Task>, dueDate?: string) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    startTask: (taskId: string) => Promise<void>;
    pauseTask: (taskId: string) => Promise<void>;
    stopTask: (taskId: string) => Promise<void>;
    restoreTask: (taskId: string) => Promise<void>;
    purgeTask: (taskId: string) => Promise<void>;
    startExecutionSession: () => Promise<void>;
    exitExecutionSession: () => Promise<void>;
    initializeMorningRitual: () => Promise<void>;
    executeProtocol: (templateId: string, setTab: (t: string) => void) => Promise<void>;
    updateSubtaskStatus: (taskId: string, subtaskId: string, status: 'completed' | 'deferred' | 'pending') => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const PRIORITY_SCORES: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
};

export const TaskProvider: React.FC<{ children: ReactNode; userId: string | undefined }> = ({ children, userId }) => {
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { success, error: showError } = useToast() || {};

    // Instant Local Cache Recovery
    useEffect(() => {
        if (userId) {
            const cached = localStorage.getItem(`tasks_${userId}`);
            if (cached) {
                setAllTasks(JSON.parse(cached));
                setLoading(false);
            }
        } else {
            setAllTasks([]);
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setAllTasks([]);
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
                                await taskService.updateTask(userId, task.id, { lastGeneratedDate: todayStr });
                                const newTaskData: Partial<Task> = {
                                    title: task.title,
                                    priority: task.priority,
                                    category: task.category,
                                    dueDate: todayStr,
                                    dueTime: task.dueTime ?? null,
                                    isRecurring: false,
                                    repeat: 'NONE',
                                    isRitual: task.isRitual,
                                    isEssential: task.isEssential,
                                    subtasksJson: task.subtasksJson,
                                    notes: task.notes,
                                    estimatedMins: task.estimatedMins
                                };
                                await taskService.createTask(userId, newTaskData);
                            } catch (err) {
                                console.error("Failed to spawn recurring task", err);
                            }
                        }
                    }
                }
            };
            
            processRecurring();
            setAllTasks(fetchedTasks);
            setLoading(false);
            localStorage.setItem(`tasks_${userId}`, JSON.stringify(fetchedTasks));
        });

        return () => unsubscribe();
    }, [userId]);

    const addTask = async (taskData: Partial<Task>, dueDate?: string) => {
        if (!userId) return;
        const targetDate = dueDate || new Date().toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        try {
            const newTaskId = await taskService.createTask(userId, { 
                ...taskData, 
                dueDate: targetDate 
            });

            // If it's a recurring staple/ritual and starts TODAY, spawn the first instance immediately
            if (taskData.isRecurring && targetDate === todayStr && newTaskId) {
                await taskService.createTask(userId, {
                    title: taskData.title,
                    priority: taskData.priority,
                    category: taskData.category,
                    dueDate: todayStr,
                    dueTime: taskData.dueTime ?? null,
                    isRecurring: false,
                    isRitual: taskData.isRitual,
                    isEssential: taskData.isEssential,
                    subtasksJson: taskData.subtasksJson,
                    notes: taskData.notes,
                    estimatedMins: taskData.estimatedMins,
                    repeat: 'NONE'
                });
                // Mark template as generated for today
                await taskService.updateTask(userId, newTaskId, { lastGeneratedDate: todayStr });
            }

            success?.("Behavioral objective deployed.");
        } catch (err) {
            showError?.("Deployment failed.");
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
            showError?.("Update failed.");
            throw err;
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!userId) return;
        try {
            await taskService.deleteTask(userId, taskId);
            success?.("Objective purged.");
        } catch (err) {
            showError?.("Purge failed.");
            throw err;
        }
    };

    const startTask = async (taskId: string) => {
        if (!userId) return;
        try {
            await updateTask(taskId, { status: 'IN_PROGRESS', startTime: new Date().toISOString() });
            success?.("Execution resumed.");
        } catch (err) { showError?.("Failed to initiate."); }
    };

    const pauseTask = async (taskId: string) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task || task.status !== 'IN_PROGRESS' || !task.startTime || !userId) return;
        try {
            const elapsed = Math.round((Date.now() - new Date(task.startTime).getTime()) / (1000 * 60));
            await updateTask(taskId, { status: 'PAUSED', actualMins: (task.actualMins || 0) + elapsed, startTime: null as any });
            success?.("Execution paused.");
        } catch (err) { showError?.("Pause failed."); }
    };

    const stopTask = async (taskId: string) => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task || !userId) return;
        try {
            let totalMins = task.actualMins || 0;
            const now = new Date().toISOString();
            if (task.status === 'IN_PROGRESS' && task.startTime) {
                totalMins += Math.round((Date.now() - new Date(task.startTime).getTime()) / (1000 * 60));
            }
            await updateTask(taskId, { status: 'COMPLETED', completed: true, actualMins: totalMins, endTime: now, completedAt: now, startTime: null as any });
            if (task.isExecutionMode) {
                const next = allTasks.find(t => t.isExecutionMode && t.executionOrder === (task.executionOrder || 0) + 1 && !t.deleted && !t.completed);
                if (next) await updateTask(next.id, { isLocked: false });
            }
            success?.("Objective completed.");
        } catch (err) { showError?.("Finalization failed."); }
    };

    const restoreTask = async (taskId: string) => {
        if (userId) await taskService.restoreTask(userId, taskId);
    };

    const purgeTask = async (taskId: string) => {
        if (userId) await taskService.purgeTask(userId, taskId);
    };

    const startExecutionSession = async () => {
        if (!userId) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const pending = allTasks.filter(t => t.dueDate === todayStr && !t.deleted && !t.completed && !t.isRecurring);
        if (pending.length === 0) return showError?.("Nothing to execute.");
        const sorted = [...pending].sort((a,b) => (PRIORITY_SCORES[b.priority]||0)-(PRIORITY_SCORES[a.priority]||0));
        await Promise.all(sorted.map((t, i) => updateTask(t.id, { isExecutionMode: true, executionOrder: i, isLocked: i !== 0 })));
        success?.("Execution Engaged.");
    };

    const exitExecutionSession = async () => {
        if (!userId) return;
        const execs = allTasks.filter(t => !t.deleted && t.isExecutionMode && !t.completed);
        await Promise.all(execs.map(t => updateTask(t.id, { isExecutionMode: false, executionOrder: null as any, isLocked: false })));
    };

    const initializeMorningRitual = async () => {
        if (!userId) return;
        const existing = allTasks.find(t => t.title === "Morning SAVERS Ritual" && t.isRecurring && !t.deleted);
        if (existing) return;
        const steps: ProtocolStep[] = [
            { id: "1", title: "Wash & Drink Sabja Water", status: 'pending', isFlexible: false, originalOrder: 0, duration: 5, completedAt: null, deferredAt: null },
            { id: "2", title: "Brush Teeth", status: 'pending', isFlexible: true, originalOrder: 1, duration: 3, completedAt: null, deferredAt: null },
            { id: "3", title: "Exercise (Walk)", status: 'pending', isFlexible: false, originalOrder: 2, duration: 20, completedAt: null, deferredAt: null },
            { id: "4", title: "Silence (Meditate)", status: 'pending', isFlexible: false, originalOrder: 3, duration: 10, completedAt: null, deferredAt: null },
            { id: "5", title: "Read a Book", status: 'pending', isFlexible: true, originalOrder: 4, duration: 15, completedAt: null, deferredAt: null }
        ];
        await addTask({ title: "Morning SAVERS Ritual", priority: 'URGENT', category: 'Habit', dueTime: '06:00', isRecurring: true, recurrenceType: 'DAILY', isRitual: true, subtasksJson: JSON.stringify(steps), isEssential: true });
    };

    const executeProtocol = async (templateId: string, setTab: (t: string) => void) => {
        if (!userId) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const template = allTasks.find(t => t.id === templateId && !t.deleted);
        if (!template) return;
        let todaysRitual = allTasks.find(t => t.isRitual && t.dueDate === todayStr && !t.deleted && t.title === template.title);
        if (!todaysRitual) {
            const newId = await taskService.createTask(userId, { title: template.title, priority: 'URGENT', category: 'Habit', dueDate: todayStr, dueTime: '06:00', isRitual: true, subtasksJson: template.subtasksJson, isEssential: true });
            if (newId) await taskService.updateTask(userId, newId, { status: 'IN_PROGRESS', startTime: new Date().toISOString() });
        } else if (todaysRitual.status !== 'IN_PROGRESS') {
            await updateTask(todaysRitual.id, { status: 'IN_PROGRESS', startTime: new Date().toISOString() });
        }
        setTab('FOCUS');
    };

    const dynamicMetrics = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = allTasks.filter(t => t.dueDate === todayStr && !t.deleted);
        const todayRituals = todayTasks.filter(t => t.isRitual);
        const todayStaples = todayTasks.filter(t => t.isEssential && !t.isRitual);

        let primeProgress = 0;
        if (todayRituals.length > 0) {
            const totalSteps = todayRituals.reduce((acc, r) => acc + JSON.parse(r.subtasksJson || '[]').length, 0);
            const completedSteps = todayRituals.reduce((acc, r) => {
                const steps = JSON.parse(r.subtasksJson || '[]');
                return acc + steps.filter((s:any) => s.status === 'completed' || s.completed).length;
            }, 0);
            primeProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        }

        const essentialFidelity = todayStaples.length === 0 ? 0 : 
            Math.round((todayStaples.filter(t => t.completed || t.status === 'COMPLETED').length / todayStaples.length) * 100);

        const deepWorkTasks = todayTasks.filter(t => t.title.toLowerCase().includes('#deepwork') || t.notes?.toLowerCase().includes('#deepwork'));
        const totalEst = todayTasks.reduce((acc, t) => acc + (t.estimatedMins || 0), 0);
        
        return {
            primeProgress,
            essentialFidelity,
            hasDeepWorkTasks: deepWorkTasks.length > 0,
            totalEstimatedMins: totalEst,
            workloadStatus: totalEst > 420 ? 'Overloaded' : (totalEst > 300 ? 'High morning load' : 'Optimal load'),
        };
    }, [allTasks]);

    const updateSubtaskStatus = async (taskId: string, subtaskId: string, status: 'completed' | 'deferred' | 'pending') => {
        const task = allTasks.find(t => t.id === taskId);
        if (!task || !userId) return;
        const subtasks = JSON.parse(task.subtasksJson || '[]');
        const updated = subtasks.map((s:any) => s.id === subtaskId ? { ...s, status, completed: status === 'completed', completedAt: status === 'completed' ? new Date().toISOString() : null } : s);
        await updateTask(taskId, { subtasksJson: JSON.stringify(updated) });
    };

    const value = {
        tasks: allTasks.filter(t => !t.isRecurring && !t.isRitual && !t.isEssential),
        rituals: allTasks.filter(t => t.isRitual && !t.isRecurring),
        staples: allTasks.filter(t => t.isEssential && !t.isRitual && !t.isRecurring),
        templates: allTasks.filter(t => t.isRecurring),
        allData: allTasks,
        loading,
        dailyMetrics: dynamicMetrics,
        addTask,
        updateTask,
        deleteTask,
        startTask,
        pauseTask,
        stopTask,
        restoreTask,
        purgeTask,
        startExecutionSession,
        exitExecutionSession,
        initializeMorningRitual,
        executeProtocol,
        updateSubtaskStatus
    };

    return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) throw new Error("useTaskContext must be used within TaskProvider");
    return context;
};
