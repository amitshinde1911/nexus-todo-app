import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { clsx } from '../lib/utils';
import TaskSkeleton from '../components/TaskSkeleton';
import RoutineBuilderModal from '../components/RoutineBuilderModal';
import { Task } from '../types';

interface HabitProps {
    setTab?: (tab: string) => void;
}

export default function HabitTrackerPage({ setTab }: HabitProps) {
    const { user } = useAuthContext();
    const { tasks, rituals, templates, loading, updateTask, addTask, deleteTask, executeProtocol } = useTasks(user?.uid);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Task | undefined>(undefined);
    
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Active Elements
    const activeHabits = useMemo(() => {
        return tasks.filter(t => t.category === 'Habit' && !t.deleted && (t.dueDate === todayStr || !t.dueDate));
    }, [tasks, todayStr]);

    const activeProtocolsToday = useMemo(() => {
        return rituals.filter(t => !t.deleted && t.dueDate === todayStr && !t.completed);
    }, [rituals, todayStr]);

    const routineTemplates = useMemo(() => {
        return templates.filter(t => t.isRitual && !t.deleted);
    }, [templates]);

    const protocolLogs = useMemo(() => {
        return rituals
            .filter(t => t.completed && !t.deleted)
            .sort((a, b) => new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime());
    }, [rituals]);

    const currentStreak = useMemo(() => {
        if (protocolLogs.length === 0) return 0;
        let streak = 0;
        let currentDate = new Date(todayStr);

        // Check if completed today, if so streak minimum 1, else we start checking yesterday
        const completedToday = protocolLogs.some(l => l.dueDate === todayStr);
        if (completedToday) streak++;
        else currentDate.setDate(currentDate.getDate() - 1); // shift back a day if haven't done today yet
        
        while (true) {
            const dStr = currentDate.toISOString().split('T')[0];
            if (protocolLogs.some(l => l.dueDate === dStr)) {
                if (!completedToday && streak === 0) streak++; // Started streak yesterday
                else if (streak > 0) streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }, [protocolLogs, todayStr]);

    const handleSaveRoutine = async (title: string, steps: any[]) => {
        if (editingTemplate) {
            await updateTask(editingTemplate.id, { title, subtasksJson: JSON.stringify(steps) });
        } else if (addTask) {
            await addTask({
                title,
                priority: 'URGENT',
                category: 'Habit',
                dueDate: '',
                dueTime: '06:00',
                repeat: 'DAILY',
                isRecurring: true,
                recurrenceType: 'DAILY',
                isRitual: true,
                subtasksJson: JSON.stringify(steps),
                notes: "User defined protocol."
            });
        }
    };

    if (loading) return <TaskSkeleton />;

    return (
        <div className="space-y-10 animate-slide-up pb-20 max-w-4xl mx-auto">
            
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Control Center</h1>
                <p className="text-sm text-[var(--text-secondary)]">Your daily protocols and identity architecture.</p>
            </div>

            {/* SECTION 1: TODAY'S PROTOCOL (ACTION) */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Today's Protocol</h2>
                    <div className="h-[1px] flex-1 bg-[var(--border)]" />
                    {currentStreak > 0 && (
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                            🔥 {currentStreak} Day Streak
                        </span>
                    )}
                </div>

                {routineTemplates.length === 0 ? (
                    // Onboarding State
                    <div className="card p-8 md:p-12 border-dashed border-[var(--accent)]/40 bg-[var(--accent-soft)]/10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white mb-6 shadow-xl shadow-[var(--accent)]/20">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Build Your First Protocol</h3>
                        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">Design your morning routine sequence and start executing automatically every day.</p>
                        <button 
                            onClick={() => { setEditingTemplate(undefined); setIsBuilderOpen(true); }}
                            className="bg-[var(--accent)] text-white px-8 py-4 rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-all shadow-xl shadow-[var(--accent)]/30 transform hover:-translate-y-1"
                        >
                            Create Protocol Workflow
                        </button>
                    </div>
                ) : activeProtocolsToday.length > 0 ? (
                    // Active Protocol Exists
                    <div className="grid grid-cols-1 gap-4">
                        {activeProtocolsToday.map(ritual => {
                            let steps = [];
                            try { steps = JSON.parse(ritual.subtasksJson || '[]'); } catch(e) {}
                            const completedSteps = steps.filter((s:any) => s.completed).length;

                            return (
                                <div key={ritual.id} className="card p-6 md:p-10 bg-gradient-to-br from-emerald-500 to-teal-400 text-white relative overflow-hidden group border-0 shadow-lg shadow-emerald-500/20">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                </div>
                                                <span className="text-sm font-semibold tracking-wider text-emerald-50">Active Focus Mode</span>
                                            </div>
                                            <h3 className="text-3xl font-bold tracking-tight mb-2">{ritual.title}</h3>
                                            <div className="flex items-center gap-2 cursor-pointer bg-black/20 rounded-lg px-3 py-1.5 w-fit">
                                                <span className="text-xs font-bold text-white">Step {completedSteps} / {steps.length > 0 ? steps.length : '?'}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (ritual.status !== 'IN_PROGRESS') {
                                                    await updateTask(ritual.id, { status: 'IN_PROGRESS' });
                                                }
                                                if (setTab) setTab('FOCUS');
                                            }}
                                            className="bg-white hover:bg-emerald-50 text-emerald-700 px-8 py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-xl flex items-center gap-3 w-fit md:w-auto shrink-0 justify-center"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                            Continue Engine
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Routine Template Exists, but none spawned for today or already completed
                    <div className="card p-8 border-none bg-gradient-to-r from-gray-50 to-[var(--bg-main)] dark:from-[var(--card-bg)] flex items-center justify-between shadow-sm">
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">All Protocols Completed</h3>
                                <p className="text-sm text-[var(--text-secondary)]">You've finished your workflows for today.</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* SECTION 2: PROTOCOLS / ROUTINES (EDITABLE) */}
            <section className="space-y-4">
                <div className="flex justify-between items-center bg-[var(--card-bg)] px-4 py-3 rounded-lg border border-[var(--border)]">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Your Protocols</h2>
                    <button 
                        onClick={() => { setEditingTemplate(undefined); setIsBuilderOpen(true); }}
                        className="text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)] px-3 py-1.5 rounded-md transition-all"
                    >
                        + Create Details
                    </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    {routineTemplates.map(template => {
                        let steps = [];
                        try { steps = JSON.parse(template.subtasksJson || '[]'); } catch(e) {}
                        
                        return (
                            <div key={template.id} className="card p-4 flex items-center justify-between hover:border-[var(--accent)] transition-all cursor-pointer bg-[var(--bg-main)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] shadow-sm">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)]">{template.title}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">{steps.length} Defined Steps</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     <button 
                                        onClick={() => executeProtocol(template.id, setTab!)}
                                        className="btn-primary px-3 py-1.5 text-xs h-8 flex items-center justify-center gap-1"
                                     >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg> 
                                        Start
                                     </button>
                                     <button 
                                        onClick={() => { setEditingTemplate(template); setIsBuilderOpen(true); }}
                                        className="btn-secondary px-3 py-1.5 text-xs h-8"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if(confirm("Are you sure you want to delete this protocol?")) {
                                                deleteTask(template.id);
                                            }
                                        }}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md text-xs font-semibold h-8 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* SECTION 3: HISTORY LOGS */}
            {protocolLogs.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-1">Protocol History</h2>
                    <div className="card p-1 border border-[var(--border)] overflow-hidden">
                        {protocolLogs.slice(0, 5).map((log, idx) => (
                            <div key={log.id} className={clsx("p-4 flex items-center gap-4", idx !== protocolLogs.slice(0,5).length - 1 && "border-b border-[var(--border)]")}>
                                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-[var(--text-primary)]">{log.title}</h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium flex gap-2 mt-0.5">
                                        <span>{log.dueDate}</span>
                                        {log.completedAt && (
                                            <>
                                                <span>•</span>
                                                <span>Finished at {new Date(log.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SECTION 4: HABITS */}
            <section className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Daily Habits</h2>
                    <div className="h-[1px] flex-1 bg-[var(--border)]" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHabits.map(habit => (
                        <div 
                            key={habit.id}
                            onClick={() => updateTask(habit.id, { completed: !habit.completed })}
                            className={clsx(
                                "card p-4 transition-all duration-300 cursor-pointer overflow-hidden flex items-center gap-4",
                                habit.completed 
                                    ? "bg-[var(--accent-soft)]/20 border-[var(--accent)]/30" 
                                    : "hover:border-[var(--accent)] bg-[var(--card-bg)]"
                            )}
                        >
                            <div className={clsx(
                                "w-6 h-6 rounded flex items-center justify-center transition-all duration-300 shrink-0",
                                habit.completed 
                                    ? "bg-[var(--accent)] text-white" 
                                    : "bg-[var(--bg-main)] border border-[var(--border)] text-transparent"
                            )}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                            </div>
                            
                            <h3 className={clsx(
                                "font-medium text-sm transition-all duration-300 flex-1",
                                habit.completed ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                            )}>
                                {habit.title}
                            </h3>
                        </div>
                    ))}

                    <div className="card p-4 border-dashed cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/10 transition-all flex items-center gap-4 bg-[var(--bg-main)]">
                         <div className="w-6 h-6 border-2 border-dashed border-[var(--text-secondary)]/30 rounded flex items-center justify-center text-[var(--text-secondary)]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                         </div>
                         <span className="text-sm font-medium text-[var(--text-secondary)]">Quick add habit</span>
                    </div>
                </div>
            </section>

            <RoutineBuilderModal 
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                template={editingTemplate}
                onSave={handleSaveRoutine}
            />
        </div>
    );
}
