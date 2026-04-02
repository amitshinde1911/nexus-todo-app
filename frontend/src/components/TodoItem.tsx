import React, { useState, useRef, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { clsx } from '../lib/utils';
import { Task } from '../types';

const PRIORITY_THEMES: Record<string, string> = {
    URGENT: 'tag-urgent',
    HIGH: 'tag-orange',
    MEDIUM: 'tag-blue',
    LOW: 'tag-green',
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
    const isStaple = todo.isEssential && !todo.isRitual;
    const isProtocol = todo.isRitual;
    const isObjective = !todo.isEssential && !todo.isRitual;

    const completionTime = todo.completedAt ? new Date(todo.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

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

    const theme = PRIORITY_THEMES[todo.priority] || 'tag-gray';
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
                "group relative px-4 py-3 transition-all border-b border-[var(--border)]",
                !todo.isLocked && "hover:bg-[var(--hover)]",
                todo.completed && !expanded && "opacity-50",
                todo.isLocked && "opacity-40 grayscale select-none cursor-not-allowed",
                todo.isExecutionMode && !todo.isLocked && !todo.completed && "bg-[var(--accent-soft)]",
                isStaple && "border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/5",
                isProtocol && "border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-500/5"
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
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 shadow-sm",
                        todo.completed 
                            ? (isStaple ? "bg-emerald-500 border-emerald-500" : isProtocol ? "bg-indigo-500 border-indigo-500" : "bg-[var(--accent)] border-[var(--accent)]")
                            : "bg-transparent border-[var(--border)] hover:border-[var(--accent)]"
                    )}
                >
                    {todo.completed && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
                                className="w-full bg-[var(--card-bg)] border border-[var(--accent)] outline-none text-sm font-black text-[var(--text-primary)] px-2 py-0.5 rounded transition-all"
                            />
                        ) : (
                            <div className="flex flex-col">
                                <span 
                                    onDoubleClick={(e) => { e.stopPropagation(); if(!todo.isLocked) setIsEditing(true); }}
                                    className={clsx(
                                        "text-sm font-black transition-all block truncate",
                                        todo.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                                    )}
                                >
                                    {todo.title}
                                </span>
                                {isStaple && todo.completed && (
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mt-0.5">
                                        Log: {completionTime}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3 mt-1.5">
                            {isStaple && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100/50 flex items-center gap-1">
                                     <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                     Behavioral OS Staple
                                </span>
                            )}

                            {isProtocol && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-100/50 flex items-center gap-1">
                                     Protocol alpha
                                </span>
                            )}
                            
                            {!isStaple && !isProtocol && (
                                 <span className={clsx("tag capitalize", todo.priority === 'URGENT' ? 'tag-urgent uppercase' : theme)}>
                                    {todo.priority === 'URGENT' ? 'Objective' : todo.priority.toLowerCase()}
                                </span>
                            )}
                            
                            {todo.dueTime && (
                                <div className={clsx("flex items-center gap-1 font-bold", isStaple ? "text-emerald-500/60" : "text-[var(--accent)]")}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span className="text-[10px] uppercase tracking-tighter">{isStaple ? 'Schedule' : 'Due'}, {todo.dueTime}</span>
                                </div>
                            )}
                            
                            {/* TIMER UI for Objectives/Protocols */}
                            {!isStaple && todo.status === 'IN_PROGRESS' && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-50 rounded text-[10px] font-black text-blue-600 animate-pulse uppercase tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {displayedMins}m Focused
                                </div>
                            )}

                            {!isStaple && todo.status === 'PAUSED' && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-amber-50 rounded text-[10px] font-black text-amber-600 uppercase tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {todo.actualMins}m paused
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={clsx("flex items-center gap-1 shrink-0 transition-opacity", todo.isLocked ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100")}>
                        {/* Start/Pause/Stop Buttons - HIDDEN for Essentials */}
                        <div className="flex items-center mr-1">
                            {!isStaple && (
                                todo.status === 'IN_PROGRESS' ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPauseTask?.(todo.id); }}
                                            className="btn-icon text-amber-500 hover:bg-amber-50"
                                            title="Pause"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onStopTask?.(todo.id); }}
                                            className="btn-icon text-emerald-500 hover:bg-emerald-50"
                                            title="Done"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </button>
                                    </>
                                ) : (
                                    !todo.completed && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onStartTask?.(todo.id); }}
                                            className="btn-icon hover:text-[var(--accent)]"
                                            title="Focus"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                        </button>
                                    )
                                )
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                className="btn-icon hover:text-red-500"
                                title="Delete"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                        
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            className={clsx(
                                "w-6 h-6 rounded flex items-center justify-center transition-all",
                                expanded ? "text-[var(--accent)] bg-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:bg-[var(--hover)]"
                            )}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={clsx("transition-transform", expanded && "rotate-180")}><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                </div>

            {/* Expanded Content: Notion Style Progressive Disclosure */}
            <div className={clsx(
                "overflow-hidden transition-all duration-200",
                expanded ? "max-h-[800px] opacity-100 bg-[var(--bg-sidebar)]" : "max-h-0 opacity-0"
            )}>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Subtasks Section */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Subtasks</h4>
                            <div className="space-y-1">
                                {subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 group/sub w-full py-1">
                                        <button
                                            onClick={() => handleToggleSubtask(sub.id)}
                                            className={clsx(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                                sub.completed ? "bg-emerald-500 border-emerald-500" : "bg-transparent border-[var(--border)]"
                                            )}
                                        >
                                            {sub.completed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </button>
                                        <input 
                                            type="text"
                                            value={sub.title}
                                            onChange={(e) => handleEditSubtask(sub.id, e.target.value)}
                                            className={clsx(
                                                "flex-1 text-xs transition-all bg-transparent outline-none py-0.5", 
                                                sub.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                                            )}
                                        />
                                        <button 
                                            onClick={() => handleDeleteSubtask(sub.id)}
                                            className="btn-icon w-6 h-6 opacity-0 group-hover/sub:opacity-100"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 group/add text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        <input
                                            type="text"
                                            value={newSubtask}
                                            onChange={e => setNewSubtask(e.target.value)}
                                            onKeyDown={handleAddSubtask}
                                            placeholder="Add subtask"
                                            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-inherit"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Notes</h4>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder="Empty"
                                className="w-full min-h-[100px] bg-transparent border-none p-0 text-xs leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 outline-none resize-none"
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
