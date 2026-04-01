import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastProvider';
import { clsx } from '../lib/utils';
import { Task, Priority, Category } from '../types';

interface TodoInputProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (taskData: Partial<Task>, dueDate?: string) => Promise<void>;
    selectedDate: string;
    initialDueTime?: string;
    initialDueDate?: string;
}

export default function TodoInput({ isOpen, onClose, onAdd, selectedDate, initialDueTime, initialDueDate }: TodoInputProps) {
    const { error } = useToast();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<Category>('Personal');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [dueTime, setDueTime] = useState('');
    const [localDueDate, setLocalDueDate] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setCategory('Personal');
            setPriority('MEDIUM');
            setDueTime(initialDueTime || '');
            setLocalDueDate(initialDueDate || selectedDate || todayStr);
            setIsRecurring(false);
            setIsSubmitting(false);
        }
    }, [isOpen, initialDueTime, initialDueDate, selectedDate, todayStr]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        
        if (!trimmedTitle) {
            error("Task title cannot be empty.");
            return;
        }
        
        if (trimmedTitle.length < 3) {
            error("Task title needs to be at least 3 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onAdd({ 
                title: trimmedTitle, 
                priority, 
                category,
                dueTime: dueTime || null,
                isRecurring,
                ...(isRecurring && { recurrenceType: 'DAILY' })
            }, localDueDate);
            onClose();
        } catch (err) {
            error("Failed to add task.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const timeOptions = useMemo(() => {
        const times = [];
        for (let i = 0; i < 24; i++) {
            for (let m = 0; m < 60; m += 30) {
                const hourNum = i === 0 ? 12 : i > 12 ? i - 12 : i;
                const ampm = i < 12 ? 'AM' : 'PM';
                const mins = m === 0 ? '00' : '30';
                const label = `${hourNum.toString().padStart(2, '0')}:${mins} ${ampm}`;
                const value = `${i.toString().padStart(2, '0')}:${mins}`;
                times.push({ label, value });
            }
        }
        return times;
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500 animate-fade-in"
            />
            
            {/* Centered Modal */}
            <form 
                onSubmit={handleSubmit}
                className="relative card w-[calc(100%-2rem)] md:w-full max-w-[440px] p-6 text-left md:p-8 shadow-2xl mx-auto"
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                            Create new task
                        </h2>
                        <span className="text-xs text-[var(--text-secondary)] mt-1">
                            Plan your execution
                        </span>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Title Input */}
                <div className="mb-8">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="What needs to be done?"
                        autoFocus
                        className="w-full bg-transparent border-none text-xl font-medium text-[var(--text-primary)] placeholder-[var(--text-secondary)]/20 outline-none p-0"
                    />
                    <div className="h-[1px] w-full bg-[var(--border)] mt-4" />
                </div>

                {/* Date Selection Grid */}
                <div className="mb-10">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-4 pl-1">When should this be done?</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setLocalDueDate(todayStr)}
                            className={clsx(
                                "h-11 rounded-xl border px-4 flex items-center gap-3 transition-all",
                                localDueDate === todayStr 
                                    ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20" 
                                    : "bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                            )}
                        >
                            <span className="text-sm font-semibold">Today</span>
                            <span className={clsx("text-[10px] ml-auto", localDueDate === todayStr ? "text-white/60" : "text-[var(--text-secondary)]")}>
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocalDueDate(tomorrowStr)}
                            className={clsx(
                                "h-11 rounded-xl border px-4 flex items-center gap-3 transition-all",
                                localDueDate === tomorrowStr 
                                    ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20" 
                                    : "bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                            )}
                        >
                            <span className="text-sm font-semibold">Tomorrow</span>
                            <span className={clsx("text-[10px] ml-auto", localDueDate === tomorrowStr ? "text-white/60" : "text-[var(--text-secondary)]")}>
                                {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="date"
                            value={localDueDate}
                            onChange={(e) => setLocalDueDate(e.target.value)}
                            className="w-full h-11 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl px-4 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)] transition-all cursor-pointer"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </div>
                    </div>
                </div>

                {/* Grid Metadata Controls */}
                <div className="grid grid-cols-2 gap-6 mb-10">
                    {/* Priority */}
                    <div className="group">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 pl-1">Priority</label>
                        <div className="relative">
                            <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                                className="w-full h-10 pl-3 pr-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--text-primary)] appearance-none focus:border-[var(--accent)] outline-none transition-all cursor-pointer"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="URGENT">High</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>

                    {/* Time Dropdown */}
                    <div className="group">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 pl-1">Due time</label>
                        <div className="relative">
                            <select 
                                value={dueTime} 
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full h-10 pl-3 pr-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--text-primary)] appearance-none focus:border-[var(--accent)] outline-none transition-all cursor-pointer"
                            >
                                <option value="">Not set</option>
                                {timeOptions.map((t: any) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/40">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recurrence Toggle */}
                <div className="mb-10 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Repeat daily</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">Create a new task instance every day</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                    </label>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="btn-secondary px-6"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={!title.trim() || isSubmitting}
                        className="btn-primary px-8"
                    >
                        {isSubmitting ? 'Saving...' : 'Create task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
