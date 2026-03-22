import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { clsx } from '../lib/utils';
import TaskSkeleton from '../components/TaskSkeleton';
import TodoItem from '../components/TodoItem';

export default function DashboardPage() {
    const { user } = useAuthContext();
    const { tasks, loading, addTask, updateTask, deleteTask } = useTasks(user?.uid);
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
            <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    Good Day, {user?.displayName?.split(' ')[0] || 'Achiever'}
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                        {formatDate(todayStr)}
                    </span>
                    <div className="h-[1px] w-8 bg-white/5" />
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em]">
                        Focused Session Active
                    </span>
                </div>
            </div>

            {/* Main Content Area: 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                
                {/* PRIMARY COLUMN: Tasks */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metric Quick-View (Horizontal Row) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card p-6 flex flex-col justify-between h-[120px]">
                             <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em]">Daily Workload</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-2xl font-black text-[var(--text-primary)]">{activeTasks.length}</span>
                                 <div className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20"/></svg>
                                 </div>
                             </div>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-between h-[120px]">
                             <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em]">Success Rate</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-2xl font-black text-[var(--text-primary)]">{progress}%</span>
                                 <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                 </div>
                             </div>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-between h-[120px]">
                             <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em]">Completed Today</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-2xl font-black text-[var(--text-primary)]">{completedToday}</span>
                                 <div className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em]">Operational Objectives</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-widest">{searchTerm ? 'Filtered Results' : 'All Data'}</span>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <TodoItem 
                                        key={task.id} 
                                        todo={task} 
                                        onToggle={(t: any) => updateTask(t.id, { completed: !t.completed })}
                                        onDelete={(id: string) => deleteTask(id)}
                                        onUpdateMetadata={(id: string, updates: any) => updateTask(id, updates)}
                                    />
                                ))
                            ) : (
                                <div className="glass-card py-24 text-center border-dashed border-white/5 group hover:border-[var(--accent)]/30 cursor-pointer">
                                    <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-6 text-[var(--text-secondary)]/20 group-hover:text-[var(--accent)] transition-colors">
                                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    </div>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Zero-Point Field Reached</p>
                                    <p className="text-[8px] text-[var(--text-secondary)]/30 uppercase tracking-[0.1em] mt-3">All sectors cleared. Standby for new objectives.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECONDARY COLUMN: Insights / Sub-panel */}
                <div className="space-y-10 lg:sticky lg:top-8">
                    <div className="flex flex-col gap-8">
                        <div>
                             <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] px-1 mb-6">Daily Briefing</h2>
                             <div className="glass-card p-10 border-[var(--accent)]/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-[var(--accent)]">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Time Budget</span>
                                            <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1 uppercase">4.5h Allocated</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-amber-500">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Priority Load</span>
                                            <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1 uppercase">High Morning Load</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-blue-500">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12H2M12 2v20M2 12l10-10 10 10M12 22l10-10-10-10"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Optimization</span>
                                            <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1 uppercase">Focus on Deep Work</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-10 pt-8 border-t border-white/5">
                                    <button className="btn-secondary w-full text-[9px] font-black tracking-[0.2em] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                                        ANALYZE FLOW
                                    </button>
                                </div>
                             </div>
                        </div>

                        <div>
                             <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] px-1 mb-6">Execution Vectors</h2>
                             <div className="space-y-4">
                                 {['Prime Morning', 'Deep Work Block', 'Recovery Buffer'].map((vector, i) => (
                                     <div key={vector} className="glass-card p-6 flex items-center justify-between border-white/[0.02]">
                                         <span className="text-[10px] font-bold text-[var(--text-primary)]">{vector}</span>
                                         <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                             <div className="h-full bg-[var(--accent)]" style={{ width: `${(3-i)*30}%` }} />
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        <div>
                             <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] px-1 mb-6">Identity Check</h2>
                             <div className="glass-card p-8 border-emerald-500/5 group">
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] leading-relaxed italic opacity-60 group-hover:opacity-100 transition-opacity">
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
