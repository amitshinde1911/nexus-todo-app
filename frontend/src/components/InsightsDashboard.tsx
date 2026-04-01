import { useState } from 'react';
import { clsx } from '../lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
    Work: 'var(--primary-color)',
    Health: '#10b981',
    Study: '#8b5cf6',
    Finance: '#f59e0b',
    Errands: '#ef4444',
    Personal: '#06b6d4',
};

interface InsightsDashboardProps {
    todos: any[];
    setTab: (tab: string) => void;
}

export default function InsightsDashboard({ todos, setTab }: InsightsDashboardProps) {
    const [scope, setScope] = useState('week'); // 'today' | 'week' | 'month'

    const todayStr = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    const scopedTodos = todos.filter(t => {
        if (!t.dueDate) return false;
        if (scope === 'today') return t.dueDate === todayStr;
        if (scope === 'week') return new Date(t.dueDate) >= weekAgo;
        return new Date(t.dueDate) >= monthAgo;
    });

    const completedInScope = scopedTodos.filter(t => t.completed);
    const completedCount = completedInScope.length;
    const totalInScope = scopedTodos.length;
    const planAccuracy = totalInScope === 0 ? 0 : Math.round((completedCount / totalInScope) * 100);

    const totalFocusMins = completedInScope.reduce((acc, t) => acc + (t.actualMins || 0), 0);
    const avgCompletionMins = completedCount === 0 ? 0 : Math.round(totalFocusMins / completedCount);

    const calculateStreak = () => {
        const completedDates = [...new Set(
            todos.filter(t => t.completed && t.dueDate).map(t => t.dueDate)
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
    };
    const currentStreak = calculateStreak();

    const categories = Object.keys(CATEGORY_COLORS);
    const categoryCounts = categories.map(cat => ({
        name: cat,
        count: completedInScope.filter(t => t.category === cat).length,
        color: CATEGORY_COLORS[cat],
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    const scopeLabel = scope === 'today' ? 'Today' : scope === 'week' ? 'This Week' : 'This Month';

    const ScopeTab = ({ id, label }: { id: string; label: string }) => (
        <button
            onClick={() => setScope(id)}
            className={clsx(
                "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                scope === id 
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="pb-10 animate-fade-in space-y-10">
            {/* Intel Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                        Performance Insights
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]/60 tracking-tight">
                        Analyze your productivity trends and stay on track.
                    </p>
                </div>

                {/* Scope Switcher */}
                <div className="flex p-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg w-full md:w-64">
                    <ScopeTab id="today" label="Today" />
                    <ScopeTab id="week" label="Week" />
                    <ScopeTab id="month" label="Month" />
                </div>
            </div>

            {/* Core Momentum Card */}
            <div className="card p-8 group overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[var(--accent-soft)] rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                            <span className="text-[10px] font-semibold text-[var(--accent)]">Goal streak</span>
                        </div>
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] tracking-tight">Active streak</h3>
                        <p className={clsx(
                            "text-7xl font-semibold tracking-tighter transition-all duration-700",
                            currentStreak > 0 ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                        )}>
                            {currentStreak.toString().padStart(2, '0')}<span className="text-xl ml-3 font-medium text-[var(--text-secondary)]/20">{currentStreak === 1 ? 'day' : 'days'}</span>
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
                            {currentStreak === 0 
                                ? "Start your streak by completing a task today!" 
                                : `Keep it up! Consistency is key to reaching your goals.`}
                        </p>
                    </div>
                    <div className={clsx(
                        "text-7xl transition-all duration-700",
                        currentStreak > 0 ? "grayscale-0" : "grayscale opacity-10"
                    )}>
                        🔥
                    </div>
                </div>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="card p-6 group">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-4 transition-colors">Tasks completed</p>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-semibold text-[var(--text-primary)] tracking-tighter tabular-nums leading-none">
                            {completedCount.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]/40 mb-1">{scopeLabel}</span>
                    </div>
                </div>

                <div className="card p-6 group">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-4 transition-colors">Focus time</p>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-semibold text-[var(--text-primary)] tracking-tighter tabular-nums leading-none">
                            {totalFocusMins < 60 ? `${totalFocusMins}m` : `${(totalFocusMins/60).toFixed(1)}h`}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]/40 mb-1">TotalLogged</span>
                    </div>
                </div>

                <div className="card p-6 group">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-4 transition-colors">Avg. pace</p>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-semibold text-[var(--text-primary)] tracking-tighter tabular-nums leading-none text-blue-500">
                            {avgCompletionMins}m
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]/40 mb-1">per objective</span>
                    </div>
                </div>

                <div className="card p-6 group">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-4 transition-colors">Planning accuracy</p>
                    <div className="flex items-end gap-3">
                        <span className={clsx(
                            "text-4xl font-semibold tracking-tighter tabular-nums leading-none transition-colors",
                            planAccuracy >= 70 ? "text-emerald-500" : planAccuracy >= 40 ? "text-amber-500" : "text-[var(--text-primary)]"
                        )}>
                            {planAccuracy}%
                        </span>
                        <svg className={clsx(
                            "w-6 h-6 mb-1 transition-all",
                            planAccuracy >= 70 ? "text-emerald-500" : "text-[var(--text-secondary)]/5"
                        )} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                    </div>
                </div>
            </div>

            {/* Attention Distribution */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">Time distribution</h3>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-tight">by category</span>
                </div>
                
                <div className="card p-8">
                    {categoryCounts.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-[var(--text-secondary)]">No data available yet</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {categoryCounts.map((cat) => {
                                const pct = Math.round((cat.count / completedCount) * 100);
                                return (
                                    <div key={cat.name} className="group">
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-sm" style={{ background: cat.color }} />
                                                <span className="text-xs font-semibold text-[var(--text-secondary)]">{cat.name}</span>
                                            </div>
                                            <span className="text-xl font-semibold tabular-nums tracking-tighter" style={{ color: cat.color }}>
                                                {pct}<span className="text-xs ml-0.5 opacity-20">%</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000 ease-out" 
                                                style={{ width: `${pct}%`, background: cat.color }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Strategic Portal CTA */}
            <button
                onClick={() => setTab('INSIGHTS')}
                className="group w-full p-8 rounded-2xl bg-[var(--text-primary)] text-white transition-all duration-300 hover:bg-[var(--accent)] flex items-center justify-between gap-6 active:scale-[0.99]"
            >
                <div className="text-left space-y-1">
                    <h4 className="text-xl font-semibold tracking-tight">View weekly summary</h4>
                    <p className="text-sm opacity-60">Review your progress and plan your next week</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </div>
            </button>
        </div>
    );
}
