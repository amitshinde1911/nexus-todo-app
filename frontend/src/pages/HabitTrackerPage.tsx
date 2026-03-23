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
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
                    Habits & routine
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                        Current consistency: {progress}%
                    </span>
                    <div className="h-[1px] w-6 bg-[var(--border)]" />
                    <span className="text-xs font-semibold text-[var(--accent)]">
                        Active habits
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
                            "group relative card p-8 transition-all duration-300 cursor-pointer overflow-hidden",
                            habit.completed 
                                ? "bg-[var(--accent-soft)]" 
                                : "hover:border-[var(--accent)]"
                        )}
                    >
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <div className={clsx(
                                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                                    habit.completed 
                                        ? "bg-[var(--accent)] text-white" 
                                        : "bg-gray-100 text-[var(--text-secondary)]/40"
                                )}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                </div>
                                <span className={clsx(
                                    "text-[10px] font-semibold transition-colors",
                                    habit.completed ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/20"
                                )}>
                                    {habit.completed ? 'Completed' : 'Pending'}
                                </span>
                            </div>
                            
                            <div>
                                <h3 className={clsx(
                                    "font-semibold text-lg tracking-tight transition-all duration-300",
                                    habit.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)] group-hover:text-[var(--accent)]"
                                )}>
                                    {habit.title}
                                </h3>
                                <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-1">Daily habit</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State / Add Placeholder */}
                <div className="card p-8 border-dashed group cursor-pointer hover:border-[var(--accent)] flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)] transition-all mb-4">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)] transition-all">Add new habit</span>
                </div>
            </div>
        </div>
    );
}
