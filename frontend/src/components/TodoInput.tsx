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
    initialIsEssential?: boolean;
}

type InputMode = 'OBJECTIVE' | 'STAPLE' | 'PROTOCOL';

export default function TodoInput({ 
    isOpen, onClose, onAdd, selectedDate, initialDueTime, initialDueDate, initialIsEssential = false 
}: TodoInputProps) {
    const { error } = useToast();
    const [mode, setMode] = useState<InputMode>('OBJECTIVE');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<Category>('Personal');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [dueTime, setDueTime] = useState('');
    const [localDueDate, setLocalDueDate] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isEssential, setIsEssential] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setPriority('MEDIUM');
            setDueTime(initialDueTime || '');
            setLocalDueDate(initialDueDate || selectedDate || todayStr);
            setIsSubmitting(false);

            if (initialIsEssential) {
                setMode('STAPLE');
                setCategory('Habit');
                setIsRecurring(true);
                setIsEssential(true);
            } else {
                setMode('OBJECTIVE');
                setCategory('Personal');
                setIsRecurring(false);
                setIsEssential(false);
            }
        }
    }, [isOpen, initialDueTime, initialDueDate, selectedDate, todayStr, initialIsEssential]);

    // Handle Mode Change
    const handleModeChange = (newMode: InputMode) => {
        setMode(newMode);
        if (newMode === 'STAPLE') {
            setCategory('Habit');
            setIsRecurring(true);
            setIsEssential(true);
            setPriority('LOW');
        } else if (newMode === 'PROTOCOL') {
            setCategory('Habit');
            setIsRecurring(true);
            setIsEssential(true);
            setPriority('URGENT');
        } else {
            setCategory('Personal');
            setIsRecurring(false);
            setIsEssential(false);
            setPriority('MEDIUM');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        
        if (!trimmedTitle) {
            error("Title cannot be empty.");
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
                isEssential,
                isRitual: mode === 'PROTOCOL',
                ...(isRecurring && { recurrenceType: 'DAILY' })
            }, localDueDate);
            onClose();
        } catch (err) {
            error("Failed to deploy objective.");
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
                className="relative bg-[var(--bg-main)] border border-[var(--border)] rounded-[var(--radius)] w-[calc(100%-2rem)] md:w-full max-w-[440px] p-6 text-left md:p-8 shadow-sm animate-slide-up mx-auto h-[600px] overflow-y-auto custom-scrollbar"
            >
                {/* MODE SELECTOR */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8">
                    {(['OBJECTIVE', 'STAPLE', 'PROTOCOL'] as InputMode[]).map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => handleModeChange(m)}
                            className={clsx(
                                "flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === m 
                                    ? "bg-white dark:bg-gray-700 text-[var(--text-primary)] shadow-sm" 
                                    : "text-[var(--text-secondary)] opacity-40 hover:opacity-100"
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                            {mode === 'OBJECTIVE' ? 'New Mission Objective' : mode === 'STAPLE' ? 'Define Life Staple' : 'Register Protocol'}
                        </h2>
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] mt-0.5">
                            {mode === 'OBJECTIVE' ? 'Timed execution for project goals' : mode === 'STAPLE' ? 'Daily maintenance habit tracking' : 'Structured sequence for rituals'}
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
                <div className="mb-6">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder={mode === 'STAPLE' ? "e.g. Wake up, Hydrate" : "Objective name"}
                        autoFocus
                        className="w-full bg-transparent border-none text-xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-secondary)]/15 outline-none p-0"
                    />
                    <div className="h-[1px] w-full bg-[var(--border)] mt-4" />
                </div>

                {/* OBJECTIVE SPECIFIC: Date & Priority */}
                {mode === 'OBJECTIVE' && (
                    <>
                        <div className="mb-8">
                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Timing</label>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setLocalDueDate(todayStr)}
                                    className={clsx(
                                        "h-9 rounded-md border px-3 flex items-center justify-between transition-all",
                                        localDueDate === todayStr 
                                            ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-main)]" 
                                            : "bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--hover)]"
                                    )}
                                >
                                    <span className="text-xs font-semibold">Today</span>
                                    <span className={clsx("text-[10px]", localDueDate === todayStr ? "opacity-60" : "text-[var(--text-secondary)]")}>
                                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocalDueDate(tomorrowStr)}
                                    className={clsx(
                                        "h-9 rounded-md border px-3 flex items-center justify-between transition-all",
                                        localDueDate === tomorrowStr 
                                            ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-main)]" 
                                            : "bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--hover)]"
                                    )}
                                >
                                    <span className="text-xs font-semibold">Tomorrow</span>
                                    <span className={clsx("text-[10px]", localDueDate === tomorrowStr ? "opacity-60" : "text-[var(--text-secondary)]")}>
                                        {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="group">
                                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Priority</label>
                                <select 
                                    value={priority} 
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full h-9 px-3 bg-transparent border border-[var(--border)] rounded-md text-xs font-semibold text-[var(--text-primary)] outline-none focus:bg-[var(--hover)] transition-all cursor-pointer"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="URGENT">High</option>
                                </select>
                            </div>

                            <div className="group">
                                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Target Time</label>
                                <select 
                                    value={dueTime} 
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full h-9 px-3 bg-transparent border border-[var(--border)] rounded-md text-xs font-semibold text-[var(--text-primary)] outline-none focus:bg-[var(--hover)] transition-all cursor-pointer"
                                >
                                    <option value="">Not set</option>
                                    {timeOptions.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {/* STAPLE / PROTOCOL SPECIFIC: Time & Recurrence */}
                {mode !== 'OBJECTIVE' && (
                    <div className="space-y-6 mb-8">
                        <div className="group">
                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Execution Time</label>
                            <select 
                                value={dueTime} 
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full h-11 px-4 bg-[var(--hover)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition-all cursor-pointer"
                            >
                                <option value="">Not set (Flexible)</option>
                                {timeOptions.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-2 italic">Captured as the baseline for your Behavioral Audit.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-700 uppercase tracking-tight">Active Discipline</p>
                                    <p className="text-[10px] text-emerald-600/70 font-medium">Daily recurrence & Fidelity tracking enabled.</p>
                                </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 mt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="btn-ghost px-4"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={!title.trim() || isSubmitting}
                        className="btn-primary px-6"
                    >
                        {isSubmitting ? 'Saving...' : 'Create objctive'}
                    </button>
                </div>
            </form>
        </div>
    );
}
