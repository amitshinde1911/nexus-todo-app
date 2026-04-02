import React, { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { getMonthGrid, formatMonthHeader, isToday, getIsoDateStr } from '../utils/dateUtils';
import { clsx } from '../lib/utils';
import { Task } from '../types';

interface CalendarPageProps {
    setTab?: (tab: string) => void;
}

export default function CalendarPage({ setTab }: CalendarPageProps) {
    const { user } = useAuthContext();
    const { tasks, rituals, loading, addTask, updateTask, deleteTask } = useTasks(user?.uid);
    
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
    
    const allEvents = useMemo(() => {
        return [...tasks, ...rituals].filter(t => !t.deleted && t.dueDate);
    }, [tasks, rituals]);

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const upcomingTasks = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return allEvents
            .filter(t => t.dueDate >= todayStr && !t.completed)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 5);
    }, [allEvents]);

    const renderTaskBar = (task: Task) => {
        const isDeadline = task.priority === 'URGENT' || task.priority === 'HIGH';
        return (
            <div 
                key={task.id}
                className={clsx(
                    "text-[9px] px-1.5 py-0.5 rounded-sm mb-0.5 truncate cursor-pointer transition-all hover:brightness-95 active:scale-95",
                    isDeadline ? "bg-red-100 text-red-600 border border-red-200" : "bg-gray-100 text-[var(--text-secondary)] border border-gray-200",
                    task.completed && "opacity-50 grayscale"
                )}
                title={task.title}
                onClick={(e) => {
                    e.stopPropagation();
                    // Open edit modal logic here if available
                }}
            >
                {task.title}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-fade-in pb-8">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                        Nexus Personal Calendar
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[var(--border)] p-1 rounded-lg">
                        {(['MONTH', 'WEEK', 'DAY'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={clsx(
                                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
                                    viewMode === mode ? "bg-white text-[var(--text-primary)] shadow-sm rounded-md" : "text-[var(--text-secondary)] opacity-50 hover:opacity-80"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    <button 
                         onClick={() => {/* Trigger Add Task Modal with current date */}}
                         className="btn-primary px-6 py-2 bg-red-500 hover:bg-red-600 border-0 text-white font-bold flex items-center gap-2 text-xs"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Task
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start flex-1">
                {/* SIDEBAR: 3 cols */}
                <div className="lg:col-span-3 space-y-12">
                    {/* Mini Month Picker */}
                    <div className="card p-6 border-[var(--border)] overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                                {formatMonthHeader(viewDate)}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-all">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                                </button>
                                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-all">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-y-3 gap-x-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <span key={d} className="text-[9px] font-black text-[var(--text-secondary)] opacity-30 text-center uppercase">{d}</span>
                            ))}
                            {grid.slice(0, 42).map((cell, i) => (
                                <div 
                                    key={i}
                                    className={clsx(
                                        "w-full aspect-square flex items-center justify-center text-[10px] font-bold rounded-full transition-all cursor-pointer",
                                        !cell.isCurrentMonth && "opacity-20",
                                        isToday(cell.year, cell.month, cell.day) ? "bg-red-500 text-white" : "hover:bg-gray-100 text-[var(--text-primary)]"
                                    )}
                                    onClick={() => setViewDate(new Date(cell.year, cell.month, cell.day))}
                                >
                                    {cell.day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="space-y-4">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">
                            Upcoming Tasks
                        </h2>
                        <div className="space-y-3">
                            {upcomingTasks.length > 0 ? (
                                upcomingTasks.map(t => (
                                    <div key={t.id} className="flex flex-col gap-1 px-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl group hover:border-[var(--accent)] transition-all">
                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                                            {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                            {t.title}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-[var(--text-secondary)] px-1 italic">No impending milestones.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* MAIN GRID: 9 cols */}
                <div className="lg:col-span-9 bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl shadow-gray-200/40">
                    <div className="grid grid-cols-7 border-b border-[var(--border)] bg-gray-50/50">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="py-4 text-center">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--text-secondary)] opacity-60">
                                    {day}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 grid-rows-6 h-[720px]">
                        {grid.map((cell, i) => {
                            const dateStr = getIsoDateStr(cell.year, cell.month, cell.day);
                            const dayEvents = allEvents.filter(e => e.dueDate === dateStr);
                            const dayIsToday = isToday(cell.year, cell.month, cell.day);

                            return (
                                <div 
                                    key={i} 
                                    className={clsx(
                                        "border-r border-b border-[var(--border)] p-2 transition-all hover:bg-gray-50/30 flex flex-col group relative",
                                        !cell.isCurrentMonth && "bg-gray-50/50 opacity-40",
                                        (i + 1) % 7 === 0 && "border-r-0"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={clsx(
                                            "text-xs font-black tabular-nums transition-all",
                                            dayIsToday ? "w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center -mt-1 -ml-1 scale-110 shadow-lg shadow-red-500/20" : "text-[var(--text-secondary)] opacity-40 group-hover:opacity-100"
                                        )}>
                                            {cell.day}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto no-scrollbar">
                                        {dayEvents.map(renderTaskBar)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
