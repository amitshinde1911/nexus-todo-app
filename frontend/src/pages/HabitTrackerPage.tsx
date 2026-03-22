import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { clsx } from '../lib/utils';
import TaskSkeleton from '../components/TaskSkeleton';

export default function HabitTrackerPage() {
    const { user } = useAuthContext();
    const { tasks, loading, updateTask } = useTasks(user?.uid);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    
    const habits = useMemo(() => {
        let list = tasks.filter(t => t.category === 'Habit' && !t.deleted && (t.dueDate === todayStr || !t.dueDate));
        if (debouncedSearchTerm) {
            list = list.filter(h => h.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        }
        return list;
    }, [tasks, debouncedSearchTerm, todayStr]);

    const completed = habits.filter(h => h.completed).length;
    const total = habits.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    if (loading) return <TaskSkeleton />;

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Header / Greeting */}
            <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    Identity & Rituals
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-[0.2em]">
                        Current Consistency: {progress}%
                    </span>
                    <div className="h-[1px] w-8 bg-white/5" />
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em]">
                        Protocols active
                    </span>
                </div>
            </div>

            {/* Habit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.map(habit => (
                    <div 
                        key={habit.id}
                        onClick={() => updateTask(habit.id, { completed: !habit.completed })}
                        className={clsx(
                            "group relative glass-card p-8 transition-all duration-300 cursor-pointer overflow-hidden",
                            habit.completed 
                                ? "bg-[var(--accent-soft)]" 
                                : "hover:border-[var(--accent)]/30"
                        )}
                    >
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <div className={clsx(
                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                                    habit.completed 
                                        ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" 
                                        : "bg-white/5 text-[var(--text-secondary)]/40"
                                )}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6L9 17l-5-5"/></svg>
                                </div>
                                <span className={clsx(
                                    "text-[9px] font-black uppercase tracking-widest transition-colors",
                                    habit.completed ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/10"
                                )}>
                                    {habit.completed ? 'COMPLETED' : 'PENDING'}
                                </span>
                            </div>
                            
                            <div>
                                <h3 className={clsx(
                                    "font-bold text-lg tracking-tight transition-all duration-300",
                                    habit.completed ? "text-[var(--text-primary)]/30 line-through" : "text-[var(--text-primary)] group-hover:text-[var(--accent)]"
                                )}>
                                    {habit.title}
                                </h3>
                                <p className="text-[9px] font-bold text-[var(--text-secondary)]/30 uppercase tracking-[0.2em] mt-1">Daily Ritual</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State / Add Placeholder */}
                <div className="glass-card p-8 border-dashed border-white/5 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[var(--accent)]/30 transition-all">
                    <div className="w-8 h-8 rounded-xl border border-white/5 flex items-center justify-center text-[var(--text-secondary)]/20 group-hover:text-[var(--accent)] transition-colors mb-4">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--text-secondary)]/20 uppercase tracking-widest group-hover:text-[var(--text-secondary)] transition-colors">Forge New Ritual</span>
                </div>
            </div>
        </div>
    );
}
