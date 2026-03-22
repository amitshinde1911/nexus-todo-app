import React, { useState, useEffect } from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';

interface FocusTimerProps {
    focusTask: Task | null;
    setTab: (tab: string) => void;
    onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
}

export default function FocusTimer({ focusTask, setTab, onUpdateTask }: FocusTimerProps) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [durationMins, setDurationMins] = useState(25);
    const [totalDuration, setTotalDuration] = useState(25 * 60);
    const [ambientSound, setAmbientSound] = useState('none');
    const [distractions, setDistractions] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);

    // Derive active task display
    const activeTaskTitle = focusTask ? focusTask.title : null;
    const activeTaskSource = focusTask ? (
        focusTask.priority === 'URGENT' || focusTask.priority === 'HIGH'
            ? "Top Priority"
            : "Active Objective"
    ) : null;

    const estimatedSessions = focusTask
        ? Math.max(1, Math.ceil((focusTask.estimatedMins || 25) / durationMins))
        : null;
    const sessionLabel = estimatedSessions
        ? `${Math.min(sessionCount + 1, estimatedSessions)} / ${estimatedSessions}`
        : null;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            if (interval) clearInterval(interval);
            setIsActive(false);
            setSessionCount(s => s + 1);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const setPreset = (mins: number) => {
        setIsActive(false);
        setDurationMins(mins);
        setTimeLeft(mins * 60);
        setTotalDuration(mins * 60);
    };

    const handleLogDistraction = () => setDistractions(prev => prev + 1);

    const handleCompleteTask = async () => {
        if (focusTask && onUpdateTask) {
            setIsActive(false);
            await onUpdateTask(focusTask.id, { completed: true });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

    // SVG ring constants
    const size = 300;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const presets = [
        { label: '25m', mins: 25 },
        { label: '50m', mins: 50 },
        { label: '90m', mins: 90 },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in relative">
            
            {/* Ambient Pulse Glow */}
            <div className={clsx(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none transition-all duration-[3000ms]",
                isActive ? "bg-[var(--accent)] opacity-[0.08] scale-110" : "bg-[var(--accent)] opacity-[0.02] scale-90"
            )} />

            {/* Session Preset Bar */}
            <div className="relative z-10 w-full max-w-xs flex p-1 glass rounded-2xl mb-12">
                {presets.map(p => (
                    <button
                        key={p.mins}
                        onClick={() => setPreset(p.mins)}
                        className={clsx(
                            "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                            durationMins === p.mins 
                                ? "bg-white/10 text-[var(--text-primary)]" 
                                : "text-[var(--text-secondary)]/40 hover:text-[var(--text-secondary)]"
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Focused Objective Card */}
            <div className="relative z-10 text-center mb-16 px-6 w-full max-w-sm">
                {activeTaskTitle ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] rounded-full mb-4">
                            <div className={clsx("w-1.5 h-1.5 rounded-full bg-[var(--accent)]", isActive && "animate-pulse")} />
                            <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">
                                {activeTaskSource}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight line-clamp-2">
                            {activeTaskTitle}
                        </h2>
                        {sessionLabel && (
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                                Cycle {sessionLabel}
                            </p>
                        )}
                        
                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                onClick={handleCompleteTask}
                                className="btn-primary !h-10 text-[9px]"
                            >
                                Mark Objective Complete
                            </button>
                            <button
                                onClick={() => setTab && setTab('TODAY')}
                                className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-all"
                            >
                                Switch Focus
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-10 border-dashed border-white/5 group hover:border-[var(--accent)]/30 transition-all cursor-pointer" onClick={() => setTab && setTab('TODAY')}>
                        <p className="text-[9px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] mb-6">No Sector Selected</p>
                        <button
                            className="btn-secondary w-full text-[9px] font-black transition-all flex items-center justify-center gap-3"
                        >
                            Initialize Objective
                            <svg className="group-hover:translate-x-1 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Central Chronometer */}
            <div className="relative z-10 w-[320px] h-[320px] mb-16 flex items-center justify-center group">
                <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                    <circle cx={center} cy={center} r={radius} fill="transparent" className="stroke-white/5" strokeWidth={strokeWidth} />
                    <circle
                        cx={center} cy={center} r={radius} fill="transparent"
                        stroke="url(#timerGradient)" strokeWidth={strokeWidth}
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" className="transition-all duration-1000 ease-linear"
                    />
                    <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6C5CE7" />
                            <stop offset="100%" stopColor="#8B7CFF" />
                        </linearGradient>
                    </defs>
                </svg>

                <div className="relative text-center">
                    <div className="text-7xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter leading-none mb-4 group-hover:scale-105 transition-transform duration-700">
                        {formatTime(timeLeft)}
                    </div>
                    <div className={clsx(
                        "text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                        isActive ? "text-[var(--accent)] animate-pulse" : "text-[var(--text-secondary)]/20"
                    )}>
                        {isActive ? 'Execution Active' : 'Standby Mode'}
                    </div>
                </div>
            </div>

            {/* Core Controls */}
            <div className="relative z-10 flex items-center gap-8 mb-16">
                <button
                    onClick={() => { setTimeLeft(totalDuration); setIsActive(false); }}
                    className="btn-icon !w-12 !h-12 text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)]"
                    data-testid="timer-reset"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>

                <button
                    onClick={toggleTimer}
                    data-testid="timer-toggle"
                    className={clsx(
                        "w-20 h-20 rounded-[28px] flex items-center justify-center transition-all duration-500 hover:-translate-y-1 active:scale-95 shadow-2xl",
                        isActive 
                            ? "bg-white/5 border border-white/5 text-[var(--accent)]" 
                            : "bg-[var(--accent)] text-white shadow-[var(--accent)]/20"
                    )}
                >
                    {isActive ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    ) : (
                        <svg className="ml-1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                    )}
                </button>

                <button
                    onClick={handleLogDistraction}
                    data-testid="distraction-button"
                    className={clsx(
                        "btn-icon !w-12 !h-12 flex flex-col",
                        distractions > 0 ? "text-amber-500" : "text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)]"
                    )}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                    {distractions > 0 && <span className="text-[8px] font-black mt-0.5">{distractions}</span>}
                </button>
            </div>

            {/* Diagnostics Bar */}
            <div className="relative z-10 w-full max-w-[340px] flex p-6 glass rounded-[32px]">
                <div className="flex-1 text-center">
                    <p className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.2em] mb-2">Ambient</p>
                    <select
                        value={ambientSound}
                        onChange={e => setAmbientSound(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-[var(--text-primary)] outline-none cursor-pointer hover:text-[var(--accent)] transition-colors text-center w-full appearance-none"
                    >
                        <option value="none">Silenced</option>
                        <option value="rain">Precipitation</option>
                        <option value="cafe">Urban Noise</option>
                        <option value="noise">Gaussian</option>
                    </select>
                </div>
                <div className="w-px bg-white/5 mx-6 self-stretch" />
                <div className="flex-1 text-center cursor-pointer group" onClick={handleLogDistraction}>
                    <p className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.2em] mb-2">Internal Bias</p>
                    <p className={clsx(
                        "text-lg font-black transition-colors",
                        distractions > 0 ? "text-amber-500" : "text-[var(--text-primary)]"
                    )}>
                        {distractions.toString().padStart(2, '0')}
                    </p>
                </div>
            </div>
        </div>
    );
}
