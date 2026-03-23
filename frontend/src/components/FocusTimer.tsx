import React, { useState, useEffect } from 'react';
import { clsx } from '../lib/utils';
import { Task } from '../types';
import { useTimer } from '../hooks/useTimer';

interface FocusTimerProps {
    focusTask: Task | null;
    setTab: (tab: string) => void;
    onUpdateTask?: (id: string, updates: Partial<Task>) => Promise<void>;
    onStartTask?: (id: string) => Promise<void>;
    onPauseTask?: (id: string) => Promise<void>;
    onStopTask?: (id: string) => Promise<void>;
}

export default function FocusTimer({ focusTask, setTab, onUpdateTask, onStartTask, onPauseTask, onStopTask }: FocusTimerProps) {
    const { secondsElapsed } = useTimer(focusTask);
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
            ? "High Priority"
            : "Active Task"
    ) : null;

    const estimatedSessions = focusTask
        ? Math.max(1, Math.ceil((focusTask.estimatedMins || 25) / durationMins))
        : null;
    const sessionLabel = estimatedSessions
        ? `${Math.min(sessionCount + 1, estimatedSessions)} / ${estimatedSessions}`
        : null;

    useEffect(() => {
        if (focusTask?.status === 'IN_PROGRESS' && focusTask.startTime) {
            const remaining = (durationMins * 60) - secondsElapsed;
            setTimeLeft(Math.max(0, remaining));
            setIsActive(remaining > 0);
        } else {
            // Default behavior if no active task is synced
            // We'll keep the manual timer state for now if user just wants a generic timer
        }
    }, [secondsElapsed, focusTask?.status, durationMins]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        
        // Only run manual interval if NOT synced to a task
        if (!focusTask?.startTime && isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            setSessionCount(s => s + 1);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft, focusTask?.startTime]);

    const setPreset = (mins: number) => {
        setIsActive(false);
        setDurationMins(mins);
        setTimeLeft(mins * 60);
        setTotalDuration(mins * 60);
    };

    const toggleTimer = async () => {
        if (focusTask) {
            if (focusTask.status === 'IN_PROGRESS') {
                await onPauseTask?.(focusTask.id);
            } else {
                await onStartTask?.(focusTask.id);
            }
        } else {
            setIsActive(!isActive);
        }
    };

    const handleLogDistraction = () => setDistractions(prev => prev + 1);

    const handleCompleteTask = async () => {
        if (focusTask && onStopTask) {
            setIsActive(false);
            await onStopTask(focusTask.id);
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
            
            {/* Simplified Background */}
            <div className="absolute inset-0 bg-[var(--bg-main)] z-0" />

            {/* Session Preset Bar */}
            <div className="relative z-10 w-full max-w-xs flex p-1 bg-white border border-[var(--border)] rounded-lg mb-12">
                {presets.map(p => (
                    <button
                        key={p.mins}
                        onClick={() => setPreset(p.mins)}
                        className={clsx(
                            "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                            durationMins === p.mins 
                                ? "bg-gray-100 text-[var(--accent)]" 
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Focused Objective Card */}
            <div className="relative z-10 text-center mb-16 px-6 w-full max-w-sm">
                {activeTaskTitle ? (
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[var(--accent-soft)] rounded-full">
                            <div className={clsx("w-1.5 h-1.5 rounded-full bg-[var(--accent)]", isActive && "animate-pulse")} />
                            <span className="text-[10px] font-semibold text-[var(--accent)]">
                                {activeTaskSource}
                            </span>
                        </div>
                        <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
                            {activeTaskTitle}
                        </h2>
                        {sessionLabel && (
                            <p className="text-xs text-[var(--text-secondary)]">
                                Session {sessionLabel}
                            </p>
                        )}
                        
                        <div className="flex flex-col gap-2 mt-6">
                            <button
                                onClick={handleCompleteTask}
                                className="btn-primary !h-9 text-xs"
                            >
                                Complete task
                            </button>
                            <button
                                onClick={() => setTab && setTab('TODAY')}
                                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
                            >
                                Change task
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card p-8 border-dashed flex flex-col items-center" onClick={() => setTab && setTab('TODAY')}>
                        <p className="text-xs text-[var(--text-secondary)] mb-4">No task selected</p>
                        <button
                            className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
                        >
                            Select a task
                            <svg className="group-hover:translate-x-1 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Central Chronometer */}
            <div className="relative z-10 w-[300px] h-[300px] mb-12 flex items-center justify-center group">
                <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                    <circle cx={center} cy={center} r={radius} fill="transparent" className="stroke-gray-100" strokeWidth={strokeWidth} />
                    <circle
                        cx={center} cy={center} r={radius} fill="transparent"
                        stroke="var(--accent)" strokeWidth={strokeWidth}
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" className="transition-all duration-1000 ease-linear"
                    />
                </svg>

                <div className="relative text-center">
                    <div className="text-7xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tighter leading-none mb-3">
                        {formatTime(timeLeft)}
                    </div>
                    <div className={clsx(
                        "text-xs font-medium transition-all",
                        isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]/40"
                    )}>
                        {isActive ? 'Timer running' : 'Ready'}
                    </div>
                </div>
            </div>

            {/* Core Controls */}
            <div className="relative z-10 flex items-center gap-8 mb-12">
                <button
                    onClick={() => { setTimeLeft(totalDuration); setIsActive(false); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--text-primary)] transition-all"
                    data-testid="timer-reset"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>

                <button
                    onClick={toggleTimer}
                    data-testid="timer-toggle"
                    className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
                        isActive 
                            ? "bg-gray-100 text-[var(--accent)]" 
                            : "bg-[var(--accent)] text-white"
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
                        "w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all",
                        distractions > 0 ? "text-amber-500 bg-amber-50" : "text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--text-primary)]"
                    )}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                    {distractions > 0 && <span className="text-[10px] font-semibold">{distractions}</span>}
                </button>
            </div>

            {/* Diagnostics Bar */}
            <div className="relative z-10 w-full max-w-[340px] flex p-4 card rounded-xl">
                <div className="flex-1 text-center">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Soundscape</p>
                    <select
                        value={ambientSound}
                        onChange={e => setAmbientSound(e.target.value)}
                        className="bg-transparent text-xs font-medium text-[var(--text-primary)] outline-none cursor-pointer hover:text-[var(--accent)] transition-colors text-center w-full appearance-none"
                    >
                        <option value="none">None</option>
                        <option value="rain">Rain</option>
                        <option value="cafe">Cafe</option>
                        <option value="noise">White noise</option>
                    </select>
                </div>
                <div className="w-px bg-[var(--border)] mx-4 self-stretch" />
                <div className="flex-1 text-center cursor-pointer group" onClick={handleLogDistraction}>
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Distractions</p>
                    <p className={clsx(
                        "text-lg font-semibold transition-colors",
                        distractions > 0 ? "text-amber-500" : "text-[var(--text-primary)]"
                    )}>
                        {distractions.toString().padStart(2, '0')}
                    </p>
                </div>
            </div>
        </div>
    );
}
