import React from 'react';
import { clsx } from '../lib/utils';

interface DailyPlannerProps {
    todos: any[];
    selectedDate: string;
    onUpdateMetadata: (id: string, updates: Record<string, any>) => void;
}

export default function DailyPlanner({ todos, selectedDate, onUpdateMetadata }: DailyPlannerProps) {
    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 to 20:00
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    const todayTodos = todos.filter(t => t.dueDate === selectedDate && !t.deleted && !t.completed);

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
    const isOverloaded = assignedTasks.length >= 8;

    return (
        <div className="animate-slide-up space-y-10 pb-20">
            {/* Task Backlog */}
            {unassignedTasks.length > 0 && (
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Intentions Backlog</h3>
                            <span className="text-[8px] text-[var(--text-secondary)]/40 uppercase tracking-widest mt-1">Drag to schedule your day</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white/5 px-3 py-1.5 rounded-full text-[var(--text-primary)] border border-white/5">{unassignedTasks.length} pending</span>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {unassignedTasks.map(t => (
                            <div 
                                key={t.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                className="flex-shrink-0 min-w-[180px] p-5 glass rounded-[20px] cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all group"
                            >
                                <div className={clsx("w-6 h-1 rounded-full mb-3", getPriorityColor(t.priority))} />
                                <p className="text-xs font-bold text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                                    {t.title}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vertical Timeline Grid */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
                    <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Daily Timeline</h3>
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
                                <div className="w-[80px] py-8 flex flex-col items-center justify-start border-r border-white/[0.03]">
                                    <span className={clsx(
                                        "text-[10px] font-bold tracking-tighter transition-colors duration-300",
                                        isCurrentHour ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/30"
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
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(108,92,231,0.8)] ml-[79px]" />
                                        <div className="h-[1px] flex-1 bg-[var(--accent)]/40" />
                                    </div>
                                )}

                                {/* Card Slot */}
                                <div className="flex-1 p-3 min-h-[100px] flex flex-col gap-3 group-hover:bg-white/[0.01] transition-colors">
                                    {hourTasks.map(t => (
                                        <div 
                                            key={t.id} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, t.id)}
                                            className="glass p-4 rounded-2xl flex justify-between items-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all group/task"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-1.5 h-1.5 rounded-full", getPriorityColor(t.priority))} />
                                                <span className="text-xs font-bold text-[var(--text-primary)] group-hover/task:text-[var(--accent)] transition-colors">{t.title}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-[var(--text-secondary)]/20 uppercase tracking-widest">{t.dueTime}</span>
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
                    <div className="glass px-6 py-4 rounded-2xl border-red-500/10 flex items-center gap-4 animate-pulse">
                        <span className="text-lg">🛑</span> 
                        <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest">Caution: Schedule exceeding optimal energy.</span>
                    </div>
                ) : (
                    <div className="glass px-6 py-4 rounded-2xl border-[var(--accent)]/10 flex items-center gap-4">
                        <span className="text-lg">✨</span> 
                        <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">Timeline Optimized for Peak Focus.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

