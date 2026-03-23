import React, { useState, useRef, useEffect } from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';

const PRIORITY_THEMES: Record<string, { border: string; dot: string; text: string; bg: string }> = {
    URGENT: { border: 'border-red-500/10', dot: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/5' },
    HIGH: { border: 'border-amber-500/10', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/5' },
    MEDIUM: { border: 'border-blue-500/10', dot: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/5' },
    LOW: { border: 'border-green-500/10', dot: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-500/5' },
};

interface TodoItemProps {
    todo: Task;
    onToggle: (todo: Task) => void;
    onDelete: (id: string) => void;
    onUpdateMetadata: (id: string, updates: Record<string, any>) => void;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdateMetadata }: TodoItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(todo.title);
    const [notes, setNotes] = useState(todo.notes || '');
    const [newSubtask, setNewSubtask] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [isEditing]);

    interface Subtask {
        id: string;
        title: string;
        completed: boolean;
    }

    let subtasks: Subtask[] = [];
    try { subtasks = JSON.parse(todo.subtasksJson || '[]'); } catch (e) {}

    const theme = PRIORITY_THEMES[todo.priority] || { border: 'border-white/5', dot: 'bg-muted', text: 'text-muted-foreground', bg: 'bg-white/5' };
    const completedSubs = subtasks.filter(s => s.completed).length;

    const handleSaveEdit = () => {
        if (editValue.trim() && editValue !== todo.title) {
            onUpdateMetadata(todo.id, { title: editValue.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveEdit();
        if (e.key === 'Escape') {
            setEditValue(todo.title);
            setIsEditing(false);
        }
    };

    const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
            const target = e.target as HTMLInputElement;
            const newSub = { id: crypto.randomUUID(), title: target.value.trim(), completed: false };
            const updated = [...subtasks, newSub];
            onUpdateMetadata(todo.id, { subtasksJson: JSON.stringify(updated) });
            target.value = '';
            setNewSubtask('');
        }
    };

    const handleToggleSubtask = (subId: string) => {
        const updated = subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        onUpdateMetadata(todo.id, { subtasksJson: JSON.stringify(updated) });
    };

    const handleNotesBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (todo.notes !== e.target.value)
            onUpdateMetadata(todo.id, { notes: e.target.value });
    };

    return (
        <div
            className={clsx(
                "group relative glass-card p-5 transition-all duration-300",
                todo.completed && !expanded && "opacity-40"
            )}
        >
            <div className="flex items-center justify-between gap-5">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    {/* Apple Style Checkbox */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(todo); }}
                        className={clsx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
                            todo.completed 
                                ? "bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_12px_rgba(108,92,231,0.4)]" 
                                : "bg-transparent border-white/20 hover:border-[var(--accent)]/50"
                        )}
                    >
                        {todo.completed && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        )}
                    </button>

                    <div className="flex-1 min-w-0 py-1" onClick={() => setExpanded(!expanded)}>
                        {isEditing ? (
                            <input
                                ref={editInputRef}
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-white/[0.03] border border-white/5 outline-none text-sm font-black text-[var(--accent)] px-3 py-1 rounded-xl transition-all"
                            />
                        ) : (
                            <span 
                                onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                className={clsx(
                                    "text-sm font-bold tracking-tight transition-all duration-300 block truncate",
                                    todo.completed ? "text-[var(--text-secondary)]/30 line-through" : "text-[var(--text-primary)] group-hover:text-[var(--accent)]"
                                )}
                            >
                                {todo.title}
                            </span>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-1 h-1 rounded-full", theme.dot)} />
                                <span className={clsx("text-[9px] font-bold uppercase tracking-widest", theme.text)}>
                                    {todo.priority}
                                </span>
                            </div>
                            
                            {todo.dueTime && (
                                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)] transition-colors">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{todo.dueTime}</span>
                                </div>
                            )}
                            
                            {subtasks.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[var(--accent)] transition-all duration-500" 
                                            style={{ width: `${(completedSubs / subtasks.length) * 100}%` }} 
                                        />
                                    </div>
                                    <span className="text-[8px] font-black text-[var(--accent)]/40 uppercase tracking-widest leading-none">
                                        {completedSubs}/{subtasks.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/5",
                            expanded ? "rotate-180 text-[var(--accent)]" : "text-[var(--text-secondary)]/20"
                        )}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            <div className={clsx(
                "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
                expanded ? "max-h-[1000px] opacity-100 border-t border-white/5 bg-white/[0.01]" : "max-h-0 opacity-0"
            )}>
                <div className="p-8 space-y-10 animate-blur-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Subtasks Section */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.2em]">Checklist</h4>
                                <span className="text-[8px] font-bold text-[var(--text-secondary)]/20 uppercase tracking-widest">{completedSubs}/{subtasks.length} complete</span>
                            </div>
                            <div className="space-y-3">
                                {subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-4 group/sub animate-fade-in">
                                        <button
                                            onClick={() => handleToggleSubtask(sub.id)}
                                            className={clsx(
                                                "w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-300",
                                                sub.completed ? "bg-white/10 border-white/5" : "border-white/10 group-hover/sub:border-[var(--accent)]/50"
                                            )}
                                        >
                                            {sub.completed && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </button>
                                        <span className={clsx("text-xs font-medium transition-all duration-300", sub.completed ? "text-[var(--text-secondary)]/20 line-through" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")}>
                                            {sub.title}
                                        </span>
                                    </div>
                                ))}
                                <div className="relative pt-2">
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={e => setNewSubtask(e.target.value)}
                                        onKeyDown={handleAddSubtask}
                                        placeholder="Add to checklist..."
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] placeholder-white/10 outline-none focus:bg-white/10 transition-all"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-6">
                            <h4 className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.2em]">Context & Notes</h4>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder="Capture thoughts here..."
                                className="w-full min-h-[140px] bg-white/5 border border-white/5 rounded-2xl p-5 text-xs font-bold leading-relaxed text-[var(--text-secondary)] placeholder-white/10 outline-none focus:bg-white/10 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                        <div className="flex gap-4">
                             <button 
                                onClick={() => setIsEditing(true)}
                                className="text-[9px] font-black text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] uppercase tracking-[0.2em] transition-colors"
                            >
                                Edit Title
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <span className="text-[8px] font-bold text-[var(--text-secondary)]/10 uppercase tracking-widest">Modified recently</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl animate-fade-in">
                    <div className="p-8 text-center space-y-6 max-w-[280px] animate-scale-in">
                        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-110">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Confirm Deletion</h3>
                            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">This intention will be removed from your timeline permanently.</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 bg-white/5 text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                            >
                                Wait
                            </button>
                            <button 
                                onClick={() => { onDelete(todo.id); setShowDeleteConfirm(false); }}
                                className="btn-primary flex-1 !h-auto py-2.5 !bg-red-500 !shadow-red-500/20"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

