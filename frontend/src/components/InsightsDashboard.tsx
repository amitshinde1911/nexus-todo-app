import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuthContext } from '../context/AuthContext';
import { clsx } from '../lib/utils';
import CircularMetric from './CircularMetric';

const CATEGORY_COLORS: Record<string, string> = {
    Work: 'var(--text-primary)',
    Health: '#10b981',
    Study: '#8b5cf6',
    Finance: '#f59e0b',
    Errands: '#ef4444',
    Personal: '#06b6d4',
    Habit: '#10b981',
};

interface InsightsDashboardProps {
    setTab: (tab: string) => void;
}

export default function InsightsDashboard({ setTab }: InsightsDashboardProps) {
    const { user } = useAuthContext();
    const { tasks, rituals, loading, dailyMetrics } = useTasks(user?.uid);
    const [scope, setScope] = useState('week');

    const allData = useMemo(() => [...tasks, ...rituals].filter(t => !t.deleted), [tasks, rituals]);

    const todayStr = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    const scopedData = useMemo(() => {
        return allData.filter(t => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            if (scope === 'today') return t.dueDate === todayStr;
            if (scope === 'week') return taskDate >= weekAgo;
            return taskDate >= monthAgo;
        });
    }, [allData, scope, todayStr]);

    const completedInScope = scopedData.filter(t => t.completed);
    const totalInScope = scopedData.length;
    const planAccuracy = totalInScope === 0 ? 0 : Math.round((completedInScope.length / totalInScope) * 100);

    const totalFocusMins = scopedData.reduce((acc, t) => acc + (t.actualMins || 0), 0);
    const ritualCount = scopedData.filter(t => t.isRitual).length;
    const ritualCompletionRate = ritualCount === 0 ? 0 : Math.round((scopedData.filter(t => t.isRitual && t.completed).length / ritualCount) * 100);

    const currentStreak = useMemo(() => {
        const completedDates = [...new Set(
            allData.filter(t => t.completed && t.dueDate).map(t => t.dueDate)
        )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        let streak = 0;
        let date = new Date();
        date.setHours(0, 0, 0, 0);

        for (let i = 0; i < 60; i++) {
            const ds = date.toISOString().split('T')[0];
            if (completedDates.includes(ds)) {
                streak++;
                date.setDate(date.getDate() - 1);
            } else if (i === 0) {
                date.setDate(date.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }, [allData]);

    const categoryCounts = useMemo(() => {
        const counts: any[] = [];
        Object.keys(CATEGORY_COLORS).forEach(cat => {
            const count = completedInScope.filter(t => t.category === cat || (cat === 'Habit' && t.isRitual)).length;
            if (count > 0) {
                counts.push({
                    name: cat,
                    count,
                    color: CATEGORY_COLORS[cat]
                });
            }
        });
        return counts.sort((a, b) => b.count - a.count);
    }, [completedInScope]);

    if (loading) return <div className="p-8 text-center animate-pulse text-[var(--text-secondary)] font-bold">SYNCHRONIZING ASSETS...</div>;

    return (
        <div className="pb-20 animate-fade-in space-y-12 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">
                        Nexus Analytics
                    </h1>
                    <p className="text-sm font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-[0.2em]">
                        Executive Performance Intel
                    </p>
                </div>

                <div className="flex p-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl w-full md:w-72 shadow-sm">
                    {['today', 'week', 'month'].map(s => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            className={clsx(
                                "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                scope === s ? "bg-[var(--text-primary)] text-white shadow-lg" : "text-[var(--text-secondary)] hover:bg-gray-50"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </header>

            {/* PERFORMANCE HOTSPOTS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* STREAK CARD: 5 cols */}
                <div className="lg:col-span-5 card p-10 bg-black text-white relative overflow-hidden group border-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                </span>
                                Momentum Active
                            </div>
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Global Streak</h3>
                            <p className="text-8xl font-black tracking-tighter leading-none">
                                {currentStreak.toString().padStart(2, '0')}
                            </p>
                            <p className="text-sm font-bold text-white/60">Consecutive Days Executed</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <p className="text-[11px] font-medium text-white/40 leading-relaxed italic">
                                "The chain is strong, but focus is its only master. Protect the streak."
                            </p>
                        </div>
                    </div>
                </div>

                {/* METRICS GRID: 7 cols */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-8 flex flex-col justify-between hover:border-[var(--text-primary)] transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Objectives Neutralized</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-5xl font-black tabular-nums">{completedInScope.length}</span>
                            <span className="text-xs font-bold text-[var(--text-secondary)]">Targets</span>
                        </div>
                    </div>

                    <div className="card p-8 flex flex-col justify-between hover:border-emerald-500 transition-all border-[var(--border)]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Protocol Fidelity</span>
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tabular-nums text-emerald-500">{ritualCompletionRate}%</span>
                            </div>
                            <CircularMetric value={ritualCompletionRate} label="" size={60} strokeWidth={6} color="#10b981" />
                        </div>
                    </div>

                    <div className="card p-8 flex flex-col justify-between hover:border-blue-500 transition-all border-[var(--border)]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Execution Time</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-5xl font-black tabular-nums text-blue-500">
                                {totalFocusMins < 60 ? `${totalFocusMins}m` : `${(totalFocusMins/60).toFixed(1)}h`}
                            </span>
                            <span className="text-xs font-bold text-blue-500/60 uppercase">logged</span>
                        </div>
                    </div>

                    <div className="card p-8 flex flex-col justify-between hover:border-amber-500 transition-all border-[var(--border)]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Planning Confidence</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className={clsx(
                                "text-5xl font-black tabular-nums",
                                planAccuracy >= 70 ? "text-emerald-500" : "text-amber-500"
                            )}>{planAccuracy}%</span>
                            <span className="text-xs font-bold text-[var(--text-secondary)]">Accuracy</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* STRATEGIC DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                <section className="space-y-6">
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight px-1">Attention Allocation</h3>
                    <div className="card p-10 space-y-8">
                        {categoryCounts.length === 0 ? (
                            <div className="py-20 text-center opacity-20 italic">No historical data available for this scope.</div>
                        ) : (
                            categoryCounts.map((cat) => {
                                const pct = Math.round((cat.count / (completedInScope.length || 1)) * 100);
                                return (
                                    <div key={cat.name} className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                                                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{cat.name}</span>
                                            </div>
                                            <span className="text-lg font-black tabular-nums tracking-tighter" style={{ color: cat.color }}>{pct}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full transition-all duration-[1500ms] ease-out" style={{ width: `${pct}%`, background: cat.color }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight px-1">Efficiency Metrics</h3>
                    <div className="card p-10 bg-[var(--accent-soft)]/20 border-dashed border-2 border-[var(--accent-soft)] flex flex-col justify-center gap-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Average Pace</p>
                            <p className="text-4xl font-black text-[var(--text-primary)] tabular-nums">
                                {completedInScope.length === 0 ? 0 : Math.round(totalFocusMins / completedInScope.length)}m
                                <span className="text-sm font-bold text-[var(--text-secondary)] ml-3">per objective</span>
                            </p>
                        </div>
                        <div className="space-y-2 pt-6 border-t border-[var(--accent-soft)]">
                            <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Ritual Stability</p>
                            <p className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed">
                                You are completing <span className="text-[var(--text-primary)] font-black">{dailyMetrics.primeProgress}%</span> of your morning routines.
                                {dailyMetrics.primeProgress >= 80 ? " High executive function detected." : " Focus on your ritual fidelity."}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* BEHAVIORAL LOG [NEW] */}
            <section className="space-y-8 pt-12">
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Behavioral Audit</h3>
                        <p className="text-xs font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest leading-none">Reality Timing vs. Daily Intent</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Clock Stability: {dailyMetrics.essentialFidelity}%
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {useMemo(() => {
                        const staples = allData.filter(t => t.isEssential && !t.isRitual);
                        const habitGroups = [...new Set(staples.map(s => s.title))];

                        if (habitGroups.length === 0) {
                            return <div className="card p-20 text-center opacity-20 italic font-medium">No behavioral staples defined yet.</div>;
                        }

                        return habitGroups.map(title => {
                            const instances = staples.filter(s => s.title === title && s.completed && s.completedAt)
                                .sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                                .slice(0, 7);
                            
                            const lastCompletion = instances[0];
                            const lastTime = lastCompletion?.completedAt ? new Date(lastCompletion.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

                            return (
                                <div key={title} className="card p-8 group hover:border-emerald-500/50 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{title}</h4>
                                            </div>
                                            <p className="text-xs font-bold text-[var(--text-secondary)]">
                                                Latest: <span className="text-emerald-600">{lastTime}</span> 
                                                <span className="mx-2 opacity-20">|</span>
                                                <span className="opacity-50">7-Day Consistency</span>
                                            </p>
                                        </div>

                                        <div className="flex-1 max-w-xl">
                                            <div className="flex items-end justify-between h-16 gap-2 px-4">
                                                {Array.from({length: 7}).map((_, i) => {
                                                    const date = new Date(); date.setDate(date.getDate() - (6 - i));
                                                    const ds = date.toISOString().split('T')[0];
                                                    const instance = staples.find(s => s.title === title && s.dueDate === ds && s.completed);
                                                    
                                                    // Map completion time to a height (normalized to morning/evening or just generic)
                                                    let height = 0;
                                                    let timeLabel = '';
                                                    if (instance?.completedAt) {
                                                        const d = new Date(instance.completedAt);
                                                        const mins = d.getHours() * 60 + d.getMinutes();
                                                        // Example: map 4am (240) to 11pm (1380)
                                                        height = Math.max(10, Math.min(100, ((mins - 240) / (1380 - 240)) * 100));
                                                        timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    }

                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                                            <div className="relative w-full h-12 bg-gray-50 dark:bg-white/5 rounded-t-lg overflow-hidden border-x border-t border-transparent group-hover/bar:border-emerald-500/20">
                                                                {instance && (
                                                                    <div 
                                                                        className="absolute bottom-0 left-0 w-full bg-emerald-500 transition-all duration-1000 group-hover/bar:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                                        style={{ height: `${height}%` }}
                                                                    />
                                                                )}
                                                                {instance && (
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                                                        <span className="text-[8px] font-black text-white bg-black/80 px-1 rounded transform -rotate-90 origin-center whitespace-nowrap">{timeLabel}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[8px] font-black text-[var(--text-secondary)] opacity-30 uppercase">{['S','M','T','W','T','F','S'][date.getDay()]}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                    }, [allData])}
                </div>
            </section>

            {/* Strategic Portal CTA */}
            <button
                onClick={() => setTab('TODAY')}
                className="group w-full p-8 rounded-2xl bg-[var(--text-primary)] text-white transition-all duration-300 hover:bg-[var(--accent)] flex items-center justify-between gap-6 active:scale-[0.99]"
            >
                <div className="text-left space-y-1">
                    <h4 className="text-xl font-semibold tracking-tight">Return to Mission Control</h4>
                    <p className="text-sm opacity-60">Back to your daily dashboard</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </div>
            </button>
        </div>
    );
}
