import React, { useState, useEffect, useMemo } from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';

interface DailyPlannerProps {
    todos: Task[];
    selectedDate: string;
    onUpdateMetadata: (id: string, updates: Record<string, any>) => void;
    onStartTask?: (id: string) => void;
    onPauseTask?: (id: string) => void;
    onStopTask?: (id: string) => void;
    onCreateInSlot?: (date: string, time: string) => void;
}

export default function DailyPlanner({ 
    todos, 
    selectedDate, 
    onUpdateMetadata, 
    onCreateInSlot 
}: DailyPlannerProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isSelectedToday = selectedDate === new Date().toISOString().split('T')[0];

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayTasks = useMemo(() => todos.filter(t => t.dueDate === selectedDate && !t.deleted), [todos, selectedDate]);
    
    const unassignedTasks = useMemo(() => dayTasks.filter(t => !t.dueTime && !t.completed), [dayTasks]);
    const assignedTasks = useMemo(() => dayTasks.filter(t => t.dueTime), [dayTasks]);

    const totalScheduledMins = useMemo(() => {
        return dayTasks.reduce((acc, t) => acc + (t.estimatedMins || 30), 0);
    }, [dayTasks]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('taskId', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, hour: number, minute: number = 0) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            const dueTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            onUpdateMetadata(taskId, { dueTime });
        }
    };

    const getTaskStyle = (task: Task) => {
        if (task.isRitual) return "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5";
        if (task.title.toLowerCase().includes('#deepwork') || (task.notes?.toLowerCase() || '').includes('#deepwork')) {
            return "border-[var(--text-primary)] bg-gray-50 dark:bg-white/5";
        }
        return "border-gray-200 border-dashed dark:border-white/10";
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 h-[calc(100vh-280px)] min-h-[600px] animate-fade-in relative">
            
            {/* LEFT COLUMN: AVAILABLE TASKS (BACKLOG) */}
            <aside className="flex flex-col h-full bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border)] bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Available</h3>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50 mt-1">Drag to schedule</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {unassignedTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-20 grayscale">
                             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                             <p className="text-xs font-bold uppercase tracking-widest">Backlog Clear</p>
                        </div>
                    ) : (
                        unassignedTasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className={clsx(
                                    "p-4 rounded-xl border-l-4 shadow-sm transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] bg-[var(--bg-main)]",
                                    getTaskStyle(task)
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={clsx(
                                        "w-1.5 h-1.5 rounded-full",
                                        task.priority === 'URGENT' ? "bg-red-500" : (task.priority === 'HIGH' ? "bg-orange-500" : "bg-blue-400")
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{task.category}</span>
                                </div>
                                <h4 className="text-sm font-bold text-[var(--text-primary)] leading-snug">{task.title}</h4>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-gray-50/30">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter">
                        Total Scheduled: <span className="text-[var(--text-primary)]">{(totalScheduledMins/60).toFixed(1)}h</span>
                    </p>
                </div>
            </aside>

            {/* RIGHT COLUMN: TODAY'S FLOW (TIMELINE) */}
            <section className="flex flex-col h-full bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm relative">
                <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-white/50 dark:bg-black/10 backdrop-blur-sm sticky top-0 z-20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Today's Flow</h3>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter text-[var(--text-secondary)]">Protocols</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-[var(--text-primary)] rounded-full" />
                             <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter text-[var(--text-secondary)]">Deep Work</span>
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    {hours.map((hour) => {
                        const isPast = isSelectedToday && hour < currentHour;
                        const isCurrent = isSelectedToday && hour === currentHour;
                        const hourTasks = assignedTasks.filter(t => parseInt(t.dueTime?.split(':')[0] || '-1') === hour);

                        return (
                            <div 
                                key={hour} 
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, hour)}
                                onClick={() => onCreateInSlot?.(selectedDate, `${hour.toString().padStart(2, '0')}:00`)}
                                className={clsx(
                                    "group min-h-[100px] border-b border-[var(--border)] flex relative hover:bg-[var(--bg-main)]/50 transition-colors",
                                    isPast && "opacity-30 grayscale-[0.5]"
                                )}
                            >
                                {/* Time Column */}
                                <div className="w-20 flex flex-col items-center pt-4 border-r border-[var(--border)] bg-gray-50/20">
                                    <span className={clsx(
                                        "text-[11px] font-black tabular-nums transition-colors",
                                        isCurrent ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/30"
                                    )}>
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>

                                {/* Task Rail */}
                                <div className="flex-1 p-3 flex flex-wrap gap-2 items-start relative">
                                    {/* Now Line */}
                                    {isCurrent && (
                                        <div 
                                            className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                                            style={{ top: `${(currentMinute / 60) * 100}%` }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                            <div className="h-[1px] flex-1 bg-red-500/30" />
                                            <span className="text-[8px] font-black text-red-500 ml-2 uppercase tracking-tighter bg-white dark:bg-[#0a0a0a] px-1">NOW</span>
                                        </div>
                                    )}

                                    {hourTasks.length === 0 ? (
                                        <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        </div>
                                    ) : (
                                        hourTasks.map(task => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    handleDragStart(e, task.id);
                                                }}
                                                className={clsx(
                                                    "min-w-[200px] flex-1 max-w-[400px] p-4 rounded-xl border-l-4 shadow-md bg-[var(--card-bg)] flex justify-between items-center transition-all cursor-grab active:cursor-grabbing hover:translate-x-1 group/task",
                                                    getTaskStyle(task)
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <h4 className={clsx(
                                                        "text-sm font-bold tracking-tight",
                                                        task.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                                                    )}>
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                         <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest">{task.dueTime}</span>
                                                         {task.completed && (
                                                             <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Neutralized</span>
                                                         )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                    <div className={clsx(
                                                        "w-6 h-6 rounded-lg flex items-center justify-center border",
                                                        task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)]"
                                                    )}>
                                                        {task.completed ? (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                        ) : (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

        </div>
    );
}
