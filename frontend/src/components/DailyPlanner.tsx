import React from 'react';
import { clsx } from '../lib/utils';

interface DailyPlannerProps {
    todos: any[];
    selectedDate: string;
    onUpdateMetadata: (id: string, updates: Record<string, any>) => void;
    onStartTask?: (id: string) => void;
    onPauseTask?: (id: string) => void;
    onStopTask?: (id: string) => void;
    onCreateInSlot?: (date: string, time: string) => void;
}

export default function DailyPlanner({ todos, selectedDate, onUpdateMetadata, onStartTask, onPauseTask, onStopTask, onCreateInSlot }: DailyPlannerProps) {
    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 to 20:00
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    const formatTimeWithFallback = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    const todayTodos = todos.filter(t => t.dueDate === selectedDate && !t.deleted);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, todoId: string) => {
        e.dataTransfer.setData('todoId', todoId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, hour: number) => {
        e.preventDefault();
        const todoId = e.dataTransfer.getData('todoId');
        if (todoId && onUpdateMetadata) {
            const dueTime = `${hour.toString().padStart(2, '0')}:00`;
            onUpdateMetadata(todoId, { dueTime });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const getPriorityColor = (level: string) => {
        switch(level) {
            case 'URGENT': return 'bg-red-500';
            case 'HIGH': return 'bg-orange-500';
            default: return 'bg-[var(--accent)]';
        }
    };
    
    const unassignedTasks = todayTodos.filter(t => !t.dueTime);
    const assignedTasks = todayTodos.filter(t => t.dueTime);
    const pendingUnassigned = unassignedTasks.filter(t => !t.completed).length;
    const isOverloaded = assignedTasks.filter(t => !t.completed).length >= 8;

    return (
        <div className="animate-slide-up space-y-10 pb-20">
            {/* Task Backlog */}
            {unassignedTasks.length > 0 && (
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-semibold text-[var(--text-primary)] tracking-tight">Task backlog</h3>
                            <span className="text-[11px] text-[var(--text-secondary)]">Drag tasks to the timeline to schedule your day</span>
                        </div>
                        <span className="text-[10px] font-semibold bg-gray-100 px-3 py-1 rounded-full text-[var(--text-primary)]">
                            {pendingUnassigned} pending
                        </span>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {unassignedTasks.map(t => (
                            <div 
                                key={t.id} 
                                draggable={!t.completed}
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                className={clsx(
                                    "flex-shrink-0 min-w-[180px] p-5 bg-white border border-[var(--border)] rounded-xl transition-all group",
                                    !t.completed ? "cursor-grab active:cursor-grabbing hover:border-[var(--accent)]" : "opacity-60 grayscale-[0.5] border-dashed"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={clsx("w-6 h-1 rounded-full", getPriorityColor(t.priority))} />
                                    {t.completed ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    ) : t.status === 'IN_PROGRESS' ? (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onPauseTask?.(t.id); }}
                                                className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center transition-all hover:bg-amber-100"
                                                title="Pause"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onStopTask?.(t.id); }}
                                                className="w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center animate-pulse"
                                                title="Complete"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onStartTask?.(t.id); }}
                                            className={clsx(
                                                "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                                t.status === 'PAUSED' ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
                                            )}
                                            title={t.status === 'PAUSED' ? "Resume" : "Start"}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M5 3l14 9-14 9V3z"/></svg>
                                        </button>
                                    )}
                                </div>
                                <p className={clsx(
                                    "text-sm font-medium leading-tight transition-colors",
                                    t.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)] group-hover:text-[var(--accent)]"
                                )}>
                                    {t.title}
                                </p>
                                {t.completed && (
                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-600">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        <span>Done {formatTimeWithFallback(t.completedAt)}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vertical Timeline Grid */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50/50">
                    <h3 className="text-xs font-semibold text-[var(--text-primary)]">Daily timeline</h3>
                </div>
                
                <div className="relative">
                    {hours.map((hour, idx) => {
                        const hourTasks = todayTodos.filter(t => t.dueTime && parseInt(t.dueTime.split(':')[0]) === hour);
                        const isCurrentHour = hour === currentHour;
                        
                        return (
                            <div 
                                key={hour} 
                                onDrop={(e) => handleDrop(e, hour)}
                                onDragOver={handleDragOver}
                                className={clsx(
                                    "relative flex group transition-colors duration-300",
                                    idx !== hours.length - 1 && "border-b border-white/[0.03]"
                                )}
                            >
                                {/* Time Label Column */}
                                <div className="w-[80px] py-8 flex flex-col items-center justify-start border-r border-[var(--border)]">
                                    <span className={clsx(
                                        "text-xs font-medium transition-colors duration-300",
                                        isCurrentHour ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/40"
                                    )}>
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                                
                                {/* Current Time Indicator */}
                                {isCurrentHour && (
                                    <div 
                                        className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                                        style={{ top: `${(currentMinute / 60) * 100}%` }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] ml-[79px]" />
                                        <div className="h-[1px] flex-1 bg-[var(--accent)]/20" />
                                    </div>
                                )}

                                {/* Card Slot */}
                                <div 
                                    className="flex-1 p-3 min-h-[100px] flex flex-col gap-2 group-hover:bg-gray-50/50 transition-colors cursor-pointer relative"
                                    onClick={() => onCreateInSlot?.(selectedDate, `${hour.toString().padStart(2, '0')}:00`)}
                                >
                                    {/* Slot Hover Indicator */}
                                    <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 rounded-full">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            Add task
                                        </div>
                                    </div>
                                    {hourTasks.map(t => (
                                        <div 
                                            key={t.id} 
                                            draggable={!t.completed}
                                            onDragStart={(e) => handleDragStart(e, t.id)}
                                            className={clsx(
                                                "bg-white border border-[var(--border)] p-4 rounded-xl flex justify-between items-center transition-all group/task",
                                                !t.completed ? "cursor-grab active:cursor-grabbing hover:border-[var(--accent)]" : "opacity-60 bg-gray-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-1.5 h-1.5 rounded-full", getPriorityColor(t.priority))} />
                                                <span className={clsx(
                                                    "text-sm font-medium transition-colors",
                                                    t.completed ? "text-[var(--text-secondary)] line-through" : (t.status === 'IN_PROGRESS' ? "text-[var(--accent)]" : "text-[var(--text-primary)] group-hover/task:text-[var(--accent)]")
                                                )}>
                                                    {t.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {t.completed ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded text-[10px] font-semibold text-emerald-600">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        {formatTimeWithFallback(t.completedAt) || 'Done'}
                                                    </div>
                                                ) : t.status === 'IN_PROGRESS' ? (
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onPauseTask?.(t.id); }}
                                                            className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center transition-all hover:bg-amber-100"
                                                            title="Pause"
                                                        >
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onStopTask?.(t.id); }}
                                                            className="w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center animate-pulse"
                                                            title="Complete"
                                                        >
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onStartTask?.(t.id); }}
                                                        className={clsx(
                                                            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                                            t.status === 'PAUSED' ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
                                                        )}
                                                        title={t.status === 'PAUSED' ? "Resume" : "Start"}
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M5 3l14 9-14 9V3z"/></svg>
                                                    </button>
                                                )}
                                                <span className="text-[10px] font-medium text-[var(--text-secondary)]/40">{t.dueTime}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Status Footer */}
            <div className="flex items-center justify-center pt-4">
                {isOverloaded ? (
                    <div className="bg-red-50 px-6 py-4 rounded-xl border border-red-100 flex items-center gap-4">
                        <span className="text-xl">🛑</span> 
                        <span className="text-xs font-medium text-red-600">Careful: You have a lot scheduled for today. Take it easy!</span>
                    </div>
                ) : (
                    <div className="bg-white px-6 py-4 rounded-xl border border-[var(--border)] flex items-center gap-4">
                        <span className="text-xl">✨</span> 
                        <span className="text-xs font-medium text-[var(--text-secondary)]">Your schedule looks great! Ready to focus.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
