import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { clsx } from '../lib/utils';
import TaskSkeleton from '../components/TaskSkeleton';
import TodoItem from '../components/TodoItem';
import DigitalClock from '../components/DigitalClock';

export default function DashboardPage() {
    const { user } = useAuthContext();
    const { tasks, loading, addTask, updateTask, deleteTask, startTask, pauseTask, stopTask } = useTasks(user?.uid);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const activeTasks = useMemo(() => {
        let list = tasks.filter(t => t.dueDate === todayStr && !t.deleted);
        if (debouncedSearchTerm) {
            list = list.filter(t => t.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        }
        if (priorityFilter !== 'ALL') {
            list = list.filter(t => t.priority === priorityFilter);
        }
        return list;
    }, [tasks, debouncedSearchTerm, priorityFilter, todayStr]);

    const progress = useMemo(() => {
        if (activeTasks.length === 0) return 0;
        const comp = activeTasks.filter(t => t.completed).length;
        return Math.round((comp / activeTasks.length) * 100);
    }, [activeTasks]);

    if (loading) return <TaskSkeleton />;

    const completedToday = activeTasks.filter(t => t.completed).length;

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Header / Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                        Good morning, {user?.displayName ? user.displayName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'User')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-secondary)]">
                            {formatDate(todayStr)}
                        </span>
                        <div className="h-3 w-[1px] bg-[var(--border)]" />
                        {activeTasks.some(t => t.status === 'IN_PROGRESS') ? (
                            <span className="text-xs text-[var(--accent)] font-medium animate-pulse">
                                Execution in progress: {activeTasks.find(t => t.status === 'IN_PROGRESS')?.title}
                            </span>
                        ) : (
                            <span className="text-xs text-[var(--text-secondary)] font-medium">
                                System ready for next objective
                            </span>
                        )}
                    </div>
                </div>

                <DigitalClock />
            </div>

            {/* Main Content Area: 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                
                {/* PRIMARY COLUMN: Tasks */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metric Quick-View (Horizontal Row) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="card p-4 flex flex-col justify-between h-[100px]">
                             <span className="text-[11px] font-medium text-[var(--text-secondary)]">Today's total</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-xl font-semibold text-[var(--text-primary)]">{activeTasks.length}</span>
                                 <div className="w-6 h-6 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                                 </div>
                             </div>
                        </div>
                        <div className="card p-4 flex flex-col justify-between h-[100px]">
                             <span className="text-[11px] font-medium text-[var(--text-secondary)]">Completion rate</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-xl font-semibold text-[var(--text-primary)]">{progress}%</span>
                                 <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                 </div>
                             </div>
                        </div>
                        <div className="card p-4 flex flex-col justify-between h-[100px]">
                             <span className="text-[11px] font-medium text-[var(--text-secondary)]">Completed tasks</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-xl font-semibold text-[var(--text-primary)]">{completedToday}</span>
                                 <div className="w-6 h-6 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                            <h2 className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                                <span className="w-1 h-3 bg-[var(--accent)] rounded-full" />
                                Personal tasks
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white border border-[var(--border)] rounded-md px-3 py-1.5 text-xs w-40 focus:w-56 focus:border-[var(--accent)] transition-all outline-none placeholder:text-[var(--text-secondary)]/40"
                                    />
                                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                                <select 
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="bg-white border border-[var(--border)] rounded-md px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)] transition-all cursor-pointer text-[var(--text-secondary)]"
                                >
                                    <option value="ALL">All priorities</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="card divide-y divide-[var(--border)] overflow-hidden">
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <div key={task.id} className="first:border-t-0">
                                        <TodoItem 
                                            todo={task} 
                                            onToggle={(t: any) => updateTask(t.id, { completed: !t.completed })}
                                            onDelete={(id: string) => deleteTask(id)}
                                            onUpdateMetadata={(id: string, updates: any) => updateTask(id, updates)}
                                            onStartTask={startTask}
                                            onPauseTask={pauseTask}
                                            onStopTask={stopTask}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center group">
                                    <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]/30">
                                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">All caught up!</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">You have no tasks for today. Great job!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECONDARY COLUMN: Insights / Sub-panel */}
                <div className="space-y-8 lg:sticky lg:top-8">
                    <div className="flex flex-col gap-6">
                        <div>
                             <h2 className="text-xs font-semibold text-[var(--text-secondary)] px-1 mb-4">Daily overview</h2>
                             <div className="card p-6 border-[var(--border)] overflow-hidden">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--text-secondary)]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)]">Estimated time</span>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">4.5h allocated</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--text-secondary)]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)]">Workload</span>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">High morning load</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--text-secondary)]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12H2M12 2v20M2 12l10-10 10 10M12 22l10-10-10-10"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)]">Focus strategy</span>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Focus on deep work</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-[var(--border)]">
                                    <button className="btn-secondary w-full text-xs">
                                        View trends
                                    </button>
                                </div>
                             </div>
                        </div>

                        <div>
                             <h2 className="text-xs font-semibold text-[var(--text-secondary)] px-1 mb-4">Goal progress</h2>
                             <div className="space-y-2">
                                 {['Prime Morning', 'Deep Work Block', 'Recovery Buffer'].map((vector, i) => (
                                     <div key={vector} className="card p-4 flex items-center justify-between">
                                         <span className="text-xs font-medium text-[var(--text-primary)]">{vector}</span>
                                         <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-[var(--accent)]" style={{ width: `${(3-i)*30}%` }} />
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        <div>
                             <h2 className="text-xs font-semibold text-[var(--text-secondary)] px-1 mb-4">Daily quote</h2>
                             <div className="card p-6 border-transparent bg-gray-50">
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                                    "Consistency is the only protocol that matters."
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
