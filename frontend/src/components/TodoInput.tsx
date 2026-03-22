import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastProvider';
import { clsx } from '../lib/utils';
import { Task, Priority, Category } from '../types';

interface TodoInputProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (taskData: Partial<Task>, dueDate?: string) => Promise<void>;
    selectedDate: string;
}

export default function TodoInput({ isOpen, onClose, onAdd, selectedDate }: TodoInputProps) {
    const { error } = useToast();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<Category>('Personal');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [dueTime, setDueTime] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setCategory('Personal');
            setPriority('MEDIUM');
            setDueTime('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

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
                dueTime: dueTime || null
            }, selectedDate);
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
                const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                const ampm = i < 12 ? 'AM' : 'PM';
                const mins = m === 0 ? '00' : '30';
                const label = `${hour.toString().padStart(2, '0')}:${mins} ${ampm}`;
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
                className="relative glass-card w-full max-w-[440px] p-10 animate-scale-in"
            >
                <div className="flex justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                            Create New Task
                        </h2>
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] mt-1">
                            Add intention to your day
                        </span>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Title Input */}
                <div className="mb-10">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="I will focus on..."
                        autoFocus
                        className="w-full bg-transparent border-none text-xl font-bold text-[var(--text-primary)] placeholder-white/10 outline-none p-0 transition-opacity"
                    />
                    <div className="h-[1px] w-full bg-white/5 mt-4" />
                </div>

                {/* Grid Metadata Controls */}
                <div className="grid grid-cols-2 gap-6 mb-12">
                    {/* Priority */}
                    <div className="group">
                        <label className="block text-[10px] font-black text-[var(--text-secondary)]/30 mb-3 uppercase tracking-[0.2em] pl-1">Priority</label>
                        <div className="relative">
                            <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full h-11 pl-4 pr-10 bg-white/[0.03] border border-white/5 rounded-2xl text-[12px] font-bold text-[var(--text-primary)] appearance-none focus:border-[var(--accent)]/30 outline-none transition-all cursor-pointer"
                            >
                                <option value="LOW" className="bg-[#0B0B0F]">LOW (RECOVERY)</option>
                                <option value="MEDIUM" className="bg-[#0B0B0F]">NORMAL (FOCUS)</option>
                                <option value="URGENT" className="bg-[#0B0B0F]">URGENT (CRITICAL)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/20">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>

                    {/* Time Dropdown */}
                    <div className="group">
                        <label className="block text-[10px] font-black text-[var(--text-secondary)]/30 mb-3 uppercase tracking-[0.2em] pl-1">Intention Time</label>
                        <div className="relative">
                            <select 
                                value={dueTime} 
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full h-11 pl-4 pr-10 bg-white/[0.03] border border-white/5 rounded-2xl text-[12px] font-bold text-[var(--text-primary)] appearance-none focus:border-[var(--accent)]/30 outline-none transition-all cursor-pointer"
                            >
                                <option value="" className="bg-[#0B0B0F]">NOT SET</option>
                                {timeOptions.map((t: any) => (
                                    <option key={t.value} value={t.value} className="bg-[#0B0B0F]">
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]/20">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="btn-secondary h-12 px-8 rounded-2xl"
                    >
                        Back
                    </button>
                    <button 
                        type="submit" 
                        disabled={!title.trim() || isSubmitting}
                        className="btn-primary h-12 px-10 rounded-2xl disabled:opacity-30 disabled:grayscale"
                    >
                        {isSubmitting ? 'SENDING...' : 'CONFIRM'}
                    </button>
                </div>
            </form>
        </div>
    );
}
