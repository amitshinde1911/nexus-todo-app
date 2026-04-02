import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { formatDate } from '../utils/formatters';
import { clsx } from '../lib/utils';
import TaskSkeleton from '../components/TaskSkeleton';
import TodoItem from '../components/TodoItem';
import CompactClock from '../components/CompactClock';
import CircularMetric from '../components/CircularMetric';
import RoutineBuilderModal from '../components/RoutineBuilderModal';
import RitualButton from '../components/RitualButton';
import TodoInput from '../components/TodoInput';

interface DashboardProps {
    setTab?: (tab: string) => void;
}

export default function DashboardPage({ setTab }: DashboardProps) {
    const { user } = useAuthContext();
    const { 
        tasks, rituals, staples, templates, loading, updateTask, deleteTask, startTask, pauseTask, stopTask, 
        startExecutionSession, exitExecutionSession, executeProtocol, addTask, dailyMetrics 
    } = useTasks(user?.uid);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isTodoInputOpen, setIsTodoInputOpen] = useState(false);
    const [isAddingEssential, setIsAddingEssential] = useState(false);

    const routineTemplate = templates?.find(t => t.isRitual && !t.deleted);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const { success } = useToast() || {};

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        const name = user?.displayName ? user.displayName.split(' ')[0] : 'Ambassador';
        if (hour < 12) return `Good morning, ${name}.`;
        if (hour < 18) return `Good afternoon, ${name}.`;
        return `Good evening, ${name}.`;
    }, [user]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const activeTasks = useMemo(() => {
        const combined = [...tasks, ...rituals, ...staples];
        let list = combined.filter(t => t.dueDate === todayStr && !t.deleted);
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

    const handleStartExecutionMode = async () => {
        if (dailyMetrics.primeProgress < 100) {
            if (confirm("Morning Protocol is still incomplete. Proceed to high-stakes execution mode anyway?")) {
                await startExecutionSession();
            }
        } else {
            await startExecutionSession();
        }
    };

    if (loading) return <TaskSkeleton />;

    const nextTask = activeTasks.find(t => !t.completed && t.status !== 'COMPLETED' && !t.isEssential);

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* HEATMAP ANCHOR: GREETING & STATUS */}
            <header className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">
                        {greeting}
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-secondary)] opacity-60">
                        <span className="uppercase tracking-widest">{formatDate(todayStr)}</span>
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <span className="uppercase tracking-widest">
                            {activeTasks.filter(t => !t.completed && !t.isEssential).length} Objectives Remaining
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* BEHAVIORAL ALIGNMENT SPARKLINE */}
                    <div className="hidden md:flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Behavioral Alignment</span>
                            <span className="text-xs font-black text-emerald-500 tabular-nums">{dailyMetrics.essentialFidelity}%</span>
                        </div>
                        <div className="flex gap-1 items-end h-6">
                            {/* Simple mock of 7-day stability based on current fidelity */}
                            {Array.from({length: 7}).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={clsx(
                                        "w-1 rounded-full transition-all duration-1000",
                                        i === 6 ? "bg-emerald-500" : "bg-emerald-500/20"
                                    )} 
                                    style={{ height: i === 6 ? `${dailyMetrics.essentialFidelity}%` : `${60 + (i * 5)}%` }}
                                />
                            ))}
                        </div>
                    </div>
                    <CompactClock />
                </div>
            </header>

            {/* ACTION HERO AREA */}
            <section className="relative overflow-hidden p-8 bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl shadow-2xl shadow-gray-200/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                            </span>
                            Next Immediate Objective
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                            {nextTask ? nextTask.title : "All systems clear. Deep work sequence enabled."}
                        </h2>
                        {nextTask?.dueTime && (
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Scheduled for {nextTask.dueTime}</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {tasks.some(t => t.isExecutionMode) ? (
                            <button 
                                onClick={() => setTab && setTab('FOCUS')}
                                className="btn-primary h-14 px-8 bg-black text-white hover:bg-gray-900 border-0 shadow-xl shadow-black/20 flex items-center gap-3 group"
                            >
                                <span className="text-lg group-hover:scale-125 transition-transform">⚡</span>
                                Resume Execution
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => {
                                        if (!routineTemplate) { setIsBuilderOpen(true); return; }
                                        if (setTab && executeProtocol && routineTemplate) executeProtocol(routineTemplate.id, setTab);
                                    }}
                                    className="btn-primary h-14 px-8 bg-emerald-500 text-white hover:bg-emerald-600 border-0 shadow-xl shadow-emerald-500/20 flex items-center gap-3 group"
                                >
                                    <span className="text-lg group-hover:rotate-12 transition-transform">🚀</span>
                                    {routineTemplate ? 'Start Protocol' : 'Setup Protocol'}
                                </button>
                                <button 
                                    onClick={handleStartExecutionMode}
                                    className="btn-primary h-14 px-8 bg-black text-white hover:bg-gray-900 border-0 shadow-xl shadow-black/20 flex items-center gap-3 group"
                                >
                                    <span className="text-lg group-hover:scale-125 transition-transform">🎯</span>
                                    Start Mission
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* RITUAL RAIL: ESSENTIAL HABITS & RITUALS */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Daily Essentials</h3>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-tighter">Your Behavioral Foundation</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{dailyMetrics.essentialFidelity}% Fidelity</span>
                         <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${dailyMetrics.essentialFidelity}%` }} />
                         </div>
                    </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {[...rituals, ...staples].map(ritual => (
                        <RitualButton 
                            key={ritual.id} 
                            ritual={ritual} 
                            onToggle={(t: any) => updateTask(t.id, { completed: !t.completed })}
                        />
                    ))}
                    
                    {/* QUICK ADD BUTTON */}
                    <button
                        onClick={() => {
                            setIsAddingEssential(true);
                            setIsTodoInputOpen(true);
                        }}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                        title="Add Life Staple"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Add Staple</span>
                    </button>

                    {rituals.length === 0 && (
                        <p className="text-xs font-medium text-[var(--text-secondary)] italic opacity-30 py-2">No staples defined.</p>
                    )}
                </div>
            </section>

            {/* MAIN CONTENT: ERGONOMIC 70/30 SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-16 items-start">
                
                {/* PRIMARY: EXECUTION (Tasks) - 7 cols */}
                <div className="lg:col-span-7 space-y-10">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setFilterMode('ALL')}
                                className={clsx("text-xs font-black uppercase tracking-widest transition-all", filterMode === 'ALL' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] opacity-30 hover:opacity-100")}
                            >
                                All
                            </button>
                            <button 
                                onClick={() => setFilterMode('PENDING')}
                                className={clsx("text-xs font-black uppercase tracking-widest transition-all", filterMode === 'PENDING' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] opacity-30 hover:opacity-100")}
                            >
                                Pending
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-b border-[var(--border)] text-xs py-1 px-2 outline-none w-24 md:w-32 focus:w-40 transition-all font-medium"
                            />
                            
                            {/* MAIN LIST ADD BUTTON */}
                            <button
                                onClick={() => {
                                    setIsAddingEssential(false);
                                    setIsTodoInputOpen(true);
                                }}
                                className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] flex items-center justify-center hover:scale-110 transition-all shadow-lg active:scale-95"
                                title="Add Objective"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--border)]/30">
                        {activeTasks.length > 0 ? (
                            activeTasks.map(task => (
                                <TodoItem 
                                    key={task.id} 
                                    todo={task} 
                                    onToggle={(t: any) => updateTask(t.id, { completed: !t.completed })}
                                    onDelete={(id: string) => deleteTask(id)}
                                    onUpdateMetadata={(id: string, updates: any) => updateTask(id, updates)}
                                    onStartTask={startTask}
                                    onPauseTask={pauseTask}
                                    onStopTask={stopTask}
                                />
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <p className="text-xl font-black text-[var(--text-primary)] opacity-10 uppercase tracking-tighter italic">
                                    Horizon Clear
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECONDARY: ANALYTICS (Daily Pulse) - 3 cols */}
                <aside className="lg:col-span-3 space-y-12 lg:sticky lg:top-8">
                    {/* MOTIVATIONAL HOTSPOT: Circular Metric */}
                    <div className="flex flex-col items-center">
                        <CircularMetric 
                            value={dailyMetrics.primeProgress} 
                            label="Daily Prime Progress" 
                            sublabel="Morning Protocol"
                            color="#10b981"
                        />
                    </div>

                    <div className="space-y-10 px-2">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">System Vitals</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-primary)]">Workload</span>
                                    <span className={clsx("text-xs font-black uppercase tabular-nums px-2 py-0.5 rounded", dailyMetrics.workloadStatus === 'Overloaded' ? "text-red-500 bg-red-50" : "text-emerald-600 bg-emerald-50")}>
                                        {dailyMetrics.workloadStatus}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[var(--text-primary)]">Time Allocated</span>
                                    <span className="text-xs font-black tabular-nums">{Math.floor(dailyMetrics.totalEstimatedMins / 60)}h {dailyMetrics.totalEstimatedMins % 60}m</span>
                                </div>
                            </div>
                        </div>

                        {/* SUGGESTED ACTION (Planning Gap) */}
                        {!dailyMetrics.hasDeepWorkTasks && (
                            <div className="p-5 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col gap-4 text-center">
                                <p className="text-xs font-bold text-[var(--text-secondary)]">Deep Work block is empty.</p>
                                <button 
                                    className="btn-primary w-full h-10 bg-white text-black border border-gray-200 hover:border-black shadow-sm flex items-center justify-center gap-2 text-[10px] font-black uppercase"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Allocate Focus Session
                                </button>
                            </div>
                        )}

                        <div className="p-6 rounded-2xl bg-[var(--accent-soft)]/30 border border-[var(--accent-soft)]">
                            <p className="text-xs font-black text-[var(--accent)] uppercase tracking-widest mb-3 italic">Protocol Alpha</p>
                            <p className="text-[11px] leading-relaxed font-medium text-[var(--text-secondary)]">
                                "The first 90 minutes of the day define the quality of the next 14 hours. Protect your focus."
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            <RoutineBuilderModal 
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                template={routineTemplate}
                onSave={async (title, steps) => {
                    if (routineTemplate) await updateTask(routineTemplate.id, { title, subtasksJson: JSON.stringify(steps) });
                    else await addTask({ title, priority: 'URGENT', category: 'Habit', isRitual: true, subtasksJson: JSON.stringify(steps) });
                    success?.("Protocol redefined.");
                }}
            />

            <TodoInput 
                isOpen={isTodoInputOpen}
                onClose={() => {
                    setIsTodoInputOpen(false);
                    setIsAddingEssential(false);
                }}
                onAdd={addTask}
                selectedDate={todayStr}
                initialIsEssential={isAddingEssential}
            />
        </div>
    );
}
