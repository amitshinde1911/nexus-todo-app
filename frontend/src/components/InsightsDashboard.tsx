import React, { useState } from 'react';
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
                "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                scope === id 
                    ? "bg-white/10 text-[var(--text-primary)] shadow-sm" 
                    : "text-[var(--text-secondary)]/40 hover:text-[var(--text-secondary)]"
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
                        Operational Intelligence
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]/60 tracking-tight">
                        Decoding your productivity rhythms and performance vectors.
                    </p>
                </div>

                {/* Scope Switcher */}
                <div className="flex p-1 glass rounded-xl w-full md:w-64">
                    <ScopeTab id="today" label="Today" />
                    <ScopeTab id="week" label="Week" />
                    <ScopeTab id="month" label="Month" />
                </div>
            </div>

            {/* Core Momentum Card */}
            <div className="relative overflow-hidden glass-card p-10 group transition-all">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] rounded-full mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">Execution Momentum</span>
                        </div>
                        <h3 className="text-xs font-bold text-[var(--text-secondary)]/60 uppercase tracking-widest">Active Streak</h3>
                        <p className={clsx(
                            "text-7xl font-black tracking-tighter transition-all duration-700",
                            currentStreak > 0 ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                        )}>
                            {currentStreak.toString().padStart(2, '0')}<span className="text-xl ml-3 font-black text-[var(--text-secondary)]/20">{currentStreak === 1 ? 'DAY' : 'DAYS'}</span>
                        </p>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] max-w-sm leading-relaxed">
                            {currentStreak === 0 
                                ? "Initialize sequence by completing your first objective today." 
                                : `Maintain the current frequency to stabilize your productivity wave.`}
                        </p>
                    </div>
                    <div className={clsx(
                        "text-8xl transition-all duration-1000",
                        currentStreak > 0 ? "grayscale-0 group-hover:scale-110 drop-shadow-[0_0_30px_rgba(124,108,255,0.3)]" : "grayscale opacity-[0.05]"
                    )}>
                        🔥
                    </div>
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)] opacity-[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-10 group">
                    <p className="text-[10px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.3em] mb-4 group-hover:text-[var(--accent)] transition-colors">Objectives Secured</p>
                    <div className="flex items-end gap-3">
                        <span className="text-6xl font-black text-[var(--text-primary)] tracking-tighter tabular-nums leading-none">
                            {completedCount.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-secondary)]/40 uppercase mb-2 tracking-widest">/ {scopeLabel}</span>
                    </div>
                </div>

                <div className="glass-card p-10 group">
                    <p className="text-[10px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.3em] mb-4 group-hover:text-[var(--accent)] transition-colors">Protocol Precision</p>
                    <div className="flex items-end gap-3">
                        <span className={clsx(
                            "text-6xl font-black tracking-tighter tabular-nums leading-none transition-colors",
                            planAccuracy >= 70 ? "text-emerald-500" : planAccuracy >= 40 ? "text-amber-500" : "text-[var(--text-primary)]"
                        )}>
                            {planAccuracy}%
                        </span>
                        <svg className={clsx(
                            "w-8 h-8 mb-2 transition-all duration-700",
                            planAccuracy >= 70 ? "text-emerald-500" : "text-[var(--text-secondary)]/10"
                        )} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12l5 5L20 7"/></svg>
                    </div>
                </div>
            </div>

            {/* Attention Distribution */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Attention Vectors</h3>
                    <span className="text-[10px] font-black text-[var(--text-secondary)]/30 uppercase tracking-widest">by Department</span>
                </div>
                
                <div className="glass-card p-10 relative overflow-hidden">
                    {categoryCounts.length === 0 ? (
                        <div className="py-12 text-center space-y-4">
                            <p className="text-sm font-bold text-[var(--text-secondary)]/30 uppercase tracking-widest">No Sector Data Available</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {categoryCounts.map((cat, idx) => {
                                const pct = Math.round((cat.count / completedCount) * 100);
                                return (
                                    <div key={cat.name} className="group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-4 h-4 rounded shadow-lg" style={{ background: cat.color }} />
                                                <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">{cat.name}</span>
                                            </div>
                                            <span className="text-xl font-black tabular-nums tracking-tighter" style={{ color: cat.color }}>
                                                {pct}<span className="text-[10px] ml-1 opacity-20">%</span>
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110" 
                                                style={{ width: `${pct}%`, background: cat.color, boxShadow: `0 0 16px ${cat.color}40` }} 
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
                className="group w-full p-10 rounded-[32px] bg-[var(--text-primary)] text-[var(--bg-main)] transition-all duration-500 hover:bg-[var(--accent)] hover:text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl active:scale-[0.98]"
            >
                <div className="text-center md:text-left space-y-2">
                    <h4 className="text-2xl font-bold tracking-tight leading-none group-hover:translate-x-2 transition-transform duration-500">Initiate Weekly Debrief</h4>
                    <p className="text-sm font-medium opacity-50 tracking-tight">Audit performance · Log milestones · Recalibrate focus vectors.</p>
                </div>
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M7 17l10-10M7 7h10v10"/></svg>
                </div>
            </button>
        </div>
    );
}
