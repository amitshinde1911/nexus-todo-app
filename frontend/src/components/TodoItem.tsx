import React, { useState, useRef, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { clsx } from '../lib/utils';
import { Task } from '../types';

const PRIORITY_THEMES: Record<string, { dot: string; text: string; bg: string }> = {
    URGENT: { dot: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50' },
    HIGH: { dot: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50' },
    MEDIUM: { dot: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50' },
    LOW: { dot: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-50' },
};

interface TodoItemProps {
    todo: Task;
    onToggle: (todo: Task) => void;
    onDelete: (id: string) => void;
    onUpdateMetadata: (id: string, updates: Record<string, any>) => void;
    onStartTask?: (id: string) => void;
    onPauseTask?: (id: string) => void;
    onStopTask?: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdateMetadata, onStartTask, onPauseTask, onStopTask }: TodoItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(todo.title);
    const [notes, setNotes] = useState(todo.notes || '');
    const [newSubtask, setNewSubtask] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const editInputRef = useRef<HTMLInputElement>(null);

    const { secondsElapsed } = useTimer(todo.status === 'IN_PROGRESS' ? todo : null);
    const liveMins = Math.floor(secondsElapsed / 60);
    const displayedMins = (todo.actualMins || 0) + liveMins;

    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [isEditing]);

    interface Subtask {
        id: string;
        title: string;
        completed: boolean;
        duration?: number;
    }

    let subtasks: Subtask[] = [];
    try { subtasks = JSON.parse(todo.subtasksJson || '[]'); } catch (e) {}

    const theme = PRIORITY_THEMES[todo.priority] || { border: 'border-white/5', dot: 'bg-muted', text: 'text-muted-foreground', bg: 'bg-[var(--card-bg)]/5' };
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

    const handleDeleteSubtask = (subId: string) => {
        const updated = subtasks.filter(s => s.id !== subId);
        onUpdateMetadata(todo.id, { subtasksJson: JSON.stringify(updated) });
    };

    const handleEditSubtask = (subId: string, newTitle: string) => {
        const updated = subtasks.map(s => s.id === subId ? { ...s, title: newTitle } : s);
        onUpdateMetadata(todo.id, { subtasksJson: JSON.stringify(updated) });
    };

    const handleNotesBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (todo.notes !== e.target.value)
            onUpdateMetadata(todo.id, { notes: e.target.value });
    };

    return (
        <div
            title={todo.isLocked ? "Locked - Complete active task first" : undefined}
            className={clsx(
                "group relative px-4 py-3 transition-all",
                !todo.isLocked && "hover:bg-[var(--hover)]",
                todo.completed && !expanded && "opacity-60",
                todo.isLocked && "opacity-40 grayscale select-none cursor-not-allowed",
                todo.isExecutionMode && !todo.isLocked && !todo.completed && "bg-emerald-50/30 shadow-[inset_3px_0_0_0_#10b981]"
            )}
            onClickCapture={(e) => {
                if (todo.isLocked) { e.stopPropagation(); e.preventDefault(); }
            }}
        >
            <div className="flex items-center gap-4">
                {/* Minimalist Checkbox */}
                <button
                    disabled={todo.isLocked}
                    onClick={(e) => { e.stopPropagation(); if(!todo.isLocked) onToggle(todo); }}
                    className={clsx(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                        todo.completed 
                            ? "bg-[var(--accent)] border-[var(--accent)]" 
                            : "bg-transparent border-[var(--border)] hover:border-[var(--accent)]"
                    )}
                >
                    {todo.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </button>

                    <div className={clsx("flex-1 min-w-0", !todo.isLocked && "cursor-pointer")} onClick={() => { if(!todo.isLocked) setExpanded(!expanded) }}>
                        {isEditing ? (
                            <input
                                ref={editInputRef}
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-[var(--card-bg)] border border-[var(--accent)] outline-none text-sm font-medium text-[var(--text-primary)] px-2 py-0.5 rounded transition-all"
                            />
                        ) : (
                            <span 
                                onDoubleClick={(e) => { e.stopPropagation(); if(!todo.isLocked) setIsEditing(true); }}
                                className={clsx(
                                    "text-sm font-medium transition-all block truncate",
                                    todo.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                                )}
                            >
                                {todo.title}
                            </span>
                        )}

                        {/* Progress Bar (if estimated) */}
                        {todo.estimatedMins && todo.estimatedMins > 0 && (
                            <div className="mt-1 w-full max-w-[200px]">
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={clsx(
                                            "h-full transition-all duration-500",
                                            displayedMins >= todo.estimatedMins ? "bg-red-500" : "bg-blue-500"
                                        )}
                                        style={{ width: `${Math.min(100, (displayedMins / todo.estimatedMins) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-0.5">
                                    <span className={clsx(
                                        "text-[9px] font-medium",
                                        displayedMins >= todo.estimatedMins ? "text-red-500" : "text-blue-500"
                                    )}>
                                        {displayedMins}/{todo.estimatedMins}m
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-1.5 h-1.5 rounded-full", theme.dot)} />
                                <span className={clsx("text-[10px] font-medium", theme.text)}>
                                    {todo.priority.toLowerCase()}
                                </span>
                            </div>
                            
                            {todo.dueTime && (
                                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span className="text-[10px]">{todo.dueTime}</span>
                                </div>
                            )}
                            
                            {subtasks.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[var(--accent)] transition-all" 
                                            style={{ width: `${(completedSubs / subtasks.length) * 100}%` }} 
                                        />
                                    </div>
                                    <span className="text-[10px] text-[var(--accent)]">
                                        {completedSubs}/{subtasks.length}
                                    </span>
                                </div>
                            )}

                            {todo.actualMins > 0 && todo.status !== 'IN_PROGRESS' && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-semibold text-[var(--text-secondary)]">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                                    {todo.actualMins}m logged
                                </div>
                            )}

                            {todo.status === 'IN_PROGRESS' && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-50 rounded text-[10px] font-semibold text-blue-600 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {displayedMins}m tracking
                                </div>
                            )}

                            {todo.status === 'PAUSED' && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-amber-50 rounded text-[10px] font-semibold text-amber-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {todo.actualMins}m paused
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={clsx("flex items-center gap-2 shrink-0 transition-opacity", todo.isLocked ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100")}>
                        {/* Start/Pause/Stop Buttons */}
                        <div className="flex items-center gap-1">
                            {todo.status === 'IN_PROGRESS' ? (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onPauseTask?.(todo.id); }}
                                        className="w-7 h-7 rounded flex items-center justify-center bg-amber-50 text-amber-500 transition-all hover:bg-amber-100"
                                        title="Pause tracking"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onStopTask?.(todo.id); }}
                                        className="w-7 h-7 rounded flex items-center justify-center bg-emerald-50 text-emerald-500 transition-all hover:bg-emerald-100"
                                        title="Complete task"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                </>
                            ) : (
                                !todo.completed && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onStartTask?.(todo.id); }}
                                        className={clsx(
                                            "w-7 h-7 rounded flex items-center justify-center transition-all",
                                            todo.status === 'PAUSED' ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--accent)]"
                                        )}
                                        title={todo.status === 'PAUSED' ? "Resume tracking" : "Start tracking"}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M5 3l14 9-14 9V3z"/></svg>
                                    </button>
                                )
                            )}
                        </div>
                        
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className={clsx(
                                "w-7 h-7 rounded flex items-center justify-center transition-all",
                                expanded ? "text-[var(--accent)] bg-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:bg-gray-100"
                            )}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                </div>

            {/* Expanded Content */}
            <div className={clsx(
                "overflow-hidden transition-all duration-200",
                expanded ? "max-h-[800px] opacity-100 bg-gray-50/50" : "max-h-0 opacity-0"
            )}>
                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Subtasks Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[11px] font-semibold text-[var(--text-secondary)]">Subtasks</h4>
                                <span className="text-[10px] text-[var(--text-secondary)]/60">{completedSubs}/{subtasks.length} complete</span>
                            </div>
                            <div className="space-y-2">
                                {subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 group/sub w-full">
                                        <button
                                            onClick={() => handleToggleSubtask(sub.id)}
                                            className={clsx(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                                sub.completed ? "bg-emerald-500 border-emerald-500" : "bg-[var(--card-bg)] border-[var(--border)] group-hover/sub:border-[var(--accent)]"
                                            )}
                                        >
                                            {sub.completed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </button>
                                        <input 
                                            type="text"
                                            value={sub.title}
                                            onChange={(e) => handleEditSubtask(sub.id, e.target.value)}
                                            className={clsx(
                                                "w-full text-xs transition-all bg-transparent outline-none py-1 border-b border-transparent focus:border-[var(--border)]", 
                                                sub.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                                            )}
                                        />
                                        <button 
                                            onClick={() => handleDeleteSubtask(sub.id)}
                                            className="text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity p-1 flex-shrink-0"
                                            title="Delete subtask"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <div className="pt-1">
                                    <div className="relative flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newSubtask}
                                            onChange={e => setNewSubtask(e.target.value)}
                                            onKeyDown={handleAddSubtask}
                                            placeholder="Add a subtask... (Press Enter)"
                                            className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 outline-none focus:border-[var(--accent)] transition-all"
                                        />
                                        <button 
                                            onClick={() => {
                                                if(newSubtask.trim()) {
                                                    const newSub = { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false };
                                                    const updated = [...subtasks, newSub];
                                                    onUpdateMetadata(todo.id, { subtasksJson: JSON.stringify(updated) });
                                                    setNewSubtask('');
                                                }
                                            }}
                                            className="bg-[var(--accent)] text-white p-1.5 rounded flex items-center justify-center flex-shrink-0 hover:bg-red-700 transition-colors"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-semibold text-[var(--text-secondary)]">Notes</h4>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder="Thoughts, details, or contexts..."
                                className="w-full min-h-[120px] bg-[var(--card-bg)] border border-[var(--border)] rounded-md p-3 text-xs leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 outline-none focus:border-[var(--accent)] transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                        <div className="flex gap-4">
                             <button 
                                onClick={() => setIsEditing(true)}
                                className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                            >
                                Edit title
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-[11px] font-medium text-red-500/60 hover:text-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] text-[var(--text-secondary)]/40">Synced with cloud</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--card-bg)]/60 backdrop-blur-sm">
                    <div className="bg-[var(--card-bg)] card p-6 text-center space-y-4 max-w-[260px] shadow-xl">
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Delete item?</h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">This will permanently remove the task. This action cannot be undone.</p>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-3 py-1.5 bg-gray-100 text-[var(--text-primary)] text-xs font-medium rounded-md hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { onDelete(todo.id); setShowDeleteConfirm(false); }}
                                className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
