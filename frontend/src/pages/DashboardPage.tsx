import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { formatDate } from '../utils/formatters';
import { clsx } from '../lib/utils';
import TaskSkeleton from '../components/TaskSkeleton';
import TodoItem from '../components/TodoItem';
import DigitalClock from '../components/DigitalClock';
import RoutineBuilderModal from '../components/RoutineBuilderModal';

interface DashboardProps {
    setTab?: (tab: string) => void;
}

export default function DashboardPage({ setTab }: DashboardProps) {
    const { user } = useAuthContext();
    const { 
        tasks, templates, loading, updateTask, deleteTask, startTask, pauseTask, stopTask, 
        startExecutionSession, exitExecutionSession, executeProtocol, addTask 
    } = useTasks(user?.uid);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    const routineTemplate = templates?.find(t => t.isRitual && !t.deleted);

    const handleSaveRoutine = async (title: string, steps: any[]) => {
        if (routineTemplate) {
            await updateTask(routineTemplate.id, { title, subtasksJson: JSON.stringify(steps) });
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
                notes: "My defined protocol."
            });
        }
        success?.("Routine updated successfully!");
    };

    const { success } = useToast() || {};

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const activeTasks = useMemo(() => {
        let list = tasks.filter(t => t.dueDate === todayStr && !t.deleted);
        if (debouncedSearchTerm) {
            list = list.filter(t => t.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        }
        if (priorityFilter !== 'ALL') {
            list = list.filter(t => t.priority === priorityFilter);
        }
        if (filterMode === 'COMPLETED') {
            list = list.filter(t => t.completed);
        } else if (filterMode === 'PENDING') {
            list = list.filter(t => !t.completed);
        }
        return list;
    }, [tasks, debouncedSearchTerm, priorityFilter, filterMode, todayStr]);

    const handleClearAll = async () => {
        const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.deleted);
        if (todayTasks.length === 0) return;
        
        if (window.confirm(`Are you sure you want to clear all ${todayTasks.length} tasks for today?`)) {
            try {
                await Promise.all(todayTasks.map(t => updateTask(t.id, { deleted: true })));
                success?.("Today's tasks cleared.");
            } catch (err) {
                console.error(err);
            }
        }
    };

    const progress = useMemo(() => {
        if (activeTasks.length === 0) return 0;
        const comp = activeTasks.filter(t => t.completed).length;
        return Math.round((comp / activeTasks.length) * 100);
    }, [activeTasks]);

    if (loading) return <TaskSkeleton />;

    const completedToday = activeTasks.filter(t => t.completed).length;

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Header / Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                        Good morning, {user?.displayName ? user.displayName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'User')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-secondary)]">
                            {formatDate(todayStr)}
                        </span>
                        <div className="h-3 w-[1px] bg-[var(--border)]" />
                        {activeTasks.some(t => t.status === 'IN_PROGRESS') ? (
                            <span className="text-xs text-[var(--accent)] font-medium animate-pulse">
                                Execution in progress: {activeTasks.find(t => t.status === 'IN_PROGRESS')?.title}
                            </span>
                        ) : (
                            <span className="text-xs text-[var(--text-secondary)] font-medium">
                                System ready for next objective
                            </span>
                        )}
                    </div>
                    
                    {/* Execution Mode Controls */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        {activeTasks.some(t => t.isExecutionMode) ? (
                            <>
                                <button 
                                    onClick={() => setTab && setTab('FOCUS')}
                                    className="btn-primary animate-pulse flex items-center gap-2 px-5"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                    Resume Execution
                                </button>
                                <button 
                                    onClick={exitExecutionSession}
                                    className="btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200 border-transparent px-5 flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    Exit Mode
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <button 
                                    onClick={() => {
                                        if (!routineTemplate) {
                                            setIsBuilderOpen(true);
                                            return;
                                        }
                                        if (setTab && executeProtocol && routineTemplate) executeProtocol(routineTemplate.id, setTab);
                                    }}
                                    className="btn-primary flex items-center gap-2 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all text-white font-semibold"
                                >
                                    <span className="text-base mr-1">🚀</span>
                                    {routineTemplate ? 'Start Morning Protocol' : 'Setup Morning Protocol'}
                                </button>
                                <button 
                                    onClick={() => setIsBuilderOpen(true)} 
                                    className="btn-secondary px-4 !h-10 text-xs font-semibold hover:bg-[var(--hover)] flex items-center gap-2 transition-all border border-[var(--border)]"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Edit Routine
                                </button>
                                <button 
                                    onClick={async () => {
                                        await startExecutionSession?.();
                                        if (setTab) setTab('FOCUS');
                                    }}
                                    className="btn-secondary flex items-center gap-2 px-6 !h-10 hover:bg-[var(--hover)] transition-all outline-none"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                    Execute Daily Tasks
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <DigitalClock />
            </div>

            {/* Main Content Area: 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                
                {/* PRIMARY COLUMN: Tasks */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metric Quick-View (Horizontal Row) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => setFilterMode('ALL')}
                            className={clsx(
                                "card p-4 flex flex-col justify-between h-[100px] text-left transition-all",
                                filterMode === 'ALL' ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/10 bg-[var(--accent-soft)]/10" : "hover:border-[var(--accent)]/30"
                            )}
                        >
                             <span className="text-[11px] font-medium text-[var(--text-secondary)]">Today's total</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-xl font-semibold text-[var(--text-primary)]">{tasks.filter(t => t.dueDate === todayStr && !t.deleted).length}</span>
                                 <div className="w-6 h-6 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                                 </div>
                             </div>
                        </button>
                        <button 
                            onClick={() => setFilterMode('PENDING')}
                            className={clsx(
                                "card p-4 flex flex-col justify-between h-[100px] text-left transition-all",
                                filterMode === 'PENDING' ? "border-amber-400 ring-1 ring-amber-100 bg-amber-50/10" : "hover:border-amber-400/30"
                            )}
                        >
                             <span className="text-[11px] font-medium text-[var(--text-secondary)]">Completion rate</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-xl font-semibold text-[var(--text-primary)]">{progress}%</span>
                                 <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                 </div>
                             </div>
                        </button>
                        <button 
                            onClick={() => setFilterMode('COMPLETED')}
                            className={clsx(
                                "card p-4 flex flex-col justify-between h-[100px] text-left transition-all",
                                filterMode === 'COMPLETED' ? "border-emerald-500 ring-1 ring-emerald-100 bg-emerald-50/10" : "hover:border-emerald-500/30"
                            )}
                        >
                             <span className="text-[11px] font-medium text-[var(--text-secondary)]">Completed tasks</span>
                             <div className="flex items-end justify-between">
                                 <span className="text-xl font-semibold text-[var(--text-primary)]">{completedToday}</span>
                                 <div className="w-6 h-6 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                 </div>
                             </div>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                                    <span className="w-1 h-3 bg-[var(--accent)] rounded-full" />
                                    Personal tasks
                                </h2>
                                <button 
                                    onClick={handleClearAll}
                                    className="text-[10px] font-bold text-[var(--accent)] hover:underline uppercase tracking-wider"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs w-40 focus:w-56 focus:border-[var(--accent)] transition-all outline-none placeholder:text-[var(--text-secondary)]/40"
                                    />
                                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                                <select 
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="bg-[var(--card-bg)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)] transition-all cursor-pointer text-[var(--text-secondary)]"
                                >
                                    <option value="ALL">All priorities</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="card divide-y divide-[var(--border)] overflow-hidden">
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <div key={task.id} className="first:border-t-0">
                                        <TodoItem 
                                            todo={task} 
                                            onToggle={(t: any) => updateTask(t.id, { completed: !t.completed })}
                                            onDelete={(id: string) => deleteTask(id)}
                                            onUpdateMetadata={(id: string, updates: any) => updateTask(id, updates)}
                                            onStartTask={startTask}
                                            onPauseTask={pauseTask}
                                            onStopTask={stopTask}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center group">
                                    <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]/30">
                                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">All caught up!</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">You have no tasks for today. Great job!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECONDARY COLUMN: Insights / Sub-panel */}
                <div className="space-y-8 lg:sticky lg:top-8">
                    <div className="flex flex-col gap-6">
                        <div>
                             <h2 className="text-xs font-semibold text-[var(--text-secondary)] px-1 mb-4">Daily overview</h2>
                             <div className="card p-6 border-[var(--border)] overflow-hidden">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--text-secondary)]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)]">Estimated time</span>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">4.5h allocated</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--text-secondary)]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)]">Workload</span>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">High morning load</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--text-secondary)]">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12H2M12 2v20M2 12l10-10 10 10M12 22l10-10-10-10"/></svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)]">Focus strategy</span>
                                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Focus on deep work</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-[var(--border)]">
                                    <button className="btn-secondary w-full text-xs">
                                        View trends
                                    </button>
                                </div>
                             </div>
                        </div>

                        <div>
                             <h2 className="text-xs font-semibold text-[var(--text-secondary)] px-1 mb-4">Goal progress</h2>
                             <div className="space-y-2">
                                 {['Prime Morning', 'Deep Work Block', 'Recovery Buffer'].map((vector, i) => (
                                     <div key={vector} className="card p-4 flex items-center justify-between">
                                         <span className="text-xs font-medium text-[var(--text-primary)]">{vector}</span>
                                         <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-[var(--accent)]" style={{ width: `${(3-i)*30}%` }} />
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        <div>
                             <h2 className="text-xs font-semibold text-[var(--text-secondary)] px-1 mb-4">Daily quote</h2>
                             <div className="card p-6 border-transparent bg-gray-50">
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                                    "Consistency is the only protocol that matters."
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <RoutineBuilderModal 
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                template={routineTemplate}
                onSave={handleSaveRoutine}
            />
        </div>
    );
}
